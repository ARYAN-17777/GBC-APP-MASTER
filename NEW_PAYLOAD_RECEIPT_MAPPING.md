# New Payload Structure & Receipt Mapping

## 📋 Overview

This document details the mapping between the new website payload structure and the receipt printing system for the GBC Kitchen App.

---

## 🎯 New Receipt Format Requirements

Based on the reference image, the receipt should display:

```
        General
      Bilimoria's
        Canteen
    Petts Wood, BR5 1DQ

Order                 ORD-10042
Date         07/11/2025, 14:18:31

Customer              John Smith
Phone              +44 7700 900123
Address    Flat 3A, 12 Scraton
           Road, London, SW2 1EG

Paneer Tikka x2       £ 18.00
Extra Spicy x1         £ 0.50/Dish
(Note: extra spicy)

L Extra per dish x1    £ 6.75

Mango Lassi x1         £ 3.75

Subtotal               £ 28.50
Tax (20%)              £ 5.70
Delivery               £ 0.00
Total                 £ 34.20

Order note: Leave at door,
don't knock.

Thank you for dining with
us!
```

---

## 🔄 Payload Field Mapping

### ✅ FIELDS THAT CAN BE DISPLAYED

| Receipt Field | New Payload Path | Example Value | Status |
|--------------|------------------|---------------|--------|
| **Order Number** | `orderNumber` | "#654321" | ✅ Available |
| **Order Date/Time** | *Generated on receipt* | "07/11/2025, 14:18:31" | ✅ Use current timestamp |
| **Customer Name** | `customer.name` | "John Smith" | ✅ Available |
| **Customer Phone** | `customer.phone` | "+44 7700 900123" | ✅ Available |
| **Customer Address Line 1** | `customer.address.line1` | "221B Baker Street, Flat 2" | ✅ Available |
| **Customer Address Line 2** | `customer.address.line2` | "" | ✅ Available (optional) |
| **Customer City** | `customer.address.city` | "London" | ✅ Available |
| **Customer Postcode** | `customer.address.postcode` | "NW1 6XE" | ✅ Available |
| **Full Address Display** | `customer.address.display` | "221B Baker Street, Flat 2" | ✅ Available |
| **Item Name** | `items[].title` | "Paneer Tikka" | ✅ Available |
| **Item Quantity** | `items[].quantity` | 2 | ✅ Available |
| **Item Line Total** | `items[].lineTotal` | "17.00" | ✅ Available |
| **Item Unit Price** | `items[].unitPrice` | "8.50" | ✅ Available |
| **Customization Name** | `items[].customizations[].name` | "Extra Spicy" | ✅ Available |
| **Customization Qty** | `items[].customizations[].qty` | 1 | ✅ Available |
| **Item Notes** | `items[].notes` | "No onions" | ✅ Available |
| **Order Notes** | `orderNotes` | "Leave at the door" | ✅ Available |
| **Subtotal** | `totals.subtotal` | "28.99" | ✅ Available |
| **Discount** | `totals.discount` | "0.00" | ✅ Available |
| **Delivery Fee** | `totals.delivery` | "2.50" | ✅ Available |
| **VAT/Tax** | `totals.vat` | "0.00" | ✅ Available |
| **Total** | `totals.total` | "31.49" | ✅ Available |
| **Order Type** | `channel` | "pickup" or "delivery" | ✅ Available |
| **Restaurant Name** | `restaurant.name` | "Avhad's Kitchen" | ✅ Available |

### ❌ FIELDS NOT AVAILABLE IN NEW PAYLOAD

| Receipt Field | Old Payload Path | Why Not Available | Workaround |
|--------------|------------------|-------------------|------------|
| **Customization Price** | `customizations[].price` | New payload only has `name` and `qty` | ⚠️ Display without price or calculate from item price difference |
| **Individual Tax per Item** | N/A | Only total VAT provided | ℹ️ Show total VAT only |
| **Discount per Item** | `items[].discountPerLine` | Available but always "0.00" in example | ✅ Can display if non-zero |
| **Original Price (before discount)** | `items[].originalUnitPrice` | Available but same as `unitPrice` | ✅ Can display if different |

---

## 🎨 Receipt Layout Breakdown

### Header Section
```
✅ Restaurant Name: restaurant.name
✅ Restaurant Address: "Petts Wood, BR5 1DQ" (hardcoded or from config)
✅ Logo: Larger, more prominent (ASCII art or image)
```

### Order Information
```
✅ Order Number: orderNumber (e.g., "#654321")
✅ Date/Time: Current timestamp when receipt is generated
```

### Customer Information
```
✅ Customer Name: customer.name
✅ Phone: customer.phone
✅ Address: customer.address.display OR
           customer.address.line1
           customer.address.line2 (if exists)
           customer.address.city, customer.address.postcode
```

### Items Section
```
✅ Item Name x Quantity: items[].title x items[].quantity
✅ Line Total: items[].lineTotal
✅ Unit Price: items[].unitPrice (for reference)

For each item with customizations:
  ✅ Customization Name x Qty: items[].customizations[].name x items[].customizations[].qty
  ⚠️ Customization Price: NOT in payload (show as "per dish" or omit)
  
For each item with notes:
  ✅ (Note: ...): items[].notes
```

### Totals Section
```
✅ Subtotal: totals.subtotal
✅ Tax (VAT): totals.vat
✅ Delivery: totals.delivery
✅ Discount: totals.discount (if > 0)
✅ Total: totals.total
```

### Footer Section
```
✅ Order Notes: orderNotes (if exists)
✅ Thank You Message: Static text
```

---

## 🔧 Implementation Changes Required

### 1. **Order Type Definition** (`types/order.ts`)
```typescript
// Add new interface for the new payload structure
export interface NewOrderPayload {
  website_restaurant_id: string;
  app_restaurant_uid: string;
  userId: string;
  callback_url: string;
  idempotency_key: string;
  orderNumber: string;
  amount: number;
  amountDisplay: string;
  totals: {
    subtotal: string;
    discount: string;
    delivery: string;
    vat: string;
    total: string;
  };
  status: string;
  channel: 'pickup' | 'delivery';
  deliveryMethod: string;
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: string;
    unitPriceMinor: number;
    price: number;
    lineTotal: string;
    originalUnitPrice: string;
    discountedUnitPrice: string;
    discountPerUnit: string;
    discountPerLine: string;
    customizations: Array<{
      name: string;
      qty: number;
    }>;
    notes: string;
  }>;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      country: string;
      postcode: string;
      lat: number;
      lng: number;
      placeId: string;
      display: string;
    };
  };
  restaurant: {
    name: string;
  };
  orderNotes: string;
}
```

### 2. **Receipt Generator** (`services/receipt-generator.ts`)
- Update to extract data from new payload structure
- Implement larger logo at the top
- Match exact layout from reference image
- Handle customizations without prices
- Display order notes at the bottom

### 3. **Home Screen** (`app/(tabs)/index.tsx`)
- Update order display to use `orderNumber` instead of old field
- Display `customer.name` and `customer.phone`
- Show `channel` (pickup/delivery)
- Display items using `items[].title` and `items[].quantity`

### 4. **Orders Screen** (`app/(tabs)/orders.tsx`)
- Update order cards to use new payload fields
- Display customizations from `items[].customizations[]`
- Show order notes from `orderNotes`

---

## ⚠️ Important Notes

### Customization Pricing
The new payload structure does **NOT** include individual prices for customizations. The reference receipt shows:
```
Extra Spicy x1         £ 0.50/Dish
```

**Options:**
1. **Calculate from price difference**: Compare `items[].price` with base price
2. **Show without price**: Just display "Extra Spicy x1"
3. **Show as "per dish"**: Display generic "per dish" text
4. **Request from website**: Ask website team to add `customizations[].price` field

**Recommended Approach**: Show customizations without individual prices, as the line total already includes them.

### Address Formatting
The payload provides both:
- `customer.address.display`: Pre-formatted address
- Individual fields: `line1`, `line2`, `city`, `postcode`

**Recommended**: Use `display` field if available, otherwise construct from individual fields.

### Order Notes
The `orderNotes` field may contain multiple instructions separated by " | ":
```
"Leave at the door | Call when outside"
```

**Recommended**: Display as-is or split by " | " and show on separate lines.

---

## ✅ Migration Checklist

- [ ] Update `types/order.ts` with `NewOrderPayload` interface
- [ ] Update `services/receipt-generator.ts` to use new payload structure
- [ ] Enlarge logo in receipt header
- [ ] Update receipt layout to match reference image
- [ ] Update `app/(tabs)/index.tsx` to display new payload fields
- [ ] Update `app/(tabs)/orders.tsx` to display new payload fields
- [ ] Handle customizations without prices
- [ ] Display order notes at bottom of receipt
- [ ] Test with sample new payload
- [ ] Verify all status buttons still work
- [ ] Ensure backward compatibility (if needed)

---

## 🧪 Test Payload

Use the provided payload structure for testing:
- Order Number: "#654321"
- Customer: "John Smith"
- Items: Paneer Tikka (2x), Garlic Naan (3x)
- Customizations: Extra Spicy, Cheese
- Order Notes: "Leave at the door | Call when outside"

---

*Generated: 2025-11-07*  
*Status: READY FOR IMPLEMENTATION*  
*Priority: HIGH*
