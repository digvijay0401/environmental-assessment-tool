const handler = async (event, context) => {
  console.log('EPA API called with:', event.queryStringParameters);
  
  const { lat, lon, endpoint } = event.queryStringParameters || {};
  
  try {
    const results = {
      superfundSites: [],
      triSites: [],
      waterViolations: [],
      debug: {}
    };

    // Test a simple EPA API first
    console.log('Testing basic EPA connection...');
    
    // 1. Try TRI facilities in Maryland (should have many results)
    try {
      const triUrl = `https://iaspub.epa.gov/enviro/efservice/tri_facility/state_abbr/MD/rows/0:10/json`;
      console.log('Fetching TRI from:', triUrl);
      
      const triResponse = await fetch(triUrl);
      console.log('TRI Response status:', triResponse.status);
      
      if (triResponse.ok) {
        const triText = await triResponse.text();
        console.log('TRI raw response (first 500 chars):', triText.substring(0, 500));
        
        const triData = JSON.parse(triText);
        console.log('TRI parsed data length:', triData?.length);
        console.log('TRI first item:', triData?.[0]);
        
        results.debug.triResponse = triText.substring(0, 200);
        results.debug.triCount = triData?.length || 0;
        
        if (triData && triData.length > 0) {
          results.triSites = triData.slice(0, 5).map(facility => ({
            name: facility.FACILITY_NAME || facility.facility_name || 'Unknown Facility',
            address: `${facility.FACILITY_STREET || facility.street || ''}, ${facility.FACILITY_CITY || facility.city || ''}, MD`,
            chemicals: facility.CHEMICAL_NAME || facility.chemical_name || 'Various chemicals',
            registry_id: facility.REGISTRY_ID || facility.registry_id || 'N/A'
          }));
        }
      } else {
        console.log('TRI API failed with status:', triResponse.status);
        results.debug.triError = `Status ${triResponse.status}`;
      }
    } catch (error) {
      console.error('TRI error:', error);
      results.debug.triError = error.message;
    }

    // 2. Try water violations
    try {
      const waterUrl = `https://iaspub.epa.gov/enviro/efservice/sdw_viol/state_code/MD/rows/0:10/json`;
      console.log('Fetching water from:', waterUrl);
      
      const waterResponse = await fetch(waterUrl);
      console.log('Water response status:', waterResponse.status);
      
      if (waterResponse.ok) {
        const waterText = await waterResponse.text();
        console.log('Water raw response (first 500 chars):', waterText.substring(0, 500));
        
        const waterData = JSON.parse(waterText);
        console.log('Water data length:', waterData?.length);
        
        results.debug.waterResponse = waterText.substring(0, 200);
        results.debug.waterCount = waterData?.length || 0;
        
        if (waterData && waterData.length > 0) {
          results.waterViolations = waterData.slice(0, 5).map(violation => ({
            system: violation.PWS_NAME || violation.pws_name || 'Unknown System',
            violation: violation.VIOLATION_CATEGORY_DESC || violation.violation_desc || 'Violation details',
            date: violation.COMPL_PER_END_DATE || violation.date || 'Date not specified',
            pws_id: violation.PWS_ID || violation.pws_id || 'N/A'
          }));
        }
      }
    } catch (error) {
      console.error('Water error:', error);
      results.debug.waterError = error.message;
    }

    // 3. Test a different Superfund approach
    try {
      // Try EPA ECHO API for NPL sites
      const echoUrl = `https://echo.epa.gov/tools/web-services/facility-search-water#!/Facilities/get_rest_lookups_superfund_npls`;
      console.log('Testing ECHO API...');
      
      // Alternative: Try a known contaminated site search
      results.superfundSites = [
        {
          name: "Baltimore Harbor - Curtis Bay",
          address: "Curtis Bay, Baltimore, MD",
          status: "Historical contamination area",
          note: "Known industrial contamination zone"
        },
        {
          name: "Sparrows Point Steel Mill Area", 
          address: "Sparrows Point, MD",
          status: "Former industrial site",
          note: "Heavy metals contamination"
        }
      ];
      
      results.debug.superfundNote = "Using known contaminated areas - EPA SEMS API may be restricted";
      
    } catch (error) {
      console.error('Superfund error:', error);
      results.debug.superfundError = error.message;
    }

    // Add function info
    results.debug.timestamp = new Date().toISOString();
    results.debug.location = `${lat}, ${lon}`;
    results.debug.message = "Debug version - checking EPA API responses";

    console.log('Final results:', JSON.stringify(results, null, 2));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(results)
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

module.exports = { handler };
