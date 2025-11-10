# GBC Kitchen App - Dispatch Functionality Guide

## Overview

The dispatch functionality allows kitchen staff to notify the website when an order is ready for delivery/pickup. This creates a seamless communication flow between the kitchen app and the hotel website.

## Flow Diagram

```
Website Order → Supabase → Kitchen App → Prepare → Complete → Dispatch → Website Notification
```

## Features Implemented

### ✅ Dispatch Button
- Added to each completed order in the kitchen app
- Shows loading state during dispatch process
- Disabled state prevents multiple dispatch attempts
- Success/error feedback with retry options

### ✅ Secure Communication
- HTTPS-only communication
- Bearer token authentication using Supabase service role key
- Request validation and error handling
- Retry logic with exponential backoff

### ✅ Real-time Status Updates
- Order status updated in Supabase after successful dispatch
- Real-time UI updates using Supabase subscriptions
- Visual indicators for dispatched orders

### ✅ Configuration Management
- Multiple endpoint support (dev, staging, production)
- Configurable timeouts and retry attempts
- Endpoint testing and validation

## How to Use

### 1. Kitchen Staff Workflow

1. **Receive Order**: Orders appear in the kitchen app from the website
2. **Prepare Order**: Kitchen staff prepares the order
3. **Mark Complete**: Click "Mark as Completed" when food is ready
4. **Dispatch**: Click "Dispatch" button to notify the website
5. **Confirmation**: Receive success confirmation or error message

### 2. Order Status Flow

```
Website Order → active → completed → dispatched
```

- **active**: Order received and being prepared
- **completed**: Order ready for dispatch
- **dispatched**: Website notified, ready for delivery/pickup

### 3. Dispatch Button States

- **Hidden**: For active orders (not yet completed)
- **Enabled**: For completed orders ready to dispatch
- **Loading**: During dispatch process (shows spinner)
- **Dispatched**: Shows checkmark for already dispatched orders

## Technical Implementation

### API Endpoint Requirements

The website must implement a POST endpoint at `/api/order-dispatch` that:

1. **Accepts POST requests** with JSON payload
2. **Validates Bearer token** (Supabase service role key)
3. **Updates order status** in website database
4. **Returns JSON response** with success/error status

### Request Format

```json
{
  "order_id": "order_123",
  "status": "dispatched",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "dispatched_by": "kitchen_app",
  "app_version": "3.1.1"
}
```

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Order dispatched successfully",
  "order_id": "order_123",
  "timestamp": "2024-01-15T14:30:00.000Z"
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "message": "Error description"
}
```

### Required Headers

```
Content-Type: application/json
Authorization: Bearer <supabase-service-role-key>
Accept: application/json
User-Agent: GBC-Kitchen-App/3.1.1
```

## Configuration

### Default Endpoints

- **Production**: `https://hotel-website.com/api/order-dispatch`
- **Staging**: `https://staging-hotel-website.com/api/order-dispatch`
- **Development**: `https://dev-hotel-website.com/api/order-dispatch`

### Timeout Settings

- **Production**: 10 seconds
- **Staging**: 12 seconds
- **Development**: 15 seconds

### Retry Logic

- **Default**: 3 attempts with exponential backoff
- **Delays**: 2s, 4s, 8s between retries
- **No retry**: For 4xx client errors

## Security Features

### Authentication
- Bearer token authentication using Supabase service role key
- Token validation on website endpoint
- Secure HTTPS communication only

### Request Validation
- Required fields validation (order_id, status, timestamp)
- Status value validation (must be "dispatched")
- Order existence verification
- Duplicate dispatch prevention

### Error Handling
- Network timeout protection
- Retry logic for temporary failures
- Detailed error messages for debugging
- Graceful fallback for failed dispatches

## Testing

### Test Script
Run the test script to verify functionality:

```bash
node test-dispatch-functionality.js
```

### Manual Testing
1. Create a test order in the app
2. Mark it as completed
3. Click the dispatch button
4. Verify the request reaches your endpoint
5. Check the response and UI updates

### Endpoint Testing
Use the configuration service to test endpoints:

```javascript
import { dispatchConfigService } from './services/dispatch-config';

// Test specific endpoint
const result = await dispatchConfigService.testEndpoint('production');
console.log(result);

// Test all endpoints
const allResults = await dispatchConfigService.testAllEndpoints();
console.log(allResults);
```

## Website Integration

### PHP Implementation
See `website-dispatch-endpoint-example.php` for a complete PHP implementation example.

### Database Schema
```sql
CREATE TABLE orders (
    id VARCHAR(255) PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE,
    customer_name VARCHAR(255),
    status ENUM('pending', 'confirmed', 'preparing', 'completed', 'dispatched', 'delivered', 'cancelled'),
    total_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    dispatched_at TIMESTAMP NULL,
    dispatched_by VARCHAR(100) NULL,
    dispatch_notes TEXT NULL
);
```

### Required Website Changes
1. Create the dispatch endpoint
2. Update order status handling
3. Add dispatched status to order management
4. Optional: Customer notifications for dispatched orders

## Troubleshooting

### Common Issues

**Dispatch Button Not Showing**
- Check order status (must be "completed")
- Verify order is not already dispatched

**Dispatch Fails**
- Check network connectivity
- Verify endpoint URL is correct
- Confirm website endpoint is working
- Check authentication token

**Timeout Errors**
- Increase timeout in configuration
- Check website server response time
- Verify network stability

### Debug Logging
Enable detailed logging in the app:

```javascript
// Check console logs for dispatch process
console.log('🚀 Starting dispatch process...');
console.log('📦 Dispatch payload:', payload);
console.log('📡 Response status:', response.status);
```

### Error Messages
- **"Order not found"**: Order doesn't exist in Supabase
- **"Order already dispatched"**: Duplicate dispatch attempt
- **"Invalid authorization token"**: Wrong bearer token
- **"Timeout"**: Request took too long
- **"Network error"**: Connection failed

## Support

For technical support or questions about the dispatch functionality:

1. Check the console logs for detailed error messages
2. Test the endpoint using the provided test script
3. Verify the website endpoint implementation
4. Review the configuration settings

## Version History

- **v3.1.1**: Initial dispatch functionality implementation
- **v3.1.0**: Thermal receipt system
- **v3.0.x**: Core kitchen app features
