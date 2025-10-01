// Test script for create-order API
const fetch = require('node-fetch');

const testOrder = {
  userId: "36730b7c-18dc-40f4-8ced-ce9887032fb3",
  orderNumber: `POSTMAN-${Date.now()}`,
  amount: 25.98,
  status: "pending",
  items: [
    {
      title: "Test Chicken Curry",
      quantity: 1,
      price: 18.00
    }
  ],
  user: {
    customer_name: "Postman Test Customer",
    customer_phone: "9876543210"
  },
  notes: null,
  paymentMethod: "app_order"
};

async function testCreateOrder() {
  try {
    console.log('🧪 Testing create-order API...');
    console.log('📝 Request payload:', JSON.stringify(testOrder, null, 2));
    
    const response = await fetch('https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/create-order-v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M'
      },
      body: JSON.stringify(testOrder)
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📊 Response body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Success! Order created:', data.order?.id);
      console.log('📋 Full response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error response:', responseText);
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }
}

testCreateOrder();
