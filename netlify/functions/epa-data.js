const https = require('https');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const { endpoint, state } = event.queryStringParameters || {};

  if (!endpoint || !state) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required parameters: endpoint and state' })
    };
  }

  let apiUrl;
  
  // Determine the correct EPA API URL based on endpoint
  switch (endpoint) {
    case 'superfund':
      apiUrl = `https://data.epa.gov/efservice/sems.envirofacts_site/fk_ref_state_code/equals/${state}/JSON`;
      break;
    case 'tri':
      apiUrl = `https://data.epa.gov/efservice/tri.tri_facility/state_abbr/equals/${state}/JSON`;
      break;
    default:
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid endpoint. Use "superfund" or "tri"' })
      };
  }

  try {
    console.log(`Fetching data from: ${apiUrl}`);
    
    const data = await new Promise((resolve, reject) => {
      https.get(apiUrl, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            reject(new Error('Invalid JSON response from EPA API'));
          }
        });
      }).on('error', (err) => {
        console.error('Request error:', err);
        reject(err);
      });
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('EPA API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch data from EPA API',
        details: error.message 
      })
    };
  }
};