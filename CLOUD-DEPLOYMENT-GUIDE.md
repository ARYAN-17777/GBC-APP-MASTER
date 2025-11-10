# Cloud-Based Handshake System Deployment Guide

## 🌐 Overview

This guide provides step-by-step instructions for deploying the cloud-based handshake system that eliminates device IP dependencies and enables automatic restaurant discovery.

## 📋 Prerequisites

- Supabase account with project access
- Supabase CLI installed
- Node.js and npm/yarn installed
- GBC Kitchen App source code

## 🚀 Deployment Steps

### Step 1: Deploy Database Schema

1. **Connect to Supabase:**
```bash
supabase login
supabase link --project-ref evqmvmjnfeefeeizeljq
```

2. **Deploy Cloud Handshake Schema:**
```bash
supabase db push --file cloud-handshake-schema.sql
```

3. **Verify Tables Created:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'restaurant_registrations',
  'handshake_requests', 
  'handshake_responses',
  'website_restaurant_mappings'
);
```

### Step 2: Deploy Supabase Edge Functions

1. **Deploy Cloud Restaurant Registration Function:**
```bash
supabase functions deploy cloud-register-restaurant --project-ref evqmvmjnfeefeeizeljq
```

2. **Deploy Cloud Handshake Function:**
```bash
supabase functions deploy cloud-handshake --project-ref evqmvmjnfeefeeizeljq
```

3. **Deploy Get Handshake Response Function:**
```bash
supabase functions deploy get-handshake-response --project-ref evqmvmjnfeefeeizeljq
```

4. **Deploy Cloud Order Receive Function:**
```bash
supabase functions deploy cloud-order-receive --project-ref evqmvmjnfeefeeizeljq
```

5. **Verify Functions Deployed:**
```bash
supabase functions list --project-ref evqmvmjnfeefeeizeljq
```

### Step 3: Configure Environment Variables

1. **Update App Environment Variables:**
```bash
# In your .env file or app.json
EXPO_PUBLIC_SUPABASE_URL=https://evqmvmjnfeefeeizeljq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_CLOUD_HANDSHAKE_ENABLED=true
```

2. **Verify Environment Configuration:**
```typescript
// In your app, verify environment variables are loaded
console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('Cloud Handshake Enabled:', process.env.EXPO_PUBLIC_CLOUD_HANDSHAKE_ENABLED);
```

### Step 4: Test Cloud Systems

1. **Test Restaurant Registration System:**
```bash
node test-cloud-restaurant-registration.js
```

2. **Test Cloud Handshake System:**
```bash
node test-cloud-handshake-system.js
```

3. **Test Individual Components:**
```bash
# Test restaurant registration
curl -X POST "https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-register-restaurant" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUPABASE_ANON_KEY" \
  -d '{
    "website_restaurant_id": "test_001",
    "restaurant_name": "Test Restaurant",
    "restaurant_phone": "+44 123 456 7890",
    "restaurant_email": "test@restaurant.com",
    "restaurant_address": "123 Test Street, London, UK",
    "callback_url": "https://test.com/callback"
  }'

# Test cloud handshake initiation
curl -X POST "https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-handshake" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUPABASE_ANON_KEY" \
  -d '{"website_restaurant_id": "test_001", "callback_url": "https://test.com/callback"}'
```

### Step 5: Update App Build

1. **Build Updated App:**
```bash
eas build --platform android --profile production
```

2. **Verify Cloud Integration:**
- Install updated app
- Login with user account
- Verify auto-registration message appears
- Check Supabase dashboard for restaurant registration

### Step 6: Website Integration

1. **Update Website Code:**
```javascript
// Replace old device IP handshake with cloud handshake
const handshakeResponse = await fetch(
  'https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-handshake',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer SUPABASE_ANON_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      website_restaurant_id: 'your_restaurant_id',
      callback_url: 'https://your-website.com/callback'
    })
  }
);
```

2. **Test Website Integration:**
```bash
# Use the provided website example
node cloud-handshake-website-example.js
```

## ✅ Verification Checklist

### Database Verification
- [ ] All cloud handshake tables created
- [ ] Row Level Security policies active
- [ ] Realtime subscriptions enabled
- [ ] Indexes and constraints in place

### Edge Functions Verification
- [ ] cloud-handshake function deployed and accessible
- [ ] get-handshake-response function deployed and accessible
- [ ] cloud-order-receive function deployed and accessible
- [ ] CORS headers configured correctly

### App Integration Verification
- [ ] Cloud handshake service imported
- [ ] Auto-registration on login working
- [ ] Handshake listener starting correctly
- [ ] Real-time subscriptions active

### Website Integration Verification
- [ ] Cloud handshake initiation working
- [ ] Handshake response polling working
- [ ] Order sending via cloud working
- [ ] No device IP dependencies

## 🔧 Troubleshooting

### Common Issues

1. **Edge Function Not Found (404)**
   - Verify function is deployed: `supabase functions list`
   - Check function name matches exactly
   - Ensure project reference is correct

2. **Authentication Errors (401)**
   - Verify Supabase anonymous key is correct
   - Check key hasn't expired
   - Ensure Authorization header format is correct

3. **Database Connection Issues**
   - Verify database schema is deployed
   - Check RLS policies are not blocking access
   - Ensure Realtime is enabled for tables

4. **App Auto-Registration Failing**
   - Check user is successfully logged in
   - Verify cloud handshake service is imported
   - Check network connectivity

### Debug Commands

```bash
# Check Supabase project status
supabase status

# View function logs
supabase functions logs cloud-handshake

# Test database connection
supabase db ping

# Verify environment variables
env | grep EXPO_PUBLIC_SUPABASE
```

## 📊 Monitoring

### Key Metrics to Monitor

1. **Handshake Success Rate**
   - Monitor handshake_requests table
   - Track completed vs failed requests
   - Monitor response times

2. **Restaurant Registration Rate**
   - Monitor restaurant_registrations table
   - Track active vs offline restaurants
   - Monitor auto-registration success

3. **Order Processing Rate**
   - Monitor order delivery success
   - Track real-time notification delivery
   - Monitor callback success rates

### Monitoring Queries

```sql
-- Handshake success rate (last 24 hours)
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM handshake_requests 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Active restaurants
SELECT COUNT(*) as active_restaurants
FROM restaurant_registrations 
WHERE is_online = true 
AND last_seen > NOW() - INTERVAL '5 minutes';

-- Order processing rate (last hour)
SELECT 
  COUNT(*) as orders_processed,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds
FROM orders 
WHERE created_at > NOW() - INTERVAL '1 hour';
```

## 🎉 Success Criteria

The cloud-based handshake system is successfully deployed when:

✅ **All tests pass (100% success rate)**
✅ **Zero device IP configuration required**
✅ **Restaurants auto-register on app login**
✅ **Websites can discover restaurants automatically**
✅ **Real-time communication works via Supabase**
✅ **Orders are delivered instantly to apps**
✅ **System scales to unlimited restaurants**

## 📞 Support

For deployment issues or questions:

1. **Check Documentation**: Review HANDSHAKE.md and handshake-for-beginners.md
2. **Run Tests**: Use test-cloud-handshake-system.js for diagnostics
3. **Check Logs**: Review Supabase function logs and app logs
4. **Verify Configuration**: Ensure all environment variables are correct

The cloud-based handshake system represents a revolutionary advancement in restaurant technology integration, providing seamless, scalable, and production-ready communication between websites and kitchen apps.
