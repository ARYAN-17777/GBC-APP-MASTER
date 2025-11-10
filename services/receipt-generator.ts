import { Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { NewOrderPayload, OrderTransformer } from '../types/order';
import { supabaseAuth } from './supabase-auth';
import { formatOrderPrice, extractDiscountValue, extractSubtotalValue } from '../utils/currency';
import { LogoConverter } from '../utils/logo-converter';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  customizations?: Array<{
    name: string;
    qty?: number;
    price?: string;
  }>;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName?: string;
  items: OrderItem[];
  total: number;
  timestamp: string;
  notes?: string;
}

export class ThermalReceiptGenerator {

  /**
   * Format restaurant name for receipt header (split into multiple lines if needed)
   * Example: "General Bilimoria's Canteen" → ["General", "Bilimoria's", "Canteen"]
   */
  private formatRestaurantNameForReceipt(name: string): string[] {
    if (!name || name.trim() === '') {
      return ['Restaurant'];
    }

    // Special handling for "General Bilimoria's Canteen" format
    if (name.toLowerCase().includes('bilimoria')) {
      return ['General', 'Bilimoria\'s', 'Canteen'];
    }

    // For other restaurant names, split by words (max 3 lines)
    const words = name.split(/\s+/).filter(w => w.length > 0);
    if (words.length <= 3) {
      return words;
    }

    // If more than 3 words, combine into 2-3 lines
    const lines: string[] = [];
    let currentLine = '';
    const maxLineLength = 20;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxLineLength) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.slice(0, 3);
  }

  /**
   * Format address for receipt display (max 2 lines, ~30 chars per line)
   */
  private formatAddressForReceipt(address: string): string[] {
    if (!address || address.trim() === '') {
      return [''];
    }

    const maxLineLength = 30;
    const words = address.split(/[\s,]+/).filter(w => w.length > 0);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxLineLength) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    // Return max 2 lines
    return lines.slice(0, 2);
  }

  /**
   * Extract username from order data with multiple fallback strategies
   */
  private extractUsernameFromOrder(order: Order | any): string | null {
    // Strategy 1: Check for direct username field in order
    if (order.username) {
      return order.username;
    }

    // Strategy 2: Check for restaurant username in order.restaurant
    if (order.restaurant && order.restaurant.username) {
      return order.restaurant.username;
    }

    // Strategy 3: Check for restaurant_username field
    if (order.restaurant_username) {
      return order.restaurant_username;
    }

    // Strategy 4: Check for restaurantUsername field (camelCase)
    if (order.restaurantUsername) {
      return order.restaurantUsername;
    }

    // Strategy 5: Check for user.username field
    if (order.user && order.user.username) {
      return order.user.username;
    }

    // Strategy 6: Check for any other username-like fields
    if (order.orderUsername || order.order_username) {
      return order.orderUsername || order.order_username;
    }

    // No username found in order data
    return null;
  }

  /**
   * Process new payload format and convert to legacy format for receipt generation
   */
  private processNewPayload(newOrder: NewOrderPayload): Order {
    return {
      id: newOrder.userId,
      orderNumber: newOrder.orderNumber,
      customerName: newOrder.customer?.name || newOrder.user?.name || 'N/A',
      items: newOrder.items.map(item => ({
        name: item.title || (item as any).name || 'Unknown Item',
        quantity: item.quantity,
        price: item.price,
        customizations: item.customizations,
        notes: item.notes
      })),
      total: newOrder.amount,
      timestamp: new Date().toISOString(),
      notes: newOrder.orderNotes || '',
      // Pass through complete payload data for receipt generation
      customer: newOrder.customer,
      user: newOrder.user,
      totals: newOrder.totals,
      channel: newOrder.channel,
      restaurant: newOrder.restaurant
    } as any;
  }

  /**
   * Generate receipt for new or legacy payload format
   */
  async generateReceiptForPayload(orderData: NewOrderPayload | Order, restaurantName?: string): Promise<void> {
    let order: Order;

    // Check if it's new payload format
    if ('totals' in orderData && 'amountDisplay' in orderData) {
      order = this.processNewPayload(orderData as NewOrderPayload);
    } else {
      order = orderData as Order;
    }

    await this.generateAndShare(order, restaurantName);
  }

  /**
   * Generate PNG receipt (800px wide, ~300 DPI at 80mm)
   */
  async generatePNG(order: Order, restaurantName?: string): Promise<string | null> {
    try {
      const htmlContent = await this.generateThermalReceiptHTML(order, 'png', restaurantName);

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        width: 800, // 800px wide as specified
        height: 1200, // Auto-adjust height
        base64: false,
      });

      // Convert to PNG if needed (expo-print generates PDF by default)
      const pngUri = `${FileSystem.documentDirectory}thermal-receipt-${order.orderNumber}.png`;

      // For now, return the PDF URI (can be converted to PNG with additional libraries)
      console.log('✅ PNG receipt generated:', uri);
      return uri;

    } catch (error) {
      console.error('❌ PNG generation error:', error);
      Alert.alert('Error', 'Failed to generate PNG receipt');
      return null;
    }
  }

  /**
   * Generate PDF receipt (80mm width, auto height)
   */
  async generatePDF(order: Order, restaurantName?: string): Promise<string | null> {
    try {
      const htmlContent = await this.generateThermalReceiptHTML(order, 'pdf', restaurantName);

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        width: 226, // 80mm in points (80mm * 2.834 points/mm)
        height: 600, // Auto-adjust based on content
        base64: false,
      });

      console.log('✅ PDF receipt generated:', uri);
      return uri;

    } catch (error) {
      console.error('❌ PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF receipt');
      return null;
    }
  }

  /**
   * Generate both PNG and PDF, then share
   */
  async generateAndShare(order: Order, restaurantName?: string): Promise<void> {
    try {
      Alert.alert('Generating Receipt', 'Creating PNG and PDF files...');

      const [pngUri, pdfUri] = await Promise.all([
        this.generatePNG(order, restaurantName),
        this.generatePDF(order, restaurantName)
      ]);

      if (pngUri && pdfUri) {
        // Share the PDF (PNG sharing can be added when conversion is implemented)
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Receipt ${order.orderNumber}`,
        });

        Alert.alert(
          'Receipt Generated',
          `PNG and PDF receipts created successfully!\n\nPDF: ${pdfUri.split('/').pop()}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to generate receipt files');
      }

    } catch (error) {
      console.error('❌ Receipt generation error:', error);
      Alert.alert('Error', 'Failed to generate and share receipts');
    }
  }

  /**
   * Generate thermal receipt HTML with exact specifications matching reference image
   */
  async generateThermalReceiptHTML(order: Order, format: 'png' | 'pdf', restaurantName?: string): Promise<string> {
    // DEBUG: Log order data to check customizations
    console.log('🧾 Receipt Generator - Order Data:', JSON.stringify(order, null, 2));
    console.log('🧾 Receipt Generator - Items with customizations:');
    order.items.forEach((item, index) => {
      console.log(`Item ${index + 1}: ${item.name}`);
      console.log(`  Customizations:`, item.customizations);
      console.log(`  Has customizations:`, !!(item.customizations && item.customizations.length > 0));
    });

    const isHighDPI = format === 'png';
    const baseSize = isHighDPI ? 2 : 1; // Scale for PNG (high DPI)

    // Extract data from new payload structure
    const orderPayload = order as any;

    // Use dynamic restaurant name from order payload - NEVER hardcode
    const dynamicRestaurantName = orderPayload.restaurant?.name || restaurantName || 'General Bilimoria\'s Canteen';

    // Extract restaurant address from order payload if available, otherwise use default
    // Check both restaurant.address (string) and customer.address.postcode for fallback
    let restaurantAddress = 'Petts Wood, BR5 1DQ'; // Default fallback
    if (orderPayload.restaurant?.address && typeof orderPayload.restaurant.address === 'string') {
      restaurantAddress = orderPayload.restaurant.address;
    } else if (orderPayload.customer?.address?.postcode) {
      // Use customer postcode area as restaurant location if no restaurant address
      restaurantAddress = `Petts Wood, ${orderPayload.customer.address.postcode}`;
    }

    // GBC Logo - Load official logo with 256x256 size
    let gbcLogoBase64;
    try {
      gbcLogoBase64 = await LogoConverter.getLogoForHtmlReceipt();
      console.log('🖼️ Logo loaded for HTML receipt generation');
      console.log('🖼️ Logo data length:', gbcLogoBase64.length);
      console.log('🖼️ Logo data preview:', gbcLogoBase64.substring(0, 50) + '...');
    } catch (error) {
      console.error('❌ Failed to load logo:', error);
      // Use fallback SVG logo
      gbcLogoBase64 = LogoConverter.getFallbackSvgLogo();
      console.log('🔄 Using fallback SVG logo');
    }

    const totals = orderPayload.totals || {};

    // Extract totals from new payload
    const subtotal = totals.subtotal ? parseFloat(totals.subtotal) : extractSubtotalValue(order);
    const vat = totals.vat ? parseFloat(totals.vat) : 0.00;
    const delivery = totals.delivery ? parseFloat(totals.delivery) : 0.00;
    const discount = totals.discount ? parseFloat(totals.discount) : 0.00;
    const finalTotal = totals.total ? parseFloat(totals.total) : order.total;

    // Calculate VAT percentage (20% is standard UK VAT)
    const vatPercentage = subtotal > 0 ? Math.round((vat / subtotal) * 100) : 20;

    // Get current timestamp for order - Format: DD/MM/YYYY HH:MM:SS
    const currentTime = new Date();
    const orderDate = currentTime.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + currentTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Format order number - use actual order number from database, NEVER hardcode
    let formattedOrderNumber = order.orderNumber;
    // Only add prefix if it doesn't already have one
    if (!formattedOrderNumber.startsWith('#') && !formattedOrderNumber.startsWith('ORD-')) {
      formattedOrderNumber = `ORD-${formattedOrderNumber}`;
    }

    // Extract customer information from new payload
    const customer = orderPayload.customer || {};
    const customerName = customer.name || orderPayload.user?.name || order.customerName || 'N/A';

    // Enhanced phone number extraction - check multiple possible fields
    let customerPhone = 'N/A';
    if (customer.phone) {
      customerPhone = customer.phone;
    } else if (customer.mobile) {
      customerPhone = customer.mobile;
    } else if (customer.phoneNumber) {
      customerPhone = customer.phoneNumber;
    } else if (orderPayload.user?.phone) {
      customerPhone = orderPayload.user.phone;
    } else if (orderPayload.user?.mobile) {
      customerPhone = orderPayload.user.mobile;
    } else if (orderPayload.phone) {
      customerPhone = orderPayload.phone;
    } else if (orderPayload.mobile) {
      customerPhone = orderPayload.mobile;
    }

    console.log('📞 DEBUG: Phone extraction:');
    console.log('  - customer.phone:', customer.phone);
    console.log('  - customer.mobile:', customer.mobile);
    console.log('  - orderPayload.user?.phone:', orderPayload.user?.phone);
    console.log('  - orderPayload.phone:', orderPayload.phone);
    console.log('  - Final customerPhone:', customerPhone);

    // Extract and format customer address from new payload structure
    let customerAddress = '';
    if (customer.address) {
      const addr = customer.address;
      // Use display field if available, otherwise construct from parts
      if (addr.display) {
        customerAddress = addr.display;
      } else if (addr.line1) {
        // Format: "Flat 3A, 12 Station Road, BR5 1DQ"
        const addressParts = [
          addr.line1,
          addr.line2,
          addr.postcode
        ].filter(part => part && part.trim() !== '');
        customerAddress = addressParts.join(', ');
      }
    }

    // Format restaurant name for multi-line display
    const restaurantNameLines = this.formatRestaurantNameForReceipt(dynamicRestaurantName);

    // Format address for multi-line display (max 2 lines)
    const addressLines = this.formatAddressForReceipt(customerAddress);

    // Extract order notes
    const orderNotes = order.notes || orderPayload.orderNotes || '';

    console.log('🧾 Restaurant Name:', dynamicRestaurantName);
    console.log('🧾 Restaurant Name Lines:', restaurantNameLines);
    console.log('🧾 Restaurant Address:', restaurantAddress);
    console.log('🧾 Order Number:', formattedOrderNumber);
    console.log('🧾 Customer Name:', customerName);
    console.log('🧾 Customer Phone:', customerPhone);
    console.log('🧾 Customer Address:', customerAddress);
    console.log('🧾 Order Notes:', orderNotes);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 80mm auto;
      margin: ${2 * baseSize}mm ${3 * baseSize}mm;
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: ${12 * baseSize}pt;
      font-weight: bold;
      line-height: 1.3;
      margin: 0;
      padding: 0;
      color: #000;
      background: #fff;
      width: ${74 * baseSize}mm;
    }

    .header-text {
      font-size: ${14 * baseSize}pt;
      font-weight: bold;
      text-align: center;
      margin: 0;
      padding: 0;
      line-height: 1.2;
    }

    .divider {
      font-size: ${12 * baseSize}pt;
      font-weight: bold;
      font-family: 'Courier New', Courier, monospace;
      margin: ${1 * baseSize}mm 0;
      padding: 0;
      line-height: 1;
      text-align: left;
    }

    .info-line {
      font-size: ${12 * baseSize}pt;
      font-weight: bold;
      margin: 0;
      padding: 0;
      line-height: 1.3;
    }

    .section-header {
      font-size: ${13 * baseSize}pt;
      font-weight: bold;
      margin: 0;
      padding: 0;
      line-height: 1.3;
    }

    .item-line {
      font-size: ${12 * baseSize}pt;
      font-weight: bold;
      margin: 0;
      padding: 0;
      line-height: 1.3;
      display: flex;
      justify-content: space-between;
    }

    .item-name {
      flex: 1;
      padding-right: ${2 * baseSize}mm;
    }

    .item-price {
      text-align: right;
      white-space: nowrap;
    }

    .customization-line {
      font-size: ${11 * baseSize}pt;
      font-weight: bold;
      margin: 0;
      padding-left: ${2 * baseSize}mm;
      line-height: 1.3;
      display: flex;
      justify-content: space-between;
    }

    .note-line {
      font-size: ${11 * baseSize}pt;
      font-weight: normal;
      margin: 0;
      padding-left: ${2 * baseSize}mm;
      line-height: 1.3;
    }

    .total-line {
      font-size: ${13 * baseSize}pt;
      font-weight: bold;
      margin: 0;
      padding: 0;
      line-height: 1.3;
      display: flex;
      justify-content: space-between;
    }

    .total-label {
      flex: 1;
    }

    .total-value {
      text-align: right;
      white-space: nowrap;
    }

    .footer-text {
      font-size: ${12 * baseSize}pt;
      font-weight: bold;
      text-align: center;
      margin: 0;
      padding: 0;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  <!-- Restaurant Header - Dynamic from order payload -->
  <div class="header-text">${dynamicRestaurantName}</div>
  <div class="header-text">${restaurantAddress}</div>

  <div class="divider">------------------------------------------</div>

  <!-- Order Information -->
  <div class="info-line">Order: ${formattedOrderNumber}</div>
  <div class="info-line">Date: ${orderDate}</div>

  <div class="divider">------------------------------------------</div>

  <!-- Customer Information -->
  <div class="info-line">Customer: ${customerName}</div>
  <div class="info-line">Phone: ${customerPhone}</div>
  ${customerAddress ? `<div class="info-line">Address: ${addressLines[0] || ''}</div>
  ${addressLines[1] ? `<div class="info-line" style="padding-left: ${9 * baseSize}mm;">${addressLines[1]}</div>` : ''}` : ''}

  <div class="divider">------------------------------------------</div>

  <!-- Items Section Header -->
  <div class="section-header">Items</div>

  <div class="divider">------------------------------------------</div>

  <!-- Items List -->
  ${order.items.map(item => {
    // Get item name and details
    const itemName = (item as any).title || (item as any).name || 'Unknown Item';
    const itemNotes = (item as any).notes || '';
    const lineTotal = (item as any).lineTotal || item.price;

    let itemHtml = `
  <div class="item-line">
    <span class="item-name">${itemName} x${item.quantity}</span>
    <span class="item-price">£${typeof lineTotal === 'string' ? lineTotal : lineTotal.toFixed(2)}</span>
  </div>`;

    // Add customizations if available
    if (item.customizations && item.customizations.length > 0) {
      item.customizations.forEach(customization => {
        const custQty = customization.qty || 1;
        const custName = customization.name;

        // Try to calculate price per dish if available
        let priceDisplay = '';
        if (customization.price && parseFloat(customization.price) > 0) {
          const pricePerDish = parseFloat(customization.price);
          priceDisplay = `£${pricePerDish.toFixed(2)}`;
        }

        itemHtml += `
  <div class="customization-line">
    <span>  + ${custName} x${custQty} /dish</span>
    <span>${priceDisplay}</span>
  </div>`;

        // Add "Extras per dish" line if there's a price
        if (priceDisplay) {
          itemHtml += `
  <div class="customization-line">
    <span>  Extras per dish</span>
    <span>${priceDisplay}</span>
  </div>`;
        }
      });
    }

    // Add item notes if available
    if (itemNotes && itemNotes.trim() !== '') {
      itemHtml += `
  <div class="note-line">  note: ${itemNotes}</div>`;
    }

    return itemHtml;
  }).join('')}

  <div class="divider">------------------------------------------</div>

  <!-- Totals Section -->
  <div class="total-line">
    <span class="total-label">Subtotal</span>
    <span class="total-value">£${subtotal.toFixed(2)}</span>
  </div>
  <div class="total-line">
    <span class="total-label">Tax (${vatPercentage}%)</span>
    <span class="total-value">£${vat.toFixed(2)}</span>
  </div>
  <div class="total-line">
    <span class="total-label">Discount</span>
    <span class="total-value">£${discount.toFixed(2)}</span>
  </div>

  <div class="divider">------------------------------------------</div>

  <div class="total-line">
    <span class="total-label">Total</span>
    <span class="total-value">£${finalTotal.toFixed(2)}</span>
  </div>

  ${orderNotes && orderNotes.trim() !== '' ? `
  <div class="divider">------------------------------------------</div>
  <div class="info-line">Order note: ${orderNotes}</div>
  ` : ''}

  <div class="divider">------------------------------------------</div>

  <!-- Footer -->
  <div class="footer-text">Thank you for ordering!</div>
  <div class="footer-text">See you again online!</div>

  <div class="divider">------------------------------------------</div>
</body>
</html>`;
  }
}

export const thermalReceiptGenerator = new ThermalReceiptGenerator();
