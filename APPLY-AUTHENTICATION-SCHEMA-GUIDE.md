# 🔐 APPLY AUTHENTICATION SCHEMA - STEP BY STEP GUIDE

## 📋 OVERVIEW
This guide will help you manually apply the restaurant authentication schema to your Supabase database. The schema adds username/password authentication support to the existing GBC Kitchen App.

## 🎯 WHAT THIS SCHEMA ADDS
- ✅ Username and password columns to `registered_restaurants` table
- ✅ Account lockout protection (5 failed attempts = 15 min lockout)
- ✅ Authentication audit logging table
- ✅ Helper functions for account management
- ✅ Security policies and permissions
- ✅ Performance indexes

## 📝 STEP-BY-STEP INSTRUCTIONS

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/evqmvmjnfeefeeizeljq/sql/new
2. You should see the SQL Editor interface

### Step 2: Copy the Schema SQL
1. Open the file: `supabase-authentication-schema.sql` in this directory
2. Copy the ENTIRE contents of the file (all 170+ lines)
3. Paste it into the Supabase SQL Editor

### Step 3: Execute the Schema
1. Click the "Run" button (or press Ctrl+Enter)
2. Wait for the execution to complete
3. You should see "Success. No rows returned" or similar success message

### Step 4: Verify the Schema Was Applied
Run these verification queries one by one in the SQL Editor:

#### Check Authentication Columns:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'registered_restaurants' 
AND column_name IN ('username', 'password_hash', 'failed_login_attempts', 'account_locked_until', 'last_login_at', 'password_changed_at');
```
**Expected Result:** Should return 6 rows showing the new authentication columns.

#### Check Authentication Logs Table:
```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'restaurant_authentication_logs';
```
**Expected Result:** Should return 1 row with `restaurant_authentication_logs`.

#### Check Helper Functions:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('is_account_locked', 'lock_account_if_needed', 'reset_failed_attempts', 'increment_failed_attempts');
```
**Expected Result:** Should return 4 rows with the helper function names.

## 🚨 TROUBLESHOOTING

### If You Get Policy Errors:
- The schema includes `DROP POLICY IF EXISTS` statements to handle existing policies
- If you still get policy errors, you can safely ignore them as long as the main tables and columns are created

### If You Get Permission Errors:
- Make sure you're logged in as the project owner
- Try refreshing the page and running the schema again

### If Columns Already Exist:
- The schema uses `ADD COLUMN IF NOT EXISTS` so it's safe to run multiple times
- Existing columns won't be affected

## ✅ SUCCESS INDICATORS

After successfully applying the schema, you should have:

1. **New Columns in `registered_restaurants` table:**
   - `username` (VARCHAR(50), UNIQUE)
   - `password_hash` (VARCHAR(64))
   - `failed_login_attempts` (INTEGER, DEFAULT 0)
   - `account_locked_until` (TIMESTAMPTZ)
   - `last_login_at` (TIMESTAMPTZ)
   - `password_changed_at` (TIMESTAMPTZ)

2. **New Table:**
   - `restaurant_authentication_logs` (for security audit logging)

3. **New Functions:**
   - `is_account_locked(UUID)`
   - `lock_account_if_needed(UUID)`
   - `reset_failed_attempts(UUID)`
   - `increment_failed_attempts(UUID)`

## 🧪 TEST THE AUTHENTICATION SYSTEM

After applying the schema, run this test script to verify everything works:

```bash
cd GBC-APP-MASTER-main
node final-authentication-status.js
```

**Expected Result:** Should show 100% success rate with all components working.

## 📱 MOBILE APP TESTING

Once the schema is applied, test the mobile app:

1. **Start the app:**
   ```bash
   npx expo start
   ```

2. **Test Restaurant Login:**
   - Toggle to "Restaurant Login" mode
   - Try logging in with test credentials
   - Verify session persistence

## 🎉 COMPLETION CHECKLIST

- [ ] Schema applied successfully in Supabase SQL Editor
- [ ] Verification queries return expected results
- [ ] `final-authentication-status.js` shows 100% success
- [ ] Mobile app restaurant login toggle works
- [ ] Restaurant can login with username/password
- [ ] Session persists after app restart

## 🚀 NEXT STEPS AFTER COMPLETION

1. **Test Complete Flow:**
   - Register restaurant via website with username/password
   - Login to mobile app with same credentials
   - Verify order reception works

2. **Production Deployment:**
   - Test with real restaurant data
   - Monitor authentication logs
   - Deploy to production environment

## 📞 SUPPORT

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify you're using the correct Supabase project
3. Ensure you have proper permissions
4. Try running individual parts of the schema if needed

---

**🔐 This authentication system provides enterprise-grade security for restaurant login with the GBC Kitchen App!**
