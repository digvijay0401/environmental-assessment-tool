import React, { useState } from 'react';
import EnvironmentalDataLoader from './components/EnvironmentalDataLoader';

interface Location {
  lat: number;
  lng: number;
  address: string;
  state?: string;
  zip?: string;
  county?: string;
}

function App() {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Test locations for different scenarios
  const testLocations = [
    {
      name: "Baltimore, MD (Industrial Area)",
      location: {
        lat: 39.2904,
        lng: -76.6122,
        address: "Baltimore, MD",
        state: "MD",
        zip: "21201",
        county: "Baltimore"
      }
    },
    {
      name: "Catonsville, MD (Your Location)",
      location: {
        lat: 39.2723,
        lng: -76.7322,
        address: "Catonsville, MD",
        state: "MD",
        zip: "21228",
        county: "Baltimore"
      }
    },
    {
      name: "Sparrows Point, MD (Heavy Industry)",
      location: {
        lat: 39.2137,
        lng: -76.4951,
        address: "Sparrows Point, MD",
        state: "MD",
        zip: "21219",
        county: "Baltimore"
      }
    },
    {
      name: "Bethesda, MD (Clean Area)",
      location: {
        lat: 38.9847,
        lng: -77.0947,
        address: "Bethesda, MD",
        state: "MD",
        zip: "20814",
        county: "Montgomery"
      }
    }
  ];

  const handleLocationSelect = (newLocation: Location) => {
    setIsLoading(true);
    setLocation(newLocation);
    // Small delay to show loading state
    setTimeout(() => setIsLoading(false), 500);
  };

  const clearLocation = () => {
    setLocation(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Environmental Assessment Tool
              </h1>
              <p className="text-gray-600 mt-1">
                Professional Phase I ESA Data & Contamination Analysis
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">API Testing Version</div>
              <div className="text-lg font-semibold text-green-600">
                Real EPA Data
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Location Selection */}
        {!location && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Select Test Location
            </h2>
            <p className="text-gray-600 mb-6">
              Choose a location to test the EPA API integration and see real environmental contamination data.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testLocations.map((test, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(test.location)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  disabled={isLoading}
                >
                  <div className="font-semibold text-gray-900">{test.name}</div>
                  <div className="text-sm text-gray-600">{test.location.address}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Lat: {test.location.lat}, Lng: {test.location.lng}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Real EPA Data Sources:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>SEMS:</strong> Superfund contaminated sites</li>
                <li>• <strong>TRI:</strong> Toxic Release Inventory facilities</li>
                <li>• <strong>RCRA:</strong> Hazardous waste handlers</li>
                <li>• <strong>SDWIS:</strong> Drinking water quality violations</li>
                <li>• <strong>ECHO:</strong> Compliance and enforcement data</li>
              </ul>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600">Initializing environmental data loader...</span>
            </div>
          </div>
        )}

        {/* Selected Location Display */}
        {location && !isLoading && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Environmental Assessment: {location.address}
                </h2>
                <p className="text-gray-600">
                  Coordinates: {location.lat}, {location.lng} | 
                  State: {location.state} | 
                  ZIP: {location.zip} | 
                  County: {location.county}
                </p>
              </div>
              <button
                onClick={clearLocation}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
              >
                Select Different Location
              </button>
            </div>
          </div>
        )}

        {/* Environmental Data Component */}
        {location && !isLoading && (
          <EnvironmentalDataLoader location={location} />
        )}

        {/* API Status Indicator */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">API Integration Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-semibold text-green-800">FRS APIs</div>
              <div className="text-sm text-green-600">Superfund, RCRA, TRI</div>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-semibold text-green-800">ECHO APIs</div>
              <div className="text-sm text-green-600">Water, Air, Compliance</div>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-semibold text-green-800">Envirofacts APIs</div>
              <div className="text-sm text-green-600">Direct DB Access</div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-800">
              <strong>Testing Mode:</strong> This deployment tests real EPA API endpoints through Netlify Functions to bypass CORS restrictions. 
              All data returned is live from official EPA databases.
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>
            Environmental Assessment Tool • Real EPA Data • 
            Professional Phase I ESA Analysis • Last Updated: {new Date().toLocaleDateString()}
          </p>
          <p className="mt-2">
            Data Sources: EPA FRS, ECHO, Envirofacts, SEMS, TRI, RCRA, SDWIS
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
