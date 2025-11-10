# Cloud-Based Restaurant Registration API Documentation

## 🌐 Overview

The **Cloud-Based Restaurant Registration API** allows websites to register restaurants with the GBC Kitchen App's Supabase backend. This system follows the same cloud-first architecture as the existing cloud handshake system, eliminating all device IP dependencies and providing automatic integration with the cloud order system.

**Key Benefits:**
- ✅ **Zero Device IP Dependencies** - Pure cloud-based registration
- ✅ **Automatic Integration** - Seamless integration with cloud handshake and order systems
- ✅ **Comprehensive Validation** - Input validation with detailed error messages
- ✅ **Duplicate Detection** - Prevents duplicate registrations by email, phone, and website ID
- ✅ **Rate Limiting** - Prevents abuse with 10 requests per hour per IP
- ✅ **Production Ready** - Enterprise-grade security and error handling

---

## 📋 API Specification

### Endpoint Information

**URL:** `POST https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-register-restaurant`
**Method:** `POST`
**Content-Type:** `application/json`
**Authentication:** Supabase Anonymous Key Required

### Required Headers

```http
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M
User-Agent: YourWebsite/1.0
X-Website-Domain: your-restaurant-website.com
```

---

## 📝 Request Format

### Required Fields

```json
{
  "website_restaurant_id": "rest_gbc_demo_001",
  "restaurant_name": "GBC Kitchen Demo Restaurant",
  "restaurant_phone": "+44 123 456 7890",
  "restaurant_email": "demo@gbckitchen.com",
  "restaurant_address": "123 Main Street, London, UK",
  "callback_url": "https://your-restaurant-website.com/api/orders/callback"
}
```

### Complete Request with Optional Fields

```json
{
  "website_restaurant_id": "rest_gbc_demo_001",
  "restaurant_name": "GBC Kitchen Demo Restaurant",
  "restaurant_phone": "+44 123 456 7890",
  "restaurant_email": "demo@gbckitchen.com",
  "restaurant_address": "123 Main Street, London, UK",
  "owner_name": "John Smith",
  "category": "Indian Cuisine",
  "callback_url": "https://your-restaurant-website.com/api/orders/callback"
}
```

### Field Validation Rules

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| `website_restaurant_id` | string | ✅ | Max 100 chars, unique |
| `restaurant_name` | string | ✅ | 3-200 chars |
| `restaurant_phone` | string | ✅ | 10-20 chars, numbers/spaces/hyphens/+ only |
| `restaurant_email` | string | ✅ | Valid email format, max 255 chars, unique |
| `restaurant_address` | string | ✅ | 10-500 chars |
| `callback_url` | string | ✅ | Must start with https://, max 500 chars |
| `owner_name` | string | ❌ | Max 200 chars |
| `category` | string | ❌ | Max 100 chars |

---

## 📤 Response Formats

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Restaurant registered successfully",
  "app_restaurant_uid": "e7c291ca-1711-493c-83c8-f13965e8180a",
  "website_restaurant_id": "rest_gbc_demo_001",
  "registered_at": "2025-01-16T10:30:05Z",
  "next_steps": {
    "handshake": "Use cloud-handshake endpoint with this app_restaurant_uid as target_restaurant_uid",
    "orders": "Use cloud-order-receive endpoint to send orders to this restaurant"
  }
}
```

### Duplicate Restaurant Response (409 Conflict)

```json
{
  "success": false,
  "error": "Restaurant already registered",
  "duplicate_field": "restaurant_email",
  "existing_app_restaurant_uid": "e7c291ca-1711-493c-83c8-f13965e8180a",
  "message": "A restaurant with this email already exists. Use the existing UID for integration."
}
```

### Validation Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": "Validation failed",
  "validation_errors": [
    {
      "field": "restaurant_email",
      "message": "Invalid email format"
    },
    {
      "field": "callback_url",
      "message": "Callback URL must start with https://"
    }
  ]
}
```

### Rate Limit Response (429 Too Many Requests)

```json
{
  "success": false,
  "error": "Rate limit exceeded. Maximum 10 registration requests per hour per IP.",
  "retry_after": 3600
}
```

---

## 💻 cURL Examples

### Basic Registration

```bash
curl -X POST "https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-register-restaurant" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M" \
  -H "User-Agent: YourWebsite/1.0" \
  -H "X-Website-Domain: your-restaurant-website.com" \
  -d '{
    "website_restaurant_id": "rest_demo_001",
    "restaurant_name": "Demo Restaurant",
    "restaurant_phone": "+44 123 456 7890",
    "restaurant_email": "demo@restaurant.com",
    "restaurant_address": "123 Demo Street, London, UK",
    "callback_url": "https://demo-restaurant.com/api/callback"
  }'
```

### Complete Registration with Optional Fields

```bash
curl -X POST "https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-register-restaurant" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M" \
  -H "User-Agent: YourWebsite/1.0" \
  -H "X-Website-Domain: your-restaurant-website.com" \
  -d '{
    "website_restaurant_id": "rest_complete_001",
    "restaurant_name": "Complete Demo Restaurant",
    "restaurant_phone": "+44 987 654 3210",
    "restaurant_email": "complete@restaurant.com",
    "restaurant_address": "456 Complete Street, London, UK",
    "owner_name": "Jane Smith",
    "category": "Mediterranean Cuisine",
    "callback_url": "https://complete-restaurant.com/api/callback"
  }'
```

---

## 🔗 Integration Workflow

### Step 1: Register Restaurant

Use the registration API to register your restaurant and receive an `app_restaurant_uid`.

### Step 2: Initiate Cloud Handshake

Use the cloud handshake system with the received `app_restaurant_uid`:

```bash
curl -X POST "https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-handshake" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUPABASE_ANON_KEY" \
  -d '{
    "website_restaurant_id": "rest_demo_001",
    "callback_url": "https://demo-restaurant.com/api/callback",
    "target_restaurant_uid": "e7c291ca-1711-493c-83c8-f13965e8180a"
  }'
```

### Step 3: Send Orders

Use the cloud order system to send orders:

```bash
curl -X POST "https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-order-receive" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUPABASE_ANON_KEY" \
  -d '{
    "website_restaurant_id": "rest_demo_001",
    "app_restaurant_uid": "e7c291ca-1711-493c-83c8-f13965e8180a",
    "orderNumber": "#12345",
    "amount": 25.50,
    "items": [...],
    "user": {...}
  }'
```

---

## 🔒 Security Features

### Input Validation
- **Email Format**: RFC-compliant email validation
- **Phone Format**: International phone number validation
- **URL Validation**: HTTPS-only callback URLs
- **Length Limits**: All fields have appropriate length constraints

### Duplicate Detection
- **Email Uniqueness**: Case-insensitive email duplicate detection
- **Phone Uniqueness**: Normalized phone number duplicate detection
- **Website ID Uniqueness**: Unique website restaurant ID enforcement

### Rate Limiting
- **10 Requests/Hour**: Per IP address rate limiting
- **Automatic Reset**: Rate limit resets every hour
- **Graceful Handling**: Clear error messages with retry information

### Audit Logging
- **Registration Attempts**: All attempts logged with IP, timestamp, and status
- **Error Tracking**: Detailed error logging for monitoring and debugging
- **Success Tracking**: Successful registrations tracked for analytics

---

## 🧪 Testing

### Run Test Suite

```bash
node test-cloud-restaurant-registration.js
```

### Test Scenarios Covered

1. ✅ Successful registration with all fields
2. ✅ Successful registration with required fields only
3. ✅ Duplicate email detection
4. ✅ Duplicate phone detection
5. ✅ Duplicate website_restaurant_id detection
6. ✅ Invalid email format rejection
7. ✅ Invalid phone format rejection
8. ✅ Invalid callback URL rejection
9. ✅ Missing required field rejection
10. ✅ Field length validation
11. ✅ Rate limiting after 10 requests
12. ✅ Database integration verification

---

## 📊 Error Codes Reference

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 201 | Success | Restaurant registered successfully |
| 400 | Validation Error | Invalid input data |
| 409 | Conflict | Duplicate restaurant detected |
| 429 | Rate Limited | Too many requests from IP |
| 500 | Server Error | Internal server error |

---

## 🚀 Production Deployment

### Prerequisites
1. Supabase project with cloud handshake system deployed
2. Database schema deployed (`cloud-restaurant-registration-schema.sql`)
3. Edge Function deployed (`cloud-register-restaurant`)

### Deployment Commands

```bash
# Deploy database schema
supabase db push --file cloud-restaurant-registration-schema.sql

# Deploy Edge Function
supabase functions deploy cloud-register-restaurant --project-ref evqmvmjnfeefeeizeljq

# Verify deployment
supabase functions list --project-ref evqmvmjnfeefeeizeljq
```

### Monitoring

Monitor registration activity using:

```sql
-- Registration success rate (last 24 hours)
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM restaurant_registration_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Active registered restaurants
SELECT COUNT(*) as total_registered_restaurants
FROM registered_restaurants 
WHERE is_active = true;
```

---

## 📞 Support

For API issues or questions:

1. **Check Test Suite**: Run `test-cloud-restaurant-registration.js` for diagnostics
2. **Review Logs**: Check Supabase function logs for detailed error information
3. **Verify Configuration**: Ensure all environment variables and headers are correct
4. **Check Documentation**: Review integration workflow and examples

The cloud-based restaurant registration system provides a secure, scalable foundation for restaurant integration with the GBC Kitchen App ecosystem.
