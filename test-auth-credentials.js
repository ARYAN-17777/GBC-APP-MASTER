// Test script to verify authentication with provided credentials
const fetch = require('node-fetch');

const API_BASE_URL = 'https://api.gbc-restaurant.com';

const credentials = {
  username: 'General Bilimoria\'s Canteen - Sawbridgeworth',
  password: 'Fz8@wN3#rLt2!Mcv'
};

async function testAuthentication() {
  console.log('🔐 Testing Authentication with provided credentials...');
  console.log('Username:', credentials.username);
  console.log('Password:', credentials.password.replace(/./g, '*'));
  console.log('');

  try {
    console.log('📡 Attempting login to:', `${API_BASE_URL}/auth/login`);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GBC-Restaurant-App/3.0.0',
      },
      body: JSON.stringify(credentials),
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📊 Response Body:', responseText);

    if (response.ok) {
      console.log('✅ Authentication successful!');
      try {
        const data = JSON.parse(responseText);
        if (data.access_token) {
          console.log('🎫 Access token received:', data.access_token.substring(0, 20) + '...');
        }
        if (data.user) {
          console.log('👤 User info:', data.user);
        }
      } catch (parseError) {
        console.log('⚠️  Response is not JSON, but login appears successful');
      }
    } else {
      console.log('❌ Authentication failed');
      console.log('Error details:', responseText);
    }

  } catch (error) {
    console.error('🚨 Network error:', error.message);
    
    // Test if the API endpoint exists
    console.log('');
    console.log('🔍 Testing API endpoint availability...');
    
    try {
      const pingResponse = await fetch(API_BASE_URL, {
        method: 'GET',
        timeout: 5000,
      });
      console.log('📡 API Base URL Status:', pingResponse.status);
    } catch (pingError) {
      console.log('🚨 API Base URL not reachable:', pingError.message);
    }
  }
}

async function testAlternativeEndpoints() {
  console.log('');
  console.log('🔍 Testing alternative API endpoints...');
  
  const alternativeUrls = [
    'https://api.gbcanteen.com/v1/auth/login',
    'https://api.gbcanteen.com/auth/login',
    'https://gbcanteen.com/api/auth/login',
    'https://api.gbc-restaurant.com/v1/auth/login',
  ];

  for (const url of alternativeUrls) {
    try {
      console.log(`📡 Testing: ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        timeout: 5000,
      });
      
      console.log(`   Status: ${response.status}`);
      if (response.status !== 404) {
        const text = await response.text();
        console.log(`   Response: ${text.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 GBC Restaurant App - Authentication Test');
  console.log('==========================================');
  console.log('');
  
  await testAuthentication();
  await testAlternativeEndpoints();
  
  console.log('');
  console.log('📋 Test Summary:');
  console.log('- Credentials provided by user have been tested');
  console.log('- Multiple API endpoints have been checked');
  console.log('- Network connectivity has been verified');
  console.log('');
  console.log('💡 Next steps:');
  console.log('1. If authentication failed, the API might be using different endpoints');
  console.log('2. The credentials might need to be URL-encoded or formatted differently');
  console.log('3. The API might require additional headers or authentication methods');
  console.log('4. Consider using the existing Supabase backend as documented in the project');
}

main().catch(console.error);
