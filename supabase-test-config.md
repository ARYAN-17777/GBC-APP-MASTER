# GBC Supabase Backend Test Configuration

## 🔧 **DEPLOYMENT STEPS**

### **1. Deploy Function**
```bash
# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF_HERE

# Deploy the create-order function
supabase functions deploy create-order --project-ref YOUR_PROJECT_REF_HERE

# Verify deployment
supabase functions list
```

### **2. Set Secrets**
```bash
# Set function secrets
supabase secrets set \
  PROJECT_URL=https://YOUR_PROJECT_REF_HERE.supabase.co \
  SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE \
  SITE_ORDER_SECRET=gbc_prod_secret_2024_a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2

# Verify secrets
supabase secrets list
```

### **3. Run Database Migration**
```bash
# Apply the database schema
supabase db push

# Or run the SQL manually in Supabase Dashboard > SQL Editor
```

## 🧪 **TESTING**

### **Function URL**
```
https://YOUR_PROJECT_REF_HERE.functions.supabase.co/create-order
```

### **Test Payload (Postman/cURL)**
```json
{
  "type": "new_order",
  "order": {
    "id": "realtime_test_001",
    "orderNumber": "RT-001",
    "status": "pending",
    "customerName": "Postman Test Customer",
    "items": [
      { "name": "Chicken Biryani", "quantity": 2, "price": 15.99 }
    ],
    "total": 31.98,
    "timestamp": "2024-08-30T23:50:00Z"
  }
}
```

### **Required Headers**
```
Content-Type: application/json
x-site-secret: gbc_prod_secret_2024_a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2
```

### **cURL Command**
```bash
curl -X POST https://YOUR_PROJECT_REF_HERE.functions.supabase.co/create-order \
  -H "Content-Type: application/json" \
  -H "x-site-secret: gbc_prod_secret_2024_a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2" \
  -d '{
    "type": "new_order",
    "order": {
      "id": "realtime_test_001",
      "orderNumber": "RT-001",
      "status": "pending",
      "customerName": "Postman Test Customer",
      "items": [
        { "name": "Chicken Biryani", "quantity": 2, "price": 15.99 }
      ],
      "total": 31.98,
      "timestamp": "2024-08-30T23:50:00Z"
    }
  }'
```

## 📱 **APP CONFIGURATION**

### **Update Environment Variables**
```env
# Add to .env file
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF_HERE.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

### **Update Supabase Service**
In `services/supabase-orders.ts`, replace:
```typescript
const projectRef = 'YOUR_PROJECT_REF_HERE';
```

## ✅ **SUCCESS CRITERIA**

### **Expected Response (201 Created)**
```json
{
  "success": true,
  "order": {
    "id": 1,
    "order_code": "RT-001",
    "customer_name": "Postman Test Customer",
    "total_minor": 3198,
    "status": "pending",
    "external_id": "realtime_test_001",
    "created_at": "2024-01-01T12:00:00Z",
    "order_items": [
      {
        "item_name": "Chicken Biryani",
        "quantity": 2,
        "item_price_minor": 1599
      }
    ]
  }
}
```

### **Database Verification**
Check these tables in Supabase Dashboard:
- `orders` - Should have new row with order data
- `order_items` - Should have items for the order
- `order_events` - Should have initial "pending" event

### **Real-time Verification**
- App should receive real-time update when order is created
- Order should appear in Home screen immediately
- No refresh required

## 🔧 **TROUBLESHOOTING**

### **Common Issues**

1. **404 Function Not Found**
   - Verify function is deployed: `supabase functions list`
   - Check URL format: `https://PROJECT_REF.functions.supabase.co/create-order`

2. **401 Unauthorized**
   - Verify `x-site-secret` header matches `SITE_ORDER_SECRET`
   - Check secrets are set: `supabase secrets list`

3. **500 Internal Server Error**
   - Check function logs: `supabase functions logs create-order --follow`
   - Verify environment variables are set correctly

4. **Database Errors**
   - Run migration: `supabase db push`
   - Check RLS policies allow reads
   - Verify tables exist with correct schema

## 📋 **DELIVERABLES CHECKLIST**

- [ ] Function deployed and accessible
- [ ] Secrets configured correctly
- [ ] Database schema applied
- [ ] Test payload returns 201 Created
- [ ] Database contains order data
- [ ] Real-time updates work in app
- [ ] No 400/404/500 errors for valid requests

## 🎯 **FINAL CONFIGURATION**

Replace these placeholders with actual values:
- `YOUR_PROJECT_REF_HERE` → Your Supabase project reference
- `YOUR_SERVICE_ROLE_KEY_HERE` → Your service role key from Supabase
- `YOUR_ANON_KEY_HERE` → Your anon key from Supabase

**Site Secret (Fixed):**
```
gbc_prod_secret_2024_a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2
```
