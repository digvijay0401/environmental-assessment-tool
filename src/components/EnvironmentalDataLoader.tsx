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

interface EnvironmentalData {
  superfundSites: any[];
  triSites: any[];
  waterViolations: any[];
  loading: boolean;
  errors: string[];
}

interface EnvironmentalDataLoaderProps {
  location: Location;
}

const EnvironmentalDataLoader: React.FC<EnvironmentalDataLoaderProps> = ({ location }) => {
  const [data, setData] = useState<EnvironmentalData>({
    superfundSites: [],
    triSites: [],
    waterViolations: [],
    loading: true,
    errors: []
  });

  const loadEnvironmentalData = useCallback(async () => {
  setData(prev => ({ ...prev, loading: true, errors: [] }));
  
  try {
    console.log('🔄 Loading EPA data for:', location);
    
    // Test the Netlify Function
    const response = await fetch(`/.netlify/functions/epa-api?endpoint=test&lat=${location.lat}&lon=${location.lng}`);
    console.log('📊 API Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ EPA API working:', result);
      
      setData({
        superfundSites: result.superfundSites || [],
        triSites: result.triSites || [],
        waterViolations: result.waterViolations || [],
        loading: false,
        errors: []
      });
    } else {
      throw new Error(`API returned ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ EPA API Error:', error);
    setData({
      superfundSites: [],
      triSites: [],
      waterViolations: [],
      loading: false,
      errors: [`API Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    });
  }
}, [location]);  
  
  useEffect(() => {
    loadEnvironmentalData();
  }, [loadEnvironmentalData]);

  if (data.loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center">
          <Clock className="animate-spin h-8 w-8 text-blue-600 mr-3" />
          <span className="text-gray-600">Loading EPA environmental data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* API Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">EPA API Integration Status</h3>
        
        {data.errors.length > 0 ? (
          <div className="space-y-2">
            {data.errors.map((error, index) => (
              <div key={index} className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <span className="text-red-800">{error}</span>
              </div>
            ))}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Debug Info:</strong> Check browser console (F12) for detailed API responses.
                The Netlify function should be accessible at: <code>/.netlify/functions/epa-api</code>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-800">EPA APIs connected successfully!</span>
          </div>
        )}
      </div>

      {/* Superfund Sites */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
          <h3 className="text-lg font-bold text-gray-900">Superfund Contaminated Sites</h3>
        </div>
        
        {data.superfundSites.length > 0 ? (
          <div className="space-y-4">
            {data.superfundSites.slice(0, 5).map((site, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="font-semibold text-gray-900">{site.name || 'Unknown Site'}</div>
                <div className="text-sm text-gray-600">{site.address || 'Address not available'}</div>
                <div className="text-sm text-red-600 mt-1">
                  Status: {site.status || 'Under Investigation'}
                </div>
              </div>
            ))}
            {data.superfundSites.length > 5 && (
              <p className="text-sm text-gray-600">
                + {data.superfundSites.length - 5} more sites found
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-800">No Superfund sites found within search radius</span>
          </div>
        )}
      </div>

      {/* TRI Facilities */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Factory className="h-6 w-6 text-orange-600 mr-3" />
          <h3 className="text-lg font-bold text-gray-900">Toxic Release Inventory (TRI) Facilities</h3>
        </div>
        
        {data.triSites.length > 0 ? (
          <div className="space-y-4">
            {data.triSites.slice(0, 5).map((facility, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="font-semibold text-gray-900">{facility.name || 'Unknown Facility'}</div>
                <div className="text-sm text-gray-600">{facility.address || 'Address not available'}</div>
                <div className="text-sm text-orange-600 mt-1">
                  Chemicals: {facility.chemicals || 'Not specified'}
                </div>
              </div>
            ))}
            {data.triSites.length > 5 && (
              <p className="text-sm text-gray-600">
                + {data.triSites.length - 5} more facilities found
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-800">No TRI facilities found within search radius</span>
          </div>
        )}
      </div>

      {/* Water Quality */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Droplets className="h-6 w-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-bold text-gray-900">Water Quality Violations</h3>
        </div>
        
        {data.waterViolations.length > 0 ? (
          <div className="space-y-4">
            {data.waterViolations.slice(0, 5).map((violation, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="font-semibold text-gray-900">{violation.system || 'Unknown System'}</div>
                <div className="text-sm text-gray-600">{violation.violation || 'Violation details not available'}</div>
                <div className="text-sm text-blue-600 mt-1">
                  Date: {violation.date || 'Date not specified'}
                </div>
              </div>
            ))}
            {data.waterViolations.length > 5 && (
              <p className="text-sm text-gray-600">
                + {data.waterViolations.length - 5} more violations found
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-800">No water quality violations found</span>
          </div>
        )}
      </div>

      {/* Location Info */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <MapPin className="h-6 w-6 text-gray-600 mr-3" />
          <h3 className="text-lg font-bold text-gray-900">Search Parameters</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Location:</span> {location.address}
          </div>
          <div>
            <span className="font-semibold">Coordinates:</span> {location.lat}, {location.lng}
          </div>
          <div>
            <span className="font-semibold">State:</span> {location.state || 'N/A'}
          </div>
          <div>
            <span className="font-semibold">ZIP:</span> {location.zip || 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalDataLoader;
