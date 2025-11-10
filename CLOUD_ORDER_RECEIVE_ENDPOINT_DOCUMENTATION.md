# Cloud Order Receive Endpoint Documentation

## Overview
This endpoint receives orders from external websites and creates them in the GBC restaurant app system. It validates restaurant mappings, prevents duplicate orders, and ensures proper order visibility in the mobile app.

## Endpoint Details

**URL:** `https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-order-receive`  
**Method:** `POST`  
**Content-Type:** `application/json`

## Required Headers

```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

## Request Body Structure

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `website_restaurant_id` | string | Your website's restaurant identifier |
| `app_restaurant_uid` | string | Restaurant UUID from handshake response |
| `orderNumber` | string | Unique order number (e.g., "#12345") |
| `amount` | number | Total order amount |
| `items` | array | Array of order items |
| `user` | object | Customer information |
| `callback_url` | string | URL for order status callbacks |
| `idempotency_key` | string | Unique key to prevent duplicates |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `currency` | string | "GBP" | Order currency |
| `status` | string | "pending" | Order status |
| `restaurant` | object | `{name: "GBC Kitchen"}` | Restaurant info |
| `time` | string | Current timestamp | Order time (ISO format) |
| `notes` | string | "" | Special instructions |
| `paymentMethod` | string | "website_order" | Payment method |

## Complete Request Example

```json
{
  "website_restaurant_id": "165",
  "app_restaurant_uid": "6e8fadce-f46b-48b2-b69c-86f5746cddaa",
  "orderNumber": "#110098",
  "amount": 38.25,
  "currency": "GBP",
  "status": "pending",
  "items": [
    {
      "title": "Chicken Biryani",
      "quantity": 2,
      "unitPrice": "12.50",
      "customizations": [],
      "lineTotal": "25.00"
    },
    {
      "title": "Garlic Naan",
      "quantity": 1,
      "unitPrice": "3.50",
      "customizations": [],
      "lineTotal": "3.50"
    }
  ],
  "user": {
    "name": "John Smith",
    "phone": "+447769906123",
    "email": "john@example.com"
  },
  "restaurant": {
    "name": "General Billionaire's Canteen"
  },
  "time": "2025-10-29T12:30:00Z",
  "notes": "Extra spicy please",
  "paymentMethod": "website_order",
  "callback_url": "https://your-website.com/api/orders/callback",
  "idempotency_key": "order-110098-1730203800"
}
```

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "order_id": "603188da-83bf-45a0-b19e-ab355e11b6fc",
  "message": "Order received and processed successfully",
  "received_at": "2025-10-29T12:30:05Z"
}
```

### Error Responses

#### Missing Required Field (400)
```json
{
  "success": false,
  "error": "Missing required field: website_restaurant_id"
}
```

#### Invalid Restaurant Mapping (403)
```json
{
  "success": false,
  "error": "Invalid restaurant mapping. Please complete handshake first.",
  "details": "No active mapping found between website and app restaurant IDs"
}
```

#### Duplicate Order (409)
```json
{
  "success": false,
  "error": "Duplicate order detected",
  "order_id": "existing-order-id",
  "message": "Order #110098 already exists"
}
```

#### Restaurant Not Found (404)
```json
{
  "success": false,
  "error": "Restaurant not found or not registered",
  "details": "App restaurant UID not found in registrations"
}
```

## Prerequisites

### 1. Complete Handshake Process
Before sending orders, you must complete the handshake process to establish a mapping between your `website_restaurant_id` and the app's `app_restaurant_uid`.

**Handshake Endpoint:** `https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-handshake`

### 2. Restaurant Registration
The restaurant must be registered in the GBC app system with a valid `app_restaurant_uid`.

## Important Notes

### Field Mapping
- `website_restaurant_id`: Your internal restaurant ID (e.g., "165")
- `app_restaurant_uid`: UUID from handshake response (e.g., "6e8fadce-f46b-48b2-b69c-86f5746cddaa")
- These values must match an active mapping in the `website_restaurant_mappings` table

### Order Visibility
Orders will only appear in the restaurant app if:
1. The `app_restaurant_uid` matches the logged-in restaurant's UID
2. The restaurant mapping is active and valid
3. All required fields are provided correctly

### Idempotency
Use a unique `idempotency_key` for each order to prevent duplicates. Recommended format:
```
order-{orderNumber}-{timestamp}
```

### Error Handling
Always check the response status and handle errors appropriately:
- 400: Fix missing or invalid fields
- 403: Complete handshake process first
- 409: Order already exists (check for duplicates)
- 404: Verify restaurant registration
- 500: Server error (retry after delay)

## Testing

### Test with cURL
```bash
curl -X POST https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-order-receive \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "website_restaurant_id": "165",
    "app_restaurant_uid": "6e8fadce-f46b-48b2-b69c-86f5746cddaa",
    "orderNumber": "#TEST001",
    "amount": 25.50,
    "items": [{"title": "Test Item", "quantity": 1, "unitPrice": "25.50"}],
    "user": {"name": "Test User", "phone": "+447700000000"},
    "callback_url": "https://your-site.com/callback",
    "idempotency_key": "test-001-1730203800"
  }'
```

## Troubleshooting

### Orders Not Appearing in App
1. Verify handshake completion and active mapping
2. Check `app_restaurant_uid` matches logged-in restaurant
3. Ensure all required fields are provided
4. Verify restaurant is registered in the system

### Common Mistakes
- Using wrong endpoint (`/create-order` instead of `/cloud-order-receive`)
- Missing required fields (especially `user`, `items`, `callback_url`)
- Invalid `app_restaurant_uid` format
- No active restaurant mapping

## Support
For integration support, verify your handshake process and restaurant mapping before sending orders.
