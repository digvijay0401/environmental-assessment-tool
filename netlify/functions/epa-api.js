// Simple test version first
const handler = async (event, context) => {
  console.log('Function called with:', event.queryStringParameters);
  
  try {
    // Log environment check
    console.log('EPA API Key available:', !!process.env.REACT_APP_EPA_API_KEY);
    
    // Simple test response
    const response = {
      message: 'EPA Function working!',
      timestamp: new Date().toISOString(),
      location: event.queryStringParameters,
      superfundSites: [
        {
          name: 'Test Contaminated Site',
          address: '123 Test Street, Baltimore, MD',
          status: 'Under Investigation',
          contaminants: 'Heavy metals, petroleum'
        }
      ],
      triSites: [
        {
          name: 'Test Chemical Facility',
          address: '456 Industrial Ave, Baltimore, MD',
          chemicals: 'Benzene, Toluene'
        }
      ],
      waterViolations: [
        {
          system: 'Test Water System',
          violation: 'Lead levels exceeded',
          date: '2024-01-15'
        }
      ]
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      })
    };
  }
};

// Correct export format for Netlify
module.exports = { handler };
