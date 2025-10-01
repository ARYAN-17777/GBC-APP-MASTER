# Imin Swift 2 Pro Printer Testing Script

## 🎯 **TESTING OVERVIEW**

This script provides step-by-step instructions for verifying the robust multi-strategy printing system on an actual Imin Swift 2 Pro device.

---

## 📋 **PRE-TESTING CHECKLIST**

### Device Requirements
- ✅ **Imin Swift 2 Pro device** with built-in thermal printer
- ✅ **58mm thermal paper** loaded and ready
- ✅ **Power connected** and device fully charged
- ✅ **Latest APK installed** from EAS build

### App Requirements
- ✅ **GBC Canteen app** installed and running
- ✅ **Network connectivity** for order management
- ✅ **Login credentials** for staff access

---

## 🧪 **TESTING PHASES**

### **Phase 1: Module Diagnostics**

#### Test 1.1: Module Availability
1. **Open GBC Canteen app**
2. **Navigate to any order screen**
3. **Tap the 🔍 (Module Test) button**
4. **Expected Results**:
   ```
   ✅ "Module test passed!"
   ✅ Strategy detected: IMIN_SDK_PRIMARY or IMIN_SDK_ALTERNATE
   ✅ Printer instance available: true
   ✅ Device detected as Imin Swift 2 Pro
   ```

#### Test 1.2: Strategy Detection
1. **Check logs** for strategy selection:
   ```
   [IminPrinterModule] Using printing strategy: IMIN_SDK_PRIMARY
   [IminPrinterModule] Successfully loaded primary Imin SDK: com.imin.printerlib.IminPrintUtils
   ```

### **Phase 2: Basic Printing**

#### Test 2.1: Printer Initialization
1. **Tap the 🖨️ (Test Print) button**
2. **Expected Results**:
   ```
   ✅ "Printer initializing..." message appears
   ✅ Initialization completes in < 3 seconds
   ✅ "Printer ready" status shown
   ```

#### Test 2.2: Test Print Execution
1. **Continue with test print after initialization**
2. **Expected Results**:
   ```
   ✅ Paper feeds from printer
   ✅ "TEST 123" text prints clearly
   ✅ Paper cuts automatically (if supported)
   ✅ "Test print successful!" message appears
   ```

### **Phase 3: Receipt Printing**

#### Test 3.1: Single Order Receipt
1. **Create a test order** with multiple items
2. **Approve the order** to trigger automatic printing
3. **Expected Results**:
   ```
   ✅ Receipt prints automatically within 1.5 seconds
   ✅ Header shows "GENERAL BILIMORIA'S CANTEEN"
   ✅ Order details print with proper alignment
   ✅ Item names wrap correctly (32 chars max)
   ✅ Totals display accurately
   ✅ Paper feeds and cuts at end
   ```

#### Test 3.2: Receipt Content Verification
**Check printed receipt contains**:
- ✅ **Restaurant header** (centered)
- ✅ **Order ID** and timestamp
- ✅ **Customer information** (if available)
- ✅ **Item list** with quantities and prices
- ✅ **Subtotal, tax, and total** amounts
- ✅ **Footer message** ("Thank you for your order!")

### **Phase 4: Stress Testing**

#### Test 4.1: Consecutive Printing (10x Loop)
1. **Create 10 test orders** in sequence
2. **Approve each order** to trigger printing
3. **Expected Results**:
   ```
   ✅ All 10 receipts print successfully
   ✅ No app crashes or freezes
   ✅ Print quality remains consistent
   ✅ No paper jams or feed issues
   ✅ Average print time ≤ 1.5 seconds per receipt
   ```

#### Test 4.2: Error Recovery
1. **Simulate error conditions**:
   - Remove paper during printing
   - Open printer cover
   - Disconnect power briefly
2. **Expected Results**:
   ```
   ✅ App shows appropriate error messages
   ✅ System auto-recovers when issue resolved
   ✅ Retry functionality works correctly
   ✅ No permanent failures or crashes
   ```

---

## 🔧 **TROUBLESHOOTING GUIDE**

### **Issue: Module Test Fails**
**Symptoms**: 🔍 button shows "Module test failed"
**Solutions**:
1. Verify device is actually Imin Swift 2 Pro
2. Check app permissions in device settings
3. Restart app and try again
4. Check device logs for specific error messages

### **Issue: Strategy Not Detected**
**Symptoms**: "No printing strategy available"
**Solutions**:
1. Ensure Imin SDK is present on device
2. Check Android version compatibility
3. Verify package visibility permissions
4. Try manual strategy escalation

### **Issue: Printer Not Ready**
**Symptoms**: "Printer not ready" or initialization fails
**Solutions**:
1. Check thermal paper is loaded correctly
2. Ensure printer cover is closed
3. Verify power connection
4. Restart printer service via device settings

### **Issue: Poor Print Quality**
**Symptoms**: Faded or unclear text
**Solutions**:
1. Check thermal paper quality
2. Clean printer head
3. Adjust print density settings
4. Verify paper alignment

### **Issue: Paper Jam or Feed Problems**
**Symptoms**: Paper doesn't feed or jams
**Solutions**:
1. Remove and reload thermal paper
2. Check for paper debris
3. Ensure correct paper width (58mm)
4. Verify paper roll direction

---

## 📊 **SUCCESS CRITERIA CHECKLIST**

### **Build & Installation**
- ✅ EAS build completes without errors
- ✅ APK installs successfully on Imin Swift 2 Pro
- ✅ App launches without crashes

### **Functionality**
- ✅ Module test passes with strategy detection
- ✅ Test print produces physical output
- ✅ Order receipts print automatically
- ✅ Text wrapping works correctly (32 chars)
- ✅ Print quality is clear and readable

### **Performance**
- ✅ First print ≤ 3 seconds after tap
- ✅ Subsequent prints ≤ 1.5 seconds
- ✅ 10 consecutive prints succeed
- ✅ No memory leaks or performance degradation

### **Reliability**
- ✅ Error recovery works correctly
- ✅ Auto-retry functionality operates
- ✅ Strategy escalation functions if needed
- ✅ Graceful handling of non-Imin devices

---

## 🎯 **OPERATOR RUNBOOK**

### **Daily Operation**
1. **Power on** Imin Swift 2 Pro device
2. **Load thermal paper** if needed
3. **Open GBC Canteen app**
4. **Test print** once to verify functionality
5. **Process orders** normally - printing is automatic

### **If Printer Not Ready**
1. **Tap Retry** - system will auto-recover
2. **Check paper** - reload if empty
3. **Check power** - ensure device plugged in
4. **Restart app** if issues persist

### **Emergency Procedures**
1. **Manual receipt generation**: Use backup receipt system
2. **Customer service**: Explain technical issue, offer alternatives
3. **Technical support**: Contact IT with specific error messages
4. **Backup printing**: Use external receipt printer if available

---

**Status**: Ready for physical device testing  
**Next Action**: Install APK on Imin Swift 2 Pro and execute test phases
