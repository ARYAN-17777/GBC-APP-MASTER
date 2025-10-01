// Test the Edge Function
const testOrder = async () => {
  const url = 'https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/create-order';
  
  const payload = {
    userId: "12345678-1234-1234-1234-123456789012",
    orderNumber: "TEST-001",
    amount: 2500,
    status: "pending",
    items: [
      {
        title: "Test Item",
        quantity: 1,
        price: 2500
      }
    ],
    user: {
      name: "Test Customer",
      phone: "9876543210"
    },
    restaurant: {
      name: "GBC Restaurant"
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M'
      },
      body: JSON.stringify(payload)
    });

    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testOrder();
