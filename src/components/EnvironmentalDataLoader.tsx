import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, MapPin, Factory, Droplets } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  address: string;
  state?: string;
  zip?: string;
  county?: string;
}

interface ContaminationSite {
  name: string;
  type: string;
  status: string;
  distance: number;
  address: string;
  contaminants?: string[];
  riskLevel: 'High' | 'Medium' | 'Low';
}

interface WaterViolation {
  systemName: string;
  violationType: string;
  contaminant: string;
  level: number;
  mcl: number;
  date: string;
  riskLevel: 'High' | 'Medium' | 'Low';
}

interface EnvironmentalData {
  contaminationSites: ContaminationSite[];
  waterViolations: WaterViolation[];
  toxicFacilities: ContaminationSite[];
  loading: boolean;
  errors: string[];
  lastUpdated?: string;
}

interface Props {
  location: Location;
}

const EnvironmentalDataLoader: React.FC<Props> = ({ location }) => {
  const [data, setData] = useState<EnvironmentalData>({
    contaminationSites: [],
    waterViolations: [],
    toxicFacilities: [],
    loading: false,
    errors: []
  });

  const callNetlifyAPI = async (endpoint: string, params: Record<string, string> = {}) => {
    const queryParams = new URLSearchParams({
      endpoint,
      ...params
    });
    
    const response = await fetch(`/.netlify/functions/epa-api?${queryParams}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || `Failed to fetch ${endpoint} data`);
    }
    
    return result.data;
  };

  const loadEnvironmentalData = async () => {
    setData(prev => ({ ...prev, loading: true, errors: [] }));
    
    const errors: string[] = [];
    let contaminationSites: ContaminationSite[] = [];
    let waterViolations: WaterViolation[] = [];
    let toxicFacilities: ContaminationSite[] = [];
    
    try {
      // Load CERCLIS contaminated sites
      console.log('Loading CERCLIS data...');
      try {
        const cerclisData = await callNetlifyAPI('cerclis', {
          lat: location.lat.toString(),
          lon: location.lng.toString()
        });
        
        if (cerclisData && Array.isArray(cerclisData)) {
          contaminationSites = cerclisData
            .filter(site => site.SITE_NAME && site.LATITUDE && site.LONGITUDE)
            .map(site => {
              const distance = calculateDistance(
                location.lat, location.lng,
                parseFloat(site.LATITUDE), parseFloat(site.LONGITUDE)
              );
              
              return {
                name: site.SITE_NAME,
                type: 'CERCLIS Contaminated Site',
                status: site.CONSTRUCTION_COMPLETION_DATE ? 'Remediated' : 'Active',
                distance: distance,
                address: `${site.ADDRESS || ''} ${site.CITY || ''}, ${site.STATE || ''}`.trim(),
                contaminants: site.CONTAMINANT_NAME ? [site.CONTAMINANT_NAME] : [],
                riskLevel: distance < 0.5 ? 'High' : distance < 1.0 ? 'Medium' : 'Low' as 'High' | 'Medium' | 'Low'
              };
            })
            .filter(site => site.distance <= 2.0) // Within 2 miles
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10);
        }
        console.log(`Loaded ${contaminationSites.length} CERCLIS sites`);
      } catch (error) {
        console.error('CERCLIS API error:', error);
        errors.push(`CERCLIS data unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Load LUST (Leaking Underground Storage Tanks)
      console.log('Loading LUST data...');
      try {
        const lustData = await callNetlifyAPI('lust', {
          state: location.state || 'MD'
        });
        
        if (lustData && Array.isArray(lustData)) {
          const lustSites = lustData
            .filter(site => site.LATITUDE && site.LONGITUDE)
            .map(site => {
              const distance = calculateDistance(
                location.lat, location.lng,
                parseFloat(site.LATITUDE), parseFloat(site.LONGITUDE)
              );
              
              return {
                name: site.FACILITY_NAME || 'Underground Storage Tank Site',
                type: 'LUST - Petroleum Contamination',
                status: site.CLEANUP_STATUS || 'Unknown',
                distance: distance,
                address: `${site.ADDRESS || ''} ${site.CITY || ''}, ${site.STATE || ''}`.trim(),
                contaminants: ['Petroleum', 'Gasoline', 'Diesel'],
                riskLevel: distance < 0.25 ? 'High' : distance < 0.5 ? 'Medium' : 'Low' as 'High' | 'Medium' | 'Low'
              };
            })
            .filter(site => site.distance <= 1.0) // Within 1 mile for petroleum
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5);
            
          contaminationSites = [...contaminationSites, ...lustSites];
        }
        console.log(`Added ${lustData?.length || 0} LUST sites`);
      } catch (error) {
        console.error('LUST API error:', error);
        errors.push(`LUST data unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Load water quality violations
      console.log('Loading water violations...');
      try {
        const waterData = await callNetlifyAPI('water-violations', {
          zip: location.zip || ''
        });
        
        if (waterData && Array.isArray(waterData)) {
          waterViolations = waterData
            .filter(violation => violation.VIOLATION_DATE && violation.CONTAMINANT_CODE)
            .map(violation => ({
              systemName: violation.PWS_NAME || 'Public Water System',
              violationType: violation.VIOLATION_CATEGORY_CODE || 'Unknown',
              contaminant: violation.CONTAMINANT_CODE,
              level: parseFloat(violation.ANALYTICAL_RESULT_VALUE) || 0,
              mcl: parseFloat(violation.MCL_VALUE) || 0,
              date: violation.VIOLATION_DATE,
              riskLevel: violation.HEALTH_BASED_IND === 'Y' ? 'High' : 'Medium' as 'High' | 'Medium' | 'Low'
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
        }
        console.log(`Loaded ${waterViolations.length} water violations`);
      } catch (error) {
        console.error('Water violations API error:', error);
        errors.push(`Water quality data unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Load TRI toxic facilities
      console.log('Loading TRI facilities...');
      try {
        const triData = await callNetlifyAPI('tri', {
          state: location.state || 'MD'
        });
        
        if (triData && Array.isArray(triData)) {
          toxicFacilities = triData
            .filter(facility => facility.LATITUDE && facility.LONGITUDE)
            .map(facility => {
              const distance = calculateDistance(
                location.lat, location.lng,
                parseFloat(facility.LATITUDE), parseFloat(facility.LONGITUDE)
              );
              
              return {
                name: facility.FACILITY_NAME || 'Industrial Facility',
                type: 'TRI - Toxic Release Inventory',
                status: facility.REPORTING_STATUS || 'Active',
                distance: distance,
                address: `${facility.STREET_ADDRESS || ''} ${facility.CITY || ''}, ${facility.STATE || ''}`.trim(),
                contaminants: facility.CHEMICAL ? [facility.CHEMICAL] : [],
                riskLevel: distance < 0.5 ? 'High' : distance < 1.5 ? 'Medium' : 'Low' as 'High' | 'Medium' | 'Low'
              };
            })
            .filter(facility => facility.distance <= 3.0) // Within 3 miles
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 15);
        }
        console.log(`Loaded ${toxicFacilities.length} TRI facilities`);
      } catch (error) {
        console.error('TRI API error:', error);
        errors.push(`TRI facility data unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    } catch (error) {
      console.error('General environmental data error:', error);
      errors.push(`Environmental data loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setData({
      contaminationSites,
      waterViolations,
      toxicFacilities,
      loading: false,
      errors,
      lastUpdated: new Date().toISOString()
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-700 bg-red-50';
      case 'Medium': return 'text-yellow-700 bg-yellow-50';
      case 'Low': return 'text-green-700 bg-green-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'High': return <AlertTriangle className="w-4 h-4" />;
      case 'Medium': return <Clock className="w-4 h-4" />;
      case 'Low': return <CheckCircle className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    if (location.lat && location.lng) {
      loadEnvironmentalData();
    }
  }, [location]);

  if (data.loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Loading environmental contamination data...</span>
        </div>
      </div>
    );
  }

  const totalRiskSites = data.contaminationSites.length + data.toxicFacilities.length;
  const highRiskSites = [...data.contaminationSites, ...data.toxicFacilities].filter(site => site.riskLevel === 'High').length;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
          Environmental Contamination Assessment
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-700">{totalRiskSites}</div>
            <div className="text-sm text-red-600">Contamination Sources Found</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-700">{highRiskSites}</div>
            <div className="text-sm text-orange-600">High Risk Sites</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{data.waterViolations.length}</div>
            <div className="text-sm text-blue-600">Water Quality Violations</div>
          </div>
        </div>

        {data.errors.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Data Source Limitations:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              {data.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Contamination Sites */}
      {data.contaminationSites.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Factory className="w-5 h-5 mr-2 text-red-500" />
            Soil Contamination Sites ({data.contaminationSites.length})
          </h3>
          
          <div className="space-y-3">
            {data.contaminationSites.map((site, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{site.name}</h4>
                    <p className="text-sm text-gray-600">{site.type}</p>
                    <p className="text-xs text-gray-500">{site.address}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(site.riskLevel)} flex items-center`}>
                    {getRiskIcon(site.riskLevel)}
                    <span className="ml-1">{site.riskLevel} Risk</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Distance: {site.distance.toFixed(2)} miles</span>
                  <span className="text-gray-600">Status: {site.status}</span>
                </div>
                
                {site.contaminants && site.contaminants.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">Contaminants: </span>
                    <span className="text-xs text-gray-700">{site.contaminants.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Water Quality Violations */}
      {data.waterViolations.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Droplets className="w-5 h-5 mr-2 text-blue-500" />
            Water Quality Violations ({data.waterViolations.length})
          </h3>
          
          <div className="space-y-3">
            {data.waterViolations.map((violation, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{violation.systemName}</h4>
                    <p className="text-sm text-gray-600">Contaminant: {violation.contaminant}</p>
                    <p className="text-xs text-gray-500">Level: {violation.level} (MCL: {violation.mcl})</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(violation.riskLevel)} flex items-center`}>
                    {getRiskIcon(violation.riskLevel)}
                    <span className="ml-1">{violation.riskLevel} Risk</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Type: {violation.violationType}</span>
                  <span className="text-gray-600">Date: {new Date(violation.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toxic Facilities */}
      {data.toxicFacilities.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Factory className="w-5 h-5 mr-2 text-purple-500" />
            Toxic Release Inventory Facilities ({data.toxicFacilities.length})
          </h3>
          
          <div className="space-y-3">
            {data.toxicFacilities.slice(0, 10).map((facility, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{facility.name}</h4>
                    <p className="text-sm text-gray-600">{facility.type}</p>
                    <p className="text-xs text-gray-500">{facility.address}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(facility.riskLevel)} flex items-center`}>
                    {getRiskIcon(facility.riskLevel)}
                    <span className="ml-1">{facility.riskLevel} Risk</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Distance: {facility.distance.toFixed(2)} miles</span>
                  <span className="text-gray-600">Status: {facility.status}</span>
                </div>
                
                {facility.contaminants && facility.contaminants.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">Chemicals: </span>
                    <span className="text-xs text-gray-700">{facility.contaminants.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {totalRiskSites === 0 && data.waterViolations.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">No Major Environmental Concerns Found</h3>
              <p className="text-green-700">No contamination sites or water quality violations detected in the immediate area.</p>
            </div>
          </div>
        </div>
      )}

      {data.lastUpdated && (
        <div className="text-xs text-gray-500 text-center">
          Last updated: {new Date(data.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default EnvironmentalDataLoader;