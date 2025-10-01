# 🧪 POSTMAN TESTING GUIDE - Make Orders Visible in App

## 🎯 **CRITICAL SUCCESS FACTORS**

### **1. User ID Matching (MOST IMPORTANT)**
- **App User ID**: Get this from the debug banner in the app after login
- **Postman Payload**: Must use EXACT same `userId` value
- **Field Name**: Use `userId` (not `user_id`)

### **2. Supabase Configuration**
- **URL**: `https://evqmvmjnfeefeeizeljq.supabase.co`
- **Project**: `evqmvmjnfeefeeizeljq`

---

## 🔧 **POSTMAN SETUP**

### **Method**: POST
### **URL**: `https://evqmvmjnfeefeeizeljq.supabase.co/rest/v1/orders`

### **Headers** (IMPORTANT - Get real keys from Supabase Dashboard):
```
Content-Type: application/json
Authorization: Bearer [GET_FROM_SUPABASE_DASHBOARD_SETTINGS_API_SERVICE_ROLE_KEY]
apikey: [GET_FROM_SUPABASE_DASHBOARD_SETTINGS_API_SERVICE_ROLE_KEY]
Prefer: return=representation
```

**⚠️ CRITICAL**: The keys above are placeholders! Get your real service_role key from:
1. https://supabase.com/dashboard → Your Project → Settings → API
2. Copy the "service_role" key (NOT the anon key)
3. Replace both [GET_FROM_SUPABASE...] with your real key

---

## 📋 **PAYLOAD TEMPLATE**

### **STEP 1: Get User ID from App**
1. Login to the app
2. Look for the debug banner: `🔧 DEBUG: User ID: 12345678... | Project: evqmvmjnfeefeeizeljq`
3. Copy the full User ID (you'll need to get it from app logs or database)

### **STEP 2: Use This Payload (Copy to Body → raw → JSON)**
```json
{
  "userId": "RE36730b7c-18dc-40f4-8ced-ce9887032fb3",
  "orderNumber": "POSTMAN-001",
  "amount": 2500,
  "status": "pending",
  "items": [
    {
      "title": "Test Chicken Curry",
      "quantity": 1,
      "price": 1500
    },
    {
      "title": "Test Rice",
      "quantity": 1,
      "price": 1000
    }
  ],
  "user": {
    "name": "Postman Test User",
    "phone": "+44 123 456 7890",
    "email": "test@postman.com",
    "address": "123 Test Street, London"
  },
  "restaurant": {
    "name": "GBC Restaurant"
  },
  "stripeId": "pi_test_postman_123",
  "time": "12:30 PM",
  "createdAt": "2024-01-15T12:30:00.000Z"
}
```

---

## 🔍 **TESTING STEPS**

### **Phase 1: Get User ID**
1. **Login to app** with your credentials
2. **Check debug banner** for User ID (first 8 characters shown)
3. **Get full User ID** using one of these methods:
   - Check app logs in development
   - Query Supabase directly: `SELECT id FROM auth.users WHERE email = 'your-email@example.com'`
   - Use the debug function: `SELECT debug_user_orders()`

### **Phase 2: Test with Service Role**
1. **Use service role key** in Postman headers
2. **Set exact userId** in payload
3. **Send POST request**
4. **Check response** - should return the created order

### **Phase 3: Verify in App**
1. **Refresh the app** (pull down on orders list)
2. **Check if order appears** in the orders list
3. **Verify real-time updates** (order should appear automatically if real-time is working)

### **Phase 4: Test with Anon Key (Optional)**
1. **Replace service role key** with anon key in headers
2. **Add user session** (this is more complex, use service role for testing)

---

## 🚨 **TROUBLESHOOTING**

### **If Order Doesn't Appear:**

#### **1. Check User ID Mismatch**
```sql
-- Run in Supabase SQL Editor
SELECT 
  id,
  orderNumber,
  userId,
  createdAt
FROM orders 
WHERE orderNumber LIKE 'POSTMAN%'
ORDER BY createdAt DESC;
```

#### **2. Check RLS Policies**
```sql
-- Run in Supabase SQL Editor  
SELECT * FROM debug_orders_with_auth 
WHERE orderNumber LIKE 'POSTMAN%';
```

#### **3. Test with Temporary Open Policy**
```sql
-- TEMPORARY - Remove after testing
CREATE POLICY "TEMP_view_all" ON orders FOR SELECT USING (true);
-- Test app, then remove:
-- DROP POLICY "TEMP_view_all" ON orders;
```

#### **4. Check App Logs**
- Look for Supabase query errors
- Check if user is authenticated
- Verify real-time subscription is active

---

## ✅ **SUCCESS CRITERIA**

### **Immediate Success (≤2 seconds)**
- [ ] Postman returns 201 Created with order data
- [ ] App shows order after manual refresh
- [ ] Debug banner shows correct User ID

### **Real-time Success (≤5 seconds)**  
- [ ] Order appears automatically without refresh
- [ ] Real-time subscription receives update
- [ ] Order appears at top of list (newest first)

### **RLS Security Success**
- [ ] Order visible to correct user only
- [ ] Different user cannot see the order
- [ ] Service role can insert for any user

---

## 🔧 **ADVANCED DEBUGGING**

### **Get User ID Programmatically**
```javascript
// In app console or debug
const { supabaseAuth } = await import('../../services/supabase-auth');
const user = supabaseAuth.getCurrentUser();
console.log('User ID:', user?.id);
```

### **Test RLS Directly**
```sql
-- Set user context and test
SELECT set_config('request.jwt.claims', '{"sub":"YOUR_USER_ID"}', true);
SELECT * FROM orders WHERE userId = 'YOUR_USER_ID';
```

### **Monitor Real-time**
```javascript
// In app console
const { supabase } = await import('../../lib/supabase');
supabase.channel('test').on('postgres_changes', {
  event: '*', schema: 'public', table: 'orders'
}, (payload) => console.log('Real-time:', payload)).subscribe();
```

---

## 📞 **QUICK REFERENCE**

- **Supabase URL**: `https://evqmvmjnfeefeeizeljq.supabase.co`
- **Service Role**: Use for Postman testing (bypasses RLS)
- **Anon Key**: Use for app (enforces RLS)
- **Critical Field**: `userId` must match exactly
- **Order**: Results ordered by `createdAt DESC`
- **Debug**: Check banner for User ID and project info
