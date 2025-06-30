import React, { useState, useEffect, useCallback } from 'react';
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
  chemicals?: string;
  releases?: string;
  industry?: string;
}

interface WaterViolation {
  systemName: string;
  violationType: string;
  contaminant: string;
  level?: number;
  mcl?: number;
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
  debug?: any;
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

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const loadTRIData = useCallback(async () => {
    if (!location.state) return [];

    try {
      console.log(`Loading TRI data for ${location.state}...`);
      
      const response = await fetch(`/data/tri/TRI_2023_${location.state}.csv`);
      if (!response.ok) {
        throw new Error(`TRI file not found for ${location.state} (${response.status})`);
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('TRI file appears to be empty or invalid');
      }

      console.log(`TRI CSV loaded: ${lines.length} lines`);
      
      // Parse header
      const headers = parseCSVLine(lines[0]);
      console.log('TRI Headers found:', headers.slice(0, 15));
      
      // Find column indices
      const facilityNameIndex = headers.findIndex(h => h.includes('FACILITY NAME'));
      const streetIndex = headers.findIndex(h => h.includes('STREET ADDRESS'));
      const cityIndex = headers.findIndex(h => h.includes('CITY'));
      const stateIndex = headers.findIndex(h => h.includes('ST') && !h.includes('STREET'));
      const latIndex = headers.findIndex(h => h.includes('LATITUDE'));
      const lonIndex = headers.findIndex(h => h.includes('LONGITUDE'));
      const chemicalIndex = headers.findIndex(h => h.includes('CHEMICAL') && !h.includes('ID'));
      const industryIndex = headers.findIndex(h => h.includes('INDUSTRY SECTOR') && !h.includes('CODE'));
      const totalReleasesIndex = headers.findIndex(h => h.includes('TOTAL RELEASES'));
      
      console.log('Column indices:', {
        facilityNameIndex,
        streetIndex,
        cityIndex,
        latIndex,
        lonIndex,
        chemicalIndex,
        industryIndex,
        totalReleasesIndex
      });

      const triSites = [];
      let processed = 0;
      let validSites = 0;

      // Process data lines
      for (let i = 1; i < lines.length && processed < 1000; i++) {
        processed++;
        
        if (processed % 100 === 0) {
          console.log(`Processed ${processed} TRI records...`);
        }

        try {
          const values = parseCSVLine(lines[i]);
          
          if (values.length < Math.max(latIndex, lonIndex, facilityNameIndex) + 1) {
            continue;
          }

          const facilityLat = parseFloat(values[latIndex] || '0');
          const facilityLon = parseFloat(values[lonIndex] || '0');
          
          if (facilityLat === 0 || facilityLon === 0 || isNaN(facilityLat) || isNaN(facilityLon)) {
            continue;
          }

          const distance = calculateDistance(location.lat, location.lng, facilityLat, facilityLon);
          
          // Only include facilities within 15 miles
          if (distance <= 15) {
            const totalReleases = parseFloat(values[totalReleasesIndex] || '0');
            
            const site: ContaminationSite = {
              name: values[facilityNameIndex] || 'Unknown Facility',
              type: 'TRI - Toxic Release Inventory',
              status: 'Active Reporter',
              distance: distance,
              address: `${values[streetIndex] || ''}, ${values[cityIndex] || ''}, ${values[stateIndex] || location.state}`.trim(),
              chemicals: values[chemicalIndex] || 'Various chemicals',
              industry: values[industryIndex] || 'Industrial facility',
              releases: totalReleases > 0 ? `${totalReleases.toLocaleString()} lbs/year` : 'Not reported',
              contaminants: [values[chemicalIndex] || 'Various chemicals'],
              riskLevel: distance < 1 ? 'High' : distance < 5 ? 'Medium' : 'Low'
            };

            triSites.push(site);
            validSites++;
          }
        } catch (error) {
          // Skip malformed lines
          continue;
        }
      }

      console.log(`TRI processing complete: ${validSites} valid sites found within 15 miles`);
      
      // Sort by distance and return top 20
      return triSites
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 20);

    } catch (error) {
      console.error('TRI loading error:', error);
      throw error;
    }
  }, [location]);

  const loadEnvironmentalData = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, errors: [] }));
    
    const errors: string[] = [];
    let contaminationSites: ContaminationSite[] = [];
    let waterViolations: WaterViolation[] = [];
    let toxicFacilities: ContaminationSite[] = [];
    
    try {
      console.log('🔄 Loading comprehensive environmental data for:', location);
      
      // 1. Load real TRI data from CSV
      try {
        console.log('Loading TRI CSV data...');
        toxicFacilities = await loadTRIData();
        console.log(`✅ Loaded ${toxicFacilities.length} TRI facilities`);
      } catch (error) {
        console.error('TRI CSV error:', error);
        errors.push(`TRI data unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // 2. Load Superfund and contamination data from Netlify function
      try {
        console.log('Loading contamination sites from API...');
        const response = await fetch(`/.netlify/functions/epa-api?endpoint=test&lat=${location.lat}&lon=${location.lng}`);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ API response received');
          
          contaminationSites = result.superfundSites || [];
          waterViolations = result.waterViolations || [];
          
          // Add any TRI sites from API that aren't in CSV
          if (result.triSites && result.triSites.length > 0) {
            const apiTriSites = result.triSites.map((site: any) => ({
              ...site,
              type: 'TRI - API Source',
              riskLevel: 'Medium' as const
            }));
            toxicFacilities = [...toxicFacilities, ...apiTriSites];
          }
          
        } else {
          throw new Error(`API returned ${response.status}`);
        }
      } catch (error) {
        console.error('API error:', error);
        errors.push(`API data partially unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    } catch (error) {
      console.error('General environmental data error:', error);
      errors.push(`Environmental data loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Remove duplicates from TRI facilities
    const uniqueToxicFacilities = toxicFacilities.filter((facility, index, self) =>
      index === self.findIndex(f => f.name === facility.name && Math.abs(f.distance - facility.distance) < 0.1)
    );

    setData({
      contaminationSites,
      waterViolations,
      toxicFacilities: uniqueToxicFacilities,
      loading: false,
      errors,
      lastUpdated: new Date().toISOString()
    });
  }, [location, loadTRIData]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-700 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-700 bg-green-50 border-green-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
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
}, [loadEnvironmentalData, location.lat, location.lng]);

  if (data.loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Loading real EPA environmental data...</span>
        </div>
        <div className="mt-4 text-center text-sm text-gray-500">
          Processing TRI facilities, Superfund sites, and water quality data...
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
          Environmental Contamination Assessment - Real EPA Data
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-700">{totalRiskSites}</div>
            <div className="text-sm text-red-600">Contamination Sources Found</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-700">{highRiskSites}</div>
            <div className="text-sm text-orange-600">High Risk Sites</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{data.waterViolations.length}</div>
            <div className="text-sm text-blue-600">Water Quality Issues</div>
          </div>
        </div>

        {data.errors.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Data Source Status:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              {data.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* TRI Toxic Facilities */}
      {data.toxicFacilities.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Factory className="w-5 h-5 mr-2 text-purple-500" />
            Toxic Release Inventory (TRI) Facilities ({data.toxicFacilities.length})
          </h3>
          
          <div className="space-y-3">
            {data.toxicFacilities.slice(0, 15).map((facility, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{facility.name}</h4>
                    <p className="text-sm text-gray-600">{facility.type}</p>
                    <p className="text-xs text-gray-500">{facility.address}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(facility.riskLevel)} flex items-center`}>
                    {getRiskIcon(facility.riskLevel)}
                    <span className="ml-1">{facility.riskLevel} Risk</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <span className="text-gray-600">Distance: {facility.distance.toFixed(2)} miles</span>
                  <span className="text-gray-600">Industry: {facility.industry || 'Industrial'}</span>
                </div>
                
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">Chemicals: </span>
                  <span className="text-gray-700">{facility.chemicals || 'Various chemicals'}</span>
                </div>
                
                {facility.releases && (
                  <div className="mt-1 text-sm">
                    <span className="text-gray-500">Annual Releases: </span>
                    <span className="text-orange-700 font-medium">{facility.releases}</span>
                  </div>
                )}
              </div>
            ))}
            
            {data.toxicFacilities.length > 15 && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  + {data.toxicFacilities.length - 15} more TRI facilities found within search area
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Superfund Contamination Sites */}
      {data.contaminationSites.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Superfund Contaminated Sites ({data.contaminationSites.length})
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
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(site.riskLevel)} flex items-center`}>
                    {getRiskIcon(site.riskLevel)}
                    <span className="ml-1">{site.riskLevel} Risk</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Distance: {site.distance?.toFixed(2) || 'Unknown'} miles</span>
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
            Water Quality Issues ({data.waterViolations.length})
          </h3>
          
          <div className="space-y-3">
            {data.waterViolations.map((violation, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{violation.systemName}</h4>
                    <p className="text-sm text-gray-600">Issue: {violation.violationType}</p>
                    <p className="text-xs text-gray-500">Contaminant: {violation.contaminant}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(violation.riskLevel)} flex items-center`}>
                    {getRiskIcon(violation.riskLevel)}
                    <span className="ml-1">{violation.riskLevel} Risk</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Date: {new Date(violation.date).toLocaleDateString()}</span>
                  {violation.level && violation.mcl && (
                    <span className="text-gray-600">Level: {violation.level} (MCL: {violation.mcl})</span>
                  )}
                </div>
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

      {/* Data Sources */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Real Data Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-700">TRI Facilities:</span>
            <span className="text-gray-600 ml-2">EPA Toxic Release Inventory 2023</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Superfund Sites:</span>
            <span className="text-gray-600 ml-2">EPA National Priorities List</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Water Quality:</span>
            <span className="text-gray-600 ml-2">EPA Safe Drinking Water Information System</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Search Radius:</span>
            <span className="text-gray-600 ml-2">15 miles for TRI, 10 miles for Superfund</span>
          </div>
        </div>
        
        {data.lastUpdated && (
          <div className="mt-4 text-xs text-gray-500 text-center">
            Assessment completed: {new Date(data.lastUpdated).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvironmentalDataLoader;
