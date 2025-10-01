# 🚨 POSTMAN 401 UNAUTHORIZED - QUICK FIX

## ❌ **PROBLEM IDENTIFIED**
You're using **demo placeholder keys** instead of your **real Supabase service role key**.

---

## ✅ **SOLUTION - 3 STEPS**

### **STEP 1: Get Real Service Role Key**
1. **Go to**: https://supabase.com/dashboard
2. **Select**: Your project `evqmvmjnfeefeeizeljq`
3. **Navigate**: Settings → API
4. **Copy**: The **service_role** key (long JWT token)
   - ⚠️ **NOT** the anon key
   - ⚠️ **NOT** the URL
   - ✅ **YES** the service_role secret key

### **STEP 2: Fix Postman Headers**
**Remove** the Authorization tab setup and use **Headers tab ONLY**:

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer [YOUR_REAL_SERVICE_ROLE_KEY]` |
| `apikey` | `[YOUR_REAL_SERVICE_ROLE_KEY]` |
| `Prefer` | `return=representation` |

**⚠️ Replace `[YOUR_REAL_SERVICE_ROLE_KEY]` with the actual key from Step 1**

### **STEP 3: Verify Body**
Your body looks correct:
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
    }
  ],
  "user": {
    "name": "Postman Test User",
    "phone": "+44 123 456 7890"
  },
  "restaurant": {
    "name": "GBC Restaurant"
  }
}
```

---

## 🔍 **VERIFICATION STEPS**

### **1. Check Your Service Role Key**
- Should start with `eyJ...`
- Should be much longer than what you currently have
- Should contain `"role":"service_role"` when decoded

### **2. Test the Key**
Try this simple test first:
```
GET https://evqmvmjnfeefeeizeljq.supabase.co/rest/v1/orders
Headers:
- Authorization: Bearer [YOUR_REAL_SERVICE_ROLE_KEY]
- apikey: [YOUR_REAL_SERVICE_ROLE_KEY]
```

If this returns data (even empty array), your key works.

### **3. Expected Success Response**
When fixed, you should get:
- **Status**: `201 Created`
- **Body**: The created order object with an `id` field

---

## 🚨 **COMMON MISTAKES TO AVOID**

❌ **Don't use**: The anon key for Postman  
❌ **Don't use**: Demo/placeholder keys from guides  
❌ **Don't mix**: Authorization tab + Headers tab  
❌ **Don't forget**: The `apikey` header  

✅ **Do use**: Real service_role key from your dashboard  
✅ **Do use**: Headers tab only  
✅ **Do include**: Both Authorization and apikey headers  

---

## 🎯 **QUICK TEST**

1. **Get real service role key** from Supabase dashboard
2. **Replace both placeholders** in headers with real key
3. **Send request**
4. **Should get 201 Created** instead of 401

If you still get 401 after using the real key, the issue might be:
- Wrong project URL
- Key copied incorrectly (extra spaces/characters)
- Project permissions issue

**Let me know if you need help getting the real service role key!**
