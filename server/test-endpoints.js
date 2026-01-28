// Test script to verify all API endpoints
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;
let authToken = null;

// Helper function to make requests
async function request(method, endpoint, data = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test results
const results = {
  passed: [],
  failed: [],
};

async function test(name, fn) {
  try {
    const result = await fn();
    if (result.status >= 200 && result.status < 300) {
      results.passed.push(name);
      console.log(`✅ ${name}`);
      return result.data;
    } else {
      results.failed.push({ name, status: result.status, error: result.data });
      console.log(`❌ ${name} - Status: ${result.status}`);
      if (result.data?.error) console.log(`   Error: ${result.data.error}`);
      return null;
    }
  } catch (error) {
    results.failed.push({ name, error: error.message });
    console.log(`❌ ${name} - Error: ${error.message}`);
    return null;
  }
}

console.log('🧪 Testing Backend API Endpoints\n');
console.log('='.repeat(60));

// 1. Test Server Health
await test('Server Health Check', () => request('GET', '/'));

// 2. Register User
const registerResult = await test('User Registration', () =>
  request('POST', '/api/register', {
    email: 'test@example.com',
    password: 'test123',
    role: 'operator',
    full_name: 'Test User',
  })
);

if (registerResult?.token) {
  authToken = registerResult.token;
  console.log(`   Token received: ${authToken.substring(0, 20)}...`);
}

// 3. Login
const loginResult = await test('User Login', () =>
  request('POST', '/api/login', {
    email: 'test@example.com',
    password: 'test123',
  })
);

if (loginResult?.token && !authToken) {
  authToken = loginResult.token;
}

// 4. Get Assets (Public)
await test('GET All Assets (Public)', () => request('GET', '/api/assets'));

// 5. Create Asset (Protected)
const assetResult = await test('CREATE Asset (Protected)', () =>
  request(
    'POST',
    '/api/assets',
    {
      asset_code: 'TEST-001',
      asset_name: 'Test Machine',
      asset_location: 'Plant 1',
      bu_name: 'BU-ENG',
      asset_type: 'machine',
      manufacturer: 'Test Mfg',
      model_number: 'MOD-001',
      model_name: 'Model A',
      install_date: '2024-01-01',
      asset_status: 'active',
    },
    authToken
  )
);

const assetId = assetResult?.id;

// 6. Get Single Asset
if (assetId) {
  await test('GET Single Asset', () => request('GET', `/api/assets/${assetId}`));
}

// 7. Update Asset
if (assetId) {
  await test('UPDATE Asset', () =>
    request(
      'PUT',
      `/api/assets/${assetId}`,
      { asset_name: 'Updated Test Machine' },
      authToken
    )
  );
}

// 8. Get Breakdowns (Public)
await test('GET All Breakdowns', () => request('GET', '/api/breakdowns'));

// 9. Create Breakdown
const breakdownResult = await test('CREATE Breakdown Entry', () =>
  request(
    'POST',
    '/api/breakdowns',
    {
      bd_code: 'BD-TEST-001',
      shift_id: 'A',
      entry_date: '2024-01-15',
      entry_time: '10:30:00',
      asset_id: assetId || 1,
      asset_location: 'Plant 1',
      bu_name: 'BU-ENG',
      operator_name: 'Test Operator',
      key_issue: 'Machine stopped',
      nature_of_complaint: 'Motor failure',
      note: 'Test breakdown',
    },
    authToken
  )
);

const breakdownId = breakdownResult?.id;

// 10. Get Spare Parts
await test('GET All Spare Parts', () => request('GET', '/api/spares'));

// 11. Create Spare Part
const spareResult = await test('CREATE Spare Part', () =>
  request(
    'POST',
    '/api/spares',
    {
      part_code: 'SP-TEST-001',
      part_name: 'Test Spare',
      part_no: 'PN-001',
      min_level: 5,
      reorder_level: 10,
      current_stock: 20,
      unit_cost: 100.5,
      supplier: 'Test Supplier',
      spare_location: 'Warehouse A',
      bu_name: 'BU-ENG',
    },
    authToken
  )
);

const spareId = spareResult?.id;

// 12. Create Spare Transaction
if (spareId) {
  await test('CREATE Spare Transaction', () =>
    request(
      'POST',
      '/api/spares/transaction',
      {
        part_id: spareId,
        quantity: 2,
        direction: 'issue',
        asset_id: assetId || 1,
        pm_bd_id: breakdownId || 1,
        pm_bd_type: 'bd',
        purpose: 'Test transaction',
      },
      authToken
    )
  );
}

// 13. Get PM Schedules
await test('GET PM Schedules', () => request('GET', '/api/pm'));

// 14. Create PM Schedule
await test('CREATE PM Schedule', () =>
  request(
    'POST',
    '/api/pm',
    {
      asset_id: assetId || 1,
      pm_title: 'Monthly PM',
      frequency_interval: '30 days',
      next_pm_date: '2024-02-15',
      checklist_ref: 'CHK-001',
      status: 'scheduled',
    },
    authToken
  )
);

// 15. Get Utility Logs
await test('GET Utility Logs', () => request('GET', '/api/utilities'));

// 16. Create Utility Log
await test('CREATE Utility Log', () =>
  request(
    'POST',
    '/api/utilities',
    {
      utility_type: 'Power',
      meter_point: 'METER-001',
      reading_unit: 'kWh',
      reading_value: 1500.5,
      timestamp: new Date().toISOString(),
      asset_id: assetId || 1,
    },
    authToken
  )
);

// 17. Dashboard Stats
await test('GET Dashboard Stats', () => request('GET', '/api/dashboard/stats'));

// 18. Test Protected Endpoint Without Token (Should Fail)
const noAuthResult = await test('Protected Endpoint Without Token (Should Fail)', async () => {
  const result = await request('POST', '/api/assets', { asset_code: 'TEST' });
  // Should fail with 401
  return result.status === 401 ? { status: 200, data: { success: true } } : result;
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Summary:');
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);

if (results.failed.length > 0) {
  console.log('\n❌ Failed Tests:');
  results.failed.forEach((f) => {
    console.log(`   - ${f.name}`);
    if (f.status) console.log(`     Status: ${f.status}`);
    if (f.error) console.log(`     Error: ${f.error}`);
  });
}

console.log('\n✅ Test completed!');

