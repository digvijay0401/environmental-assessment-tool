import React, { useState } from 'react';
import AddressInput from './AddressInput';
import AirQualityDisplay from './AirQualityDisplay';
import { dataLoader } from './DataLoader';
import { 
  RealHistoricalAnalysis, 
  RealPollenData, 
  RealClimateHazards, 
  RealWaterQuality, 
  RealToxicFacilities 
} from './RealComponents';

interface LocationData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  county: string;
}

const App: React.FC = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const handleLocationFound = async (locationData: LocationData) => {
    setLocation(locationData);
    
    // Load data for this state
    if (locationData.state) {
      setDataLoading(true);
      try {
        await dataLoader.loadDataForState(locationData.state);
        setDataLoaded(dataLoader.isStateLoaded(locationData.state));
      } catch (error) {
        console.error('Error loading state data:', error);
      } finally {
        setDataLoading(false);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#2c3e50', color: 'white', padding: '20px 0', textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>
          🌍 Professional Environmental Assessment Tool
        </h1>
        <p style={{ margin: '10px 0 0 0', fontSize: '18px', opacity: 0.9 }}>
          Real government APIs • EPA, CDC, NOAA, USGS • Phase I ESA compliance
        </p>
        
        <div style={{ marginTop: '15px' }}>
          {dataLoading ? (
            <span style={{ backgroundColor: '#f39c12', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
              🔄 Loading {location?.state} Environmental Data...
            </span>
          ) : dataLoaded ? (
            <span style={{ backgroundColor: '#27ae60', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
              ✅ {location?.state} Real Data Loaded
            </span>
          ) : (
            <span style={{ backgroundColor: '#3498db', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
              🎯 Ready - Enter Address for Real-Time Analysis
            </span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ marginBottom: '30px' }}>
          <AddressInput onLocationFound={handleLocationFound} />
        </div>

        {location && (
          <>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>📍 Assessment Location</h2>
              <p style={{ margin: 0, fontSize: '16px', color: '#555' }}>
                <strong>{location.address}</strong><br />
                {location.city}, {location.state} {location.zipCode}<br />
                <span style={{ fontSize: '14px', color: '#777' }}>
                  Coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </span>
              </p>
            </div>

            {/* Phase I ESA - Historical Analysis */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#2c3e50', borderBottom: '3px solid #3498db', paddingBottom: '10px', marginBottom: '20px' }}>
                🔍 Phase I Environmental Site Assessment
              </h2>
              <RealHistoricalAnalysis 
                address={location.address}
                city={location.city}
                state={location.state}
                county={location.county}
                latitude={location.latitude}
                longitude={location.longitude}
              />
            </div>

            {/* Real-Time Environmental Conditions */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#2c3e50', borderBottom: '3px solid #e74c3c', paddingBottom: '10px', marginBottom: '20px' }}>
                📊 Real-Time Environmental Conditions
              </h2>
              
              {/* Air Quality (Always Available) */}
              <AirQualityDisplay zipCode={location.zipCode} />
              
              {/* Real Pollen Data */}
              <RealPollenData 
                latitude={location.latitude}
                longitude={location.longitude}
                city={location.city}
                state={location.state}
                zipCode={location.zipCode}
              />
              
              {/* Climate Hazards */}
              <RealClimateHazards 
                latitude={location.latitude}
                longitude={location.longitude}
                city={location.city}
                state={location.state}
                zipCode={location.zipCode}
              />
            </div>

            {/* Environmental Contamination */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#2c3e50', borderBottom: '3px solid #9b59b6', paddingBottom: '10px', marginBottom: '20px' }}>
                🏭 Environmental Contamination & Facilities
              </h2>
              
              {/* EPA Violations (from CSV data) */}
              {dataLoaded && (
                <RealViolationsComponent latitude={location.latitude} longitude={location.longitude} />
              )}
              
              {/* Toxic Facilities (from TRI + Superfund data) */}
              {dataLoaded && (
                <RealToxicFacilities 
                  latitude={location.latitude}
                  longitude={location.longitude}
                  address={location.address}
                  state={location.state}
                  zipCode={location.zipCode}
                />
              )}
            </div>

            {/* Health & Water Quality */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#2c3e50', borderBottom: '3px solid #27ae60', paddingBottom: '10px', marginBottom: '20px' }}>
                🏥 Community Health & Water Quality
              </h2>
              
              {/* CDC Health Data */}
              {dataLoaded && (
                <RealHealthDataComponent zipCode={location.zipCode} />
              )}
              
              {/* Water Quality */}
              <RealWaterQuality 
                zipCode={location.zipCode}
                city={location.city}
                state={location.state}
                latitude={location.latitude}
                longitude={location.longitude}
              />
            </div>

            {/* Data Summary & Disclaimer */}
            <div style={{ backgroundColor: '#2c3e50', color: 'white', padding: '20px', borderRadius: '5px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>📋 Real Data Sources Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#3498db' }}>✅ Real-Time APIs</h4>
                  <ul style={{ margin: 0, fontSize: '14px', listStyle: 'none', padding: 0 }}>
                    <li>• EPA AirNow - Live air quality</li>
                    <li>• NOAA Weather - Real climate data</li>
                    <li>• IQAir - Live pollen & air quality</li>
                    <li>• EPA SDWIS - Water system data</li>
                    <li>• USGS Historical Maps</li>
                    <li>• EPA CERCLIS - Contaminated sites</li>
                  </ul>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#27ae60' }}>✅ Government Databases</h4>
                  <ul style={{ margin: 0, fontSize: '14px', listStyle: 'none', padding: 0 }}>
                    <li>• EPA ECHO - Violations & enforcement</li>
                    <li>• EPA TRI - Toxic release inventory</li>
                    <li>• EPA Superfund - Contaminated sites</li>
                    <li>• CDC PLACES - Health outcomes</li>
                    <li>• EPA FRS - Facility registry</li>
                  </ul>
                </div>
              </div>
              
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '5px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>⚠️ Professional Disclaimer</h4>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                  This assessment provides environmental information for screening purposes only using real government data from EPA, CDC, NOAA, and USGS. 
                  For legal, financial, or regulatory decisions, consult a qualified environmental professional. Data sources are updated regularly 
                  but may not reflect the most current conditions. This tool follows ASTM E1527-13 methodology where applicable.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// EPA Violations Component (Real CSV Data)
const RealViolationsComponent: React.FC<{ latitude: number; longitude: number }> = ({ latitude, longitude }) => {
  const [violations, setViolations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadViolations = () => {
      setLoading(true);
      try {
        const facilities = dataLoader.getViolationFacilities(latitude, longitude, 5);
        setViolations(facilities);
      } catch (error) {
        console.error('Error loading violations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadViolations();
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <p>🔄 Loading EPA violation data...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>
        🚨 EPA Enforcement & Violations
      </h3>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
        <strong>Data Source:</strong> EPA ECHO Database • Search Radius: 5 miles • Found: {violations.length} facilities with violations
      </p>

      {violations.length === 0 ? (
        <div style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '5px', padding: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>✅ No Recent Violations Found</h4>
          <p style={{ margin: 0, color: '#155724' }}>
            No EPA facilities with recent violations found within 5 miles of this location.
            This indicates good regulatory compliance in the immediate area.
          </p>
        </div>
      ) : (
        <div>
          {violations.slice(0, 10).map((facility, index) => (
            <div key={index} style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px', padding: '15px', marginBottom: '10px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
                {facility.FAC_NAME || 'Unnamed Facility'}
              </h4>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                📍 {facility.FAC_STREET}, {facility.FAC_CITY}, {facility.FAC_STATE} {facility.FAC_ZIP}
              </p>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {facility.CWA_VIOL_QTRS > 0 && (
                  <span style={{ backgroundColor: '#ffc107', padding: '2px 8px', borderRadius: '3px', marginRight: '5px', color: 'black' }}>
                    Water Violations: {facility.CWA_VIOL_QTRS} quarters
                  </span>
                )}
                {facility.CAA_VIOL_QTRS > 0 && (
                  <span style={{ backgroundColor: '#dc3545', padding: '2px 8px', borderRadius: '3px', marginRight: '5px', color: 'white' }}>
                    Air Violations: {facility.CAA_VIOL_QTRS} quarters
                  </span>
                )}
                {facility.RCRA_VIOL_QTRS > 0 && (
                  <span style={{ backgroundColor: '#6f42c1', padding: '2px 8px', borderRadius: '3px', marginRight: '5px', color: 'white' }}>
                    Waste Violations: {facility.RCRA_VIOL_QTRS} quarters
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// CDC Health Data Component (Real CSV Data)
const RealHealthDataComponent: React.FC<{ zipCode: string }> = ({ zipCode }) => {
  const [healthData, setHealthData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadHealthData = () => {
      setLoading(true);
      try {
        const data = dataLoader.getHealthDataByZip(zipCode);
        setHealthData(data);
      } catch (error) {
        console.error('Error loading health data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHealthData();
  }, [zipCode]);

  if (loading) {
    return (
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <p>🔄 Loading CDC health data...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>
        🏥 Community Health Data
      </h3>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
        <strong>Data Source:</strong> CDC PLACES 2024 • ZIP Code: {zipCode}
      </p>

      {!healthData ? (
        <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '5px', padding: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>ℹ️ Health Data Not Available</h4>
          <p style={{ margin: 0, color: '#856404' }}>
            No CDC PLACES data found for ZIP code {zipCode}. This may be due to:
          </p>
          <ul style={{ marginTop: '10px', color: '#856404' }}>
            <li>ZIP code not in 2024 dataset</li>
            <li>Data suppressed for privacy (small population)</li>
            <li>Non-residential ZIP code</li>
          </ul>
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            {healthData.ASTHMA_CrudePrev && (
              <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>🫁 Asthma</h4>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#e74c3c' }}>
                  {healthData.ASTHMA_CrudePrev.toFixed(1)}%
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Age-adjusted prevalence</p>
              </div>
            )}
            {healthData.DIABETES_CrudePrev && (
              <div style={{ backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>🩺 Diabetes</h4>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#e74c3c' }}>
                  {healthData.DIABETES_CrudePrev.toFixed(1)}%
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Age-adjusted prevalence</p>
              </div>
            )}
            {healthData.OBESITY_CrudePrev && (
              <div style={{ backgroundColor: '#fce4ec', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>⚖️ Obesity</h4>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#e74c3c' }}>
                  {healthData.OBESITY_CrudePrev.toFixed(1)}%
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Age-adjusted prevalence</p>
              </div>
            )}
            {healthData.CANCER_CrudePrev && (
              <div style={{ backgroundColor: '#f3e5f5', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>🎗️ Cancer</h4>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#e74c3c' }}>
                  {healthData.CANCER_CrudePrev.toFixed(1)}%
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Age-adjusted prevalence</p>
              </div>
            )}
            {healthData.COPD_CrudePrev && (
              <div style={{ backgroundColor: '#e8f5e8', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>🫁 COPD</h4>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#e74c3c' }}>
                  {healthData.COPD_CrudePrev.toFixed(1)}%
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Age-adjusted prevalence</p>
              </div>
            )}
            {healthData.STROKE_CrudePrev && (
              <div style={{ backgroundColor: '#ffebee', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>🧠 Stroke</h4>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#e74c3c' }}>
                  {healthData.STROKE_CrudePrev.toFixed(1)}%
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Age-adjusted prevalence</p>
              </div>
            )}
          </div>
          
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>📊 Data Details</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              <strong>Source:</strong> CDC PLACES Local Data for Better Health<br />
              <strong>Year:</strong> 2024 Release<br />
              <strong>Type:</strong> Age-adjusted prevalence rates<br />
              <strong>Note:</strong> Rates are per 100 adults and age-adjusted to 2000 US standard population
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;