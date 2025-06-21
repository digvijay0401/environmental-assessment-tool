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
    }
  ];

  const handleLocationSelect = (newLocation: Location) => {
    setIsLoading(true);
    setLocation(newLocation);
    setTimeout(() => setIsLoading(false), 500);
  };

  const clearLocation = () => {
    setLocation(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Environmental Assessment Tool
          </h1>
          <p className="text-gray-600 mt-1">
            Professional Phase I ESA Data & Contamination Analysis
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!location && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Select Test Location
            </h2>
            
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
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600">Loading environmental data...</span>
            </div>
          </div>
        )}

        {location && !isLoading && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Environmental Assessment: {location.address}
                </h2>
                <p className="text-gray-600">
                  Coordinates: {location.lat}, {location.lng}
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

        {location && !isLoading && (
          <EnvironmentalDataLoader location={location} />
        )}
      </main>
    </div>
  );
}

export default App;
