# 🚨 POSTMAN 400 BAD REQUEST - IMMEDIATE FIX

## ❌ **PROBLEM IDENTIFIED**
You're getting 400 Bad Request because:
1. **Missing JSON Body** - No request body configured
2. **Wrong URL** - Using `{{baseURL}}` instead of full URL

---

## ✅ **IMMEDIATE FIX - 4 STEPS**

### **STEP 1: Fix URL**
**Replace** your current URL with:
```
https://evqmvmjnfeefeeizeljq.supabase.co/rest/v1/orders
```
**Remove** the `{{baseURL}}` variable - use the full URL directly.

### **STEP 2: Add JSON Body**
1. **Click** the "Body" tab in Postman
2. **Select** "raw" radio button
3. **Select** "JSON" from the dropdown (right side)
4. **Paste** this exact JSON:

```json
{
  "userId": "36730b7c-18dc-40f4-8ced-ce9887032fb3",
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
    "email": "test@postman.com"
  },
  "restaurant": {
    "name": "GBC Restaurant"
  }
}
```

### **STEP 3: Verify Headers**
Your headers look correct, but make sure you have:
- ✅ `Content-Type: application/json`
- ✅ `Authorization: Bearer [your-service-role-key]`
- ✅ `apikey: [your-service-role-key]`
- ✅ `Prefer: return=representation`

### **STEP 4: Send Request**
**Click Send** - you should get **201 Created** instead of 400.

---

## 🎯 **EXACT POSTMAN CONFIGURATION**

### **Method**: POST

### **URL**: 
```
https://evqmvmjnfeefeeizeljq.supabase.co/rest/v1/orders
```

### **Headers Tab**:
| Key | Value |
|-----|-------|
| Content-Type | application/json |
| Authorization | Bearer [your-real-service-role-key] |
| apikey | [your-real-service-role-key] |
| Prefer | return=representation |

### **Body Tab**:
- Select: **raw**
- Format: **JSON**
- Content: The JSON payload above

---

## 🔍 **VERIFICATION**

### **Success Response (201 Created)**:
```json
{
  "id": "some-uuid",
  "userId": "36730b7c-18dc-40f4-8ced-ce9887032fb3",
  "orderNumber": "POSTMAN-001",
  "amount": 2500,
  "status": "pending",
  "createdAt": "2025-01-07T...",
  "items": [...],
  "user": {...},
  "restaurant": {...}
}
```

### **If Still 400**:
- Check JSON syntax (no trailing commas)
- Verify Content-Type header
- Make sure Body is set to "raw" and "JSON"

### **If 401**:
- Service role key is wrong
- Get real key from Supabase Dashboard

### **If 422**:
- Missing required fields
- Check database schema constraints

---

## 🚀 **QUICK TEST CHECKLIST**

- [ ] URL: Full Supabase URL (no variables)
- [ ] Method: POST
- [ ] Headers: All 4 headers present
- [ ] Body: Raw JSON format selected
- [ ] JSON: Valid syntax, no errors
- [ ] Send: Click and expect 201 Created

**This should fix your 400 error immediately!**
