# Swift 2 Pro Thermal Printer Integration Guide

## 🎯 **Quick Start**

### **1. Test the Fix**
```typescript
import { runQuickTest } from './utils/thermalPrinterTest';

// Run this first to verify the printer is working
await runQuickTest();
```

**Expected Result**: Should print "TEST 123" clearly visible on white paper.

### **2. Print a Receipt**
```typescript
import { thermalPrinter } from './utils/thermalPrinter';

// Print an order (your existing code should now work)
await thermalPrinter.printOrder(order, false); // Customer copy
await thermalPrinter.printOrder(order, true);  // Kitchen copy
```

**Expected Result**: Clear, readable receipt with all text visible.

---

## 🔧 **Troubleshooting**

### **If Receipts Are Still Blank**

#### **Step 1: Check Connection**
```typescript
const connectionState = await thermalPrinter.checkConnectionState();
console.log('Connection:', connectionState);
```

#### **Step 2: Try Different Density**
```typescript
// Try higher density for darker text
thermalPrinter.setDensity(12);
await runQuickTest();

// Or try lower density if too dark
thermalPrinter.setDensity(8);
await runQuickTest();
```

#### **Step 3: Switch Print Mode**
```typescript
import { togglePrintMode } from './utils/thermalPrinterTest';

// Cycle through: text → raster → auto
togglePrintMode();
await runQuickTest();
```

#### **Step 4: Adjust Black Threshold**
```typescript
// More aggressive black detection
thermalPrinter.setBlackThreshold(80);
await runQuickTest();

// Less aggressive (if text too thick)
thermalPrinter.setBlackThreshold(120);
await runQuickTest();
```

### **If Text Is Too Light**
```typescript
// Increase density
thermalPrinter.setDensity(12);

// Lower black threshold
thermalPrinter.setBlackThreshold(80);

// Force text mode
thermalPrinter.setPrintMode('text');
```

### **If Text Is Too Dark/Thick**
```typescript
// Decrease density
thermalPrinter.setDensity(8);

// Raise black threshold
thermalPrinter.setBlackThreshold(140);

// Try raster mode
thermalPrinter.setPrintMode('raster');
```

---

## 📋 **Feature Toggles**

### **Text vs Raster Mode Toggle**

**In Your App Settings/Debug Menu:**
```typescript
import { togglePrintMode, getPrinterConfig } from './utils/thermalPrinterTest';

// Add a button in your settings
const handleTogglePrintMode = () => {
  togglePrintMode();
  const config = getPrinterConfig();
  Alert.alert('Print Mode', `Current mode: ${config.mode}`);
};
```

**Manual Mode Setting:**
```typescript
import { thermalPrinter } from './utils/thermalPrinter';

// Force specific mode
thermalPrinter.setPrintMode('text');   // Most reliable
thermalPrinter.setPrintMode('raster'); // For complex layouts
thermalPrinter.setPrintMode('auto');   // Automatic selection
```

---

## 🧪 **Testing & Validation**

### **Daily Smoke Test**
```typescript
// Add this to your app startup or settings
import { runQuickTest } from './utils/thermalPrinterTest';

const dailySmokeTest = async () => {
  try {
    await runQuickTest();
    console.log('✅ Printer working correctly');
  } catch (error) {
    console.error('❌ Printer issue detected:', error);
    // Alert staff or log for investigation
  }
};
```

### **Full Diagnostic Test**
```typescript
// For troubleshooting sessions
import { runFullTest } from './utils/thermalPrinterTest';

const fullDiagnostic = async () => {
  await runFullTest();
  // Check printed output for quality assessment
};
```

### **Connection State Monitoring**
```typescript
const monitorPrinter = async () => {
  const state = await thermalPrinter.checkConnectionState();
  
  if (!state.isConnected) {
    Alert.alert('Printer Disconnected', 'Please check Bluetooth connection');
  }
  
  console.log('Printer Status:', {
    connected: state.isConnected,
    type: state.connectionType,
    model: state.printerModel
  });
};
```

---

## 📊 **Success Indicators**

### **✅ Working Correctly**
- Text is clearly visible (black on white)
- No blank sections in receipts
- Consistent output across multiple prints
- All receipt sections present (header, items, total, footer)
- Proper alignment and formatting

### **❌ Still Has Issues**
- Blank or very faint text
- Missing sections in receipts
- Inconsistent print quality
- Text too light to read
- Garbled or corrupted output

---

## 🔧 **Advanced Configuration**

### **Custom Printer Settings**
```typescript
import { ThermalPrinterService } from './utils/thermalPrinter';

// Create custom instance for specific needs
const customPrinter = new ThermalPrinterService({
  width: 384,           // 58mm paper
  mode: 'text',         // Force text mode
  density: 11,          // Higher density
  blackThreshold: 90,   // Aggressive black detection
  enableLogging: true,  // Debug logging
});
```

### **Environment-Specific Settings**
```typescript
// Different settings for different environments
const getOptimalSettings = () => {
  if (Platform.OS === 'android') {
    return {
      density: 10,
      blackThreshold: 100,
      mode: 'text' as const,
    };
  }
  
  // Fallback settings
  return {
    density: 8,
    blackThreshold: 127,
    mode: 'auto' as const,
  };
};
```

---

## 📱 **Integration with Your App**

### **Add to Settings Screen**
```typescript
const PrinterSettings = () => {
  const [config, setConfig] = useState(getPrinterConfig());
  
  return (
    <View>
      <Text>Print Mode: {config.mode}</Text>
      <Button title="Toggle Mode" onPress={togglePrintMode} />
      
      <Text>Density: {config.density}</Text>
      <Slider 
        value={config.density}
        minimumValue={8}
        maximumValue={12}
        onValueChange={(value) => thermalPrinter.setDensity(value)}
      />
      
      <Button title="Test Print" onPress={runQuickTest} />
    </View>
  );
};
```

### **Add to Debug Menu**
```typescript
const DebugMenu = () => (
  <View>
    <Button title="Quick Printer Test" onPress={runQuickTest} />
    <Button title="Full Printer Test" onPress={runFullTest} />
    <Button title="Toggle Print Mode" onPress={togglePrintMode} />
    <Button title="Check Connection" onPress={monitorPrinter} />
  </View>
);
```

---

## 🎯 **Final Verification**

**Your Swift 2 Pro thermal printer should now:**
1. ✅ Print clear, readable text
2. ✅ Show all receipt content
3. ✅ Work consistently across orders
4. ✅ Match the quality of other working apps
5. ✅ Provide reliable daily operation

**If you're still experiencing issues after following this guide, check the logs and run the full diagnostic test for detailed troubleshooting information.**
