const handler = async (event, context) => {
  console.log('EPA API called with:', event.queryStringParameters);
  
  const { lat, lon, endpoint } = event.queryStringParameters || {};
  
  if (!lat || !lon) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing lat/lon parameters' })
    };
  }

  try {
    const radius = 5; // miles
    const results = {
      superfundSites: [],
      triSites: [],
      waterViolations: [],
      message: `Real EPA data for ${lat}, ${lon}`
    };

    // 1. SUPERFUND SITES (NPL - National Priority List)
    try {
      const superfundUrl = `https://epa.maps.arcgis.com/apps/webappviewer/index.html?id=33cebcdfdd1b4c3a8b51d416956c41f1`;
      // Alternative: Direct EPA SEMS query
      const semsUrl = `https://iaspub.epa.gov/enviro/efservice/sems/site_name/beginning/contains/ignorecase/superfund/json`;
      
      console.log('Fetching Superfund sites...');
      const superfundResponse = await fetch(semsUrl);
      
      if (superfundResponse.ok) {
        const data = await superfundResponse.json();
        console.log('Superfund data:', data);
        
        results.superfundSites = (data || []).slice(0, 10).map(site => ({
          name: site.SITE_NAME || 'Unknown Site',
          address: `${site.STREET_ADDR || ''}, ${site.CITY || ''}, ${site.STATE || ''}`.trim(),
          status: site.NPL_STATUS || 'Under Investigation',
          epa_id: site.SITE_EPA_ID,
          contaminants: site.CONTAMINANT_NAME || 'Various contaminants'
        }));
      }
    } catch (error) {
      console.error('Superfund API error:', error);
      results.superfundSites = [{
        name: 'API Error - Unable to fetch Superfund data',
        address: 'Check function logs',
        status: 'Error',
        error: error.message
      }];
    }

    // 2. TRI FACILITIES (Toxic Release Inventory)
    try {
      const triUrl = `https://iaspub.epa.gov/enviro/efservice/tri_facility/state_abbr/MD/json`;
      console.log('Fetching TRI facilities...');
      
      const triResponse = await fetch(triUrl);
      if (triResponse.ok) {
        const data = await triResponse.json();
        console.log('TRI data sample:', data?.slice(0, 2));
        
        results.triSites = (data || []).slice(0, 10).map(facility => ({
          name: facility.FACILITY_NAME || 'Unknown Facility',
          address: `${facility.FACILITY_STREET || ''}, ${facility.FACILITY_CITY || ''}, ${facility.FACILITY_STATE || ''}`.trim(),
          chemicals: facility.CHEMICAL_NAME || 'Various chemicals',
          industry: facility.INDUSTRY_SECTOR_DESC || 'Industrial facility',
          registry_id: facility.REGISTRY_ID
        }));
      }
    } catch (error) {
      console.error('TRI API error:', error);
      results.triSites = [{
        name: 'API Error - Unable to fetch TRI data',
        address: 'Check function logs',
        chemicals: 'Error',
        error: error.message
      }];
    }

    // 3. WATER QUALITY VIOLATIONS
    try {
      const waterUrl = `https://iaspub.epa.gov/enviro/efservice/sdw_viol/state_code/MD/json`;
      console.log('Fetching water violations...');
      
      const waterResponse = await fetch(waterUrl);
      if (waterResponse.ok) {
        const data = await waterResponse.json();
        console.log('Water violations sample:', data?.slice(0, 2));
        
        results.waterViolations = (data || []).slice(0, 10).map(violation => ({
          system: violation.PWS_NAME || 'Unknown Water System',
          violation: violation.VIOLATION_CATEGORY_DESC || 'Violation details unavailable',
          date: violation.COMPL_PER_END_DATE || 'Date not specified',
          contaminant: violation.CONTAMINANT_NAME || 'Various contaminants',
          pws_id: violation.PWS_ID
        }));
      }
    } catch (error) {
      console.error('Water API error:', error);
      results.waterViolations = [{
        system: 'API Error - Unable to fetch water data',
        violation: 'Check function logs',
        date: 'Error',
        error: error.message
      }];
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(results)
    };

  } catch (error) {
    console.error('General function error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      })
    };
  }
};

module.exports = { handler };
