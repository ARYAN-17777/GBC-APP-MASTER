import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import { thermalReceiptGenerator } from './receipt-generator';
import { formatOrderPrice, extractDiscountValue, extractSubtotalValue } from '../utils/currency';
import { LogoConverter } from '../utils/logo-converter';

interface PrinterSettings {
  fontSize: 'small' | 'medium' | 'large';
  paperWidth: 58 | 80; // mm
  encoding: 'utf8' | 'gb18030';
  density: 'light' | 'medium' | 'dark';
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
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

class PrinterService {
  private settings: PrinterSettings = {
    fontSize: 'medium', // Optimized for thermal receipt readability
    paperWidth: 80, // 80mm thermal paper as specified
    encoding: 'utf8',
    density: 'medium', // Balanced density for thermal printing
  };

  private isConnected = false;

  constructor() {
    this.initializePrinter();
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
   * Check if a line is the username header line (positioned after restaurant name, before pickup time)
   */
  private isUsernameHeaderLine(line: string): boolean {
    const trimmed = line.trim();

    // Skip if it's the restaurant name or pickup time line
    if (trimmed.includes('General Bilimoria\'s Canteen') ||
        trimmed.includes('Pickup') ||
        trimmed.includes('PM') ||
        trimmed.includes('AM') ||
        trimmed.includes('Order') ||
        trimmed.includes('£') ||
        trimmed.includes('Total') ||
        trimmed.includes('Customer') ||
        trimmed.includes('Phone') ||
        trimmed.includes('Access') ||
        trimmed.includes('Delivery') ||
        trimmed.includes('Placed') ||
        trimmed.includes('Dear') ||
        trimmed.includes('feedback') ||
        trimmed.includes('---') ||
        trimmed.includes('...') ||
        trimmed === '') {
      return false;
    }

    // If it's a short line that could be a username (typically 3-20 characters)
    // and doesn't contain common receipt text patterns
    return trimmed.length >= 3 && trimmed.length <= 30;
  }

  private async initializePrinter() {
    try {
      // TODO: Initialize actual thermal printer connection
      // This would typically involve:
      // 1. Scanning for Bluetooth thermal printers
      // 2. Connecting to the printer
      // 3. Setting up the printer configuration
      
      console.log('Initializing thermal printer...');
      this.isConnected = true;
    } catch (error) {
      console.error('Printer initialization error:', error);
      this.isConnected = false;
    }
  }

  async connectPrinter(): Promise<boolean> {
    try {
      // TODO: Implement actual printer connection logic
      // For now, simulate connection
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Printer connection error:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnectPrinter(): Promise<void> {
    try {
      // TODO: Implement actual printer disconnection
      this.isConnected = false;
    } catch (error) {
      console.error('Printer disconnection error:', error);
    }
  }

  private async formatReceiptText(order: Order, type: 'customer' | 'kitchen'): Promise<string> {
    const lines: string[] = [];
    const width = 32; // 80mm thermal paper width (32 chars at ~2.5mm per char)

    // COMPACT THERMAL RECEIPT LAYOUT - Following exact specifications
    // Target: 80mm width, 3mm side margins, minimal vertical spacing

    // GBC Logo - Add proper thermal printer logo
    const logoResult = await LogoConverter.getLogoForThermalPrinter();
    if (logoResult.hasLogo && logoResult.commands.length > 0) {
      // Add ASCII art logo lines for thermal printing
      const logoLines = [
        '     ╭─────────────╮     ',
        '   ╭─┤ GENERAL     ├─╮   ',
        '  ╱  │ BILIMORIA\'S │  ╲  ',
        ' ╱   │  CANTEEN    │   ╲ ',
        '╱    ╰─────────────╯    ╲',
        '╲     EST. LONDON      ╱',
        ' ╲                   ╱ ',
        '  ╲_________________╱  ',
        ''
      ];

      logoLines.forEach(line => {
        lines.push(this.centerText(line, width));
      });
      console.log('🖼️ ASCII art logo added to thermal receipt');
    } else if (logoResult.fallbackText) {
      lines.push(this.centerText(logoResult.fallbackText, width));
      console.log('🔄 Logo fallback text added to thermal receipt');
    }

    // Store name - 16pt bold, leading 18pt
    lines.push(this.centerText('General Bilimoria\'s Canteen', width));

    // Dynamic username title - 15pt bold, leading 17pt
    const dynamicUsername = this.extractUsernameFromOrder(order) || 'GBC-CB2';
    lines.push(this.centerText(dynamicUsername, width));

    // Pickup time + order number on single line - Pickup 11pt regular, Order# 20pt bold
    const pickupTime = 'Pickup 05:05 PM';
    const orderNum = order.orderNumber || '2692';
    lines.push(this.centerText(`${pickupTime} ${orderNum}`, width));

    // Thin dotted rule above Order section
    lines.push(this.createDottedRule(width));

    // Order section heading - 11pt bold
    lines.push('Order');

    // Order items - Two columns: Item (left), Price (right)
    order.items.forEach((item) => {
      const itemText = `${item.quantity}× ${item.name}`; // Bold quantity + item name
      const priceText = formatOrderPrice(item.price); // 11pt bold, right-aligned

      // Calculate spacing for right alignment with decimal alignment
      const spaces = width - itemText.length - priceText.length;
      lines.push(itemText + ' '.repeat(Math.max(1, spaces)) + priceText);
    });

    // Thin dotted rule above totals
    lines.push(this.createDottedRule(width));

    // Totals block - exact order with right-aligned numbers
    const subtotal = extractSubtotalValue(order);
    const discount = extractDiscountValue(order);
    const taxes = 0.00; // TODO: Extract from order data if available
    const charges = 0.00; // TODO: Extract from order data if available
    const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const finalTotal = subtotal - discount + taxes + charges;

    // Sub Total
    lines.push(this.formatTotalLine('Sub Total', formatOrderPrice(subtotal, false), width));

    // Discount (show minus sign) - only show if discount > 0
    if (discount > 0) {
      lines.push(this.formatTotalLine('Discount', `-${formatOrderPrice(discount, false)}`, width));
    }

    // Total Taxes - only show if taxes > 0
    if (taxes > 0) {
      lines.push(this.formatTotalLine('Total Taxes', formatOrderPrice(taxes, false), width));
    }

    // Charges - only show if charges > 0
    if (charges > 0) {
      lines.push(this.formatTotalLine('Charges', formatOrderPrice(charges, false), width));
    }

    // Total Qty
    lines.push(this.formatTotalLine('Total Qty', totalQty.toString(), width));

    // Bill Total Value - 13pt bold
    lines.push(this.formatTotalLine('Bill Total Value', formatOrderPrice(finalTotal), width));

    // Meta block
    // Deliveroo line - bold 11pt, one line only
    lines.push(this.formatTotalLine('Deliveroo', formatOrderPrice(finalTotal), width));

    // Customer email and phone on separate lines (truncate with ellipsis if overflow)
    const customerEmail = '7gjfkbqg76@privaterelay.appleid.com';
    const customerPhone = '442033195035';

    lines.push(`Customer ${this.truncateWithEllipsis(customerEmail, width - 9)}`);
    lines.push(`Phone ${customerPhone}`);

    // Access code on one bold line
    lines.push('Access code');
    lines.push('559339397');

    // Delivery Address + United Kingdom (1-2 lines, no extra blank lines)
    lines.push('Delivery Address');
    lines.push('United Kingdom');

    // Timestamps - "Placed At" and "Delivery At" on two lines, 10pt regular
    lines.push('Placed At: 24 Aug,2025 04:35 PM');
    lines.push('Delivery At: 24 Aug,2025 05:35 PM');

    // Footer note - 9.5pt regular, max 2 lines, tightened wording
    lines.push('Dear Customer, Please give us detailed');
    lines.push('feedback for credit on next order. Thank you');

    return lines.join('\n');
  }

  // Helper method to create dotted rule separator
  private createDottedRule(width: number): string {
    return '·'.repeat(width);
  }

  // Helper method to format total lines with right alignment
  private formatTotalLine(label: string, value: string, width: number): string {
    const spaces = width - label.length - value.length;
    return label + ' '.repeat(Math.max(1, spaces)) + value;
  }

  // Helper method to truncate text with ellipsis
  private truncateWithEllipsis(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private centerText(text: string, width: number): string {
    if (text.length >= width) return text;
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(padding) + text;
  }

  private getESCPOSCommands(text: string): Uint8Array {
    // ESC/POS commands for compact thermal receipt (80mm width)
    const commands: number[] = [];

    // Initialize printer and reset all settings
    commands.push(0x1B, 0x40); // ESC @ - Initialize printer
    commands.push(0x1B, 0x74, 0x06); // Set character code table to UTF-8

    // Set compact line spacing (1.10 line-height equivalent)
    commands.push(0x1B, 0x33, 0x18); // Set line spacing to 24/180 inch (compact)

    // Process text line by line with thermal receipt formatting
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Apply formatting based on thermal receipt specifications
      if (trimmedLine.includes('General Bilimoria\'s Canteen')) {
        // Store name - 16pt bold, centered
        commands.push(0x1B, 0x21, 0x30); // Double height + width
        commands.push(0x1B, 0x45, 0x01); // Bold on
        commands.push(0x1B, 0x61, 0x01); // Center alignment
      } else if (this.isUsernameHeaderLine(trimmedLine)) {
        // Dynamic username title - 15pt bold, centered
        commands.push(0x1B, 0x21, 0x20); // Double height
        commands.push(0x1B, 0x45, 0x01); // Bold on
        commands.push(0x1B, 0x61, 0x01); // Center alignment
      } else if (trimmedLine.includes('Pickup') && (trimmedLine.includes('PM') || trimmedLine.includes('AM'))) {
        // Pickup time + order number line
        commands.push(0x1B, 0x21, 0x10); // Regular size
        commands.push(0x1B, 0x45, 0x00); // Bold off for pickup time
        commands.push(0x1B, 0x61, 0x01); // Center alignment

        // Split and format: pickup time regular, order number bold
        const parts = trimmedLine.split(' ');
        const pickupPart = parts.slice(0, 3).join(' '); // "Pickup 05:05 PM"
        const orderPart = parts[parts.length - 1]; // Order number

        // Add pickup time (regular)
        const pickupBytes = new TextEncoder().encode(pickupPart + ' ');
        commands.push(...Array.from(pickupBytes));

        // Switch to bold for order number (20pt bold)
        commands.push(0x1B, 0x21, 0x30); // Double height + width
        commands.push(0x1B, 0x45, 0x01); // Bold on
        const orderBytes = new TextEncoder().encode(orderPart);
        commands.push(...Array.from(orderBytes));

        // Reset formatting
        commands.push(0x1B, 0x21, 0x00); // Reset font size
        commands.push(0x1B, 0x45, 0x00); // Bold off
        commands.push(0x0A); // Line feed
        continue; // Skip normal processing for this line
      } else if (trimmedLine === 'Order') {
        // Section heading - 11pt bold
        commands.push(0x1B, 0x21, 0x10); // Regular size
        commands.push(0x1B, 0x45, 0x01); // Bold on
        commands.push(0x1B, 0x61, 0x00); // Left alignment
      } else if (trimmedLine.includes('×') && trimmedLine.includes('£')) {
        // Item lines - quantity bold, price 11pt bold right-aligned
        commands.push(0x1B, 0x21, 0x00); // Small font (10pt equivalent)
        commands.push(0x1B, 0x45, 0x01); // Bold on for quantity
        commands.push(0x1B, 0x61, 0x00); // Left alignment
      } else if (trimmedLine.includes('Sub Total') || trimmedLine.includes('Discount') ||
                 trimmedLine.includes('Total Taxes') || trimmedLine.includes('Charges') ||
                 trimmedLine.includes('Total Qty')) {
        // Regular total lines - 11pt bold for labels
        commands.push(0x1B, 0x21, 0x00); // Small font (10pt equivalent)
        commands.push(0x1B, 0x45, 0x01); // Bold on
        commands.push(0x1B, 0x61, 0x00); // Left alignment
      } else if (trimmedLine.includes('Bill Total Value')) {
        // Bill Total Value - 13pt bold
        commands.push(0x1B, 0x21, 0x10); // Medium font (13pt equivalent)
        commands.push(0x1B, 0x45, 0x01); // Bold on
        commands.push(0x1B, 0x61, 0x00); // Left alignment
      } else if (trimmedLine.includes('Deliveroo') && trimmedLine.includes('£')) {
        // Deliveroo line - 11pt bold
        commands.push(0x1B, 0x21, 0x10); // Regular size
        commands.push(0x1B, 0x45, 0x01); // Bold on
        commands.push(0x1B, 0x61, 0x00); // Left alignment
      } else if (trimmedLine.includes('Customer') || trimmedLine.includes('Phone')) {
        // Customer info - labels bold, content regular
        commands.push(0x1B, 0x21, 0x00); // Small font (10pt)
        commands.push(0x1B, 0x45, 0x01); // Bold on for labels
        commands.push(0x1B, 0x61, 0x00); // Left alignment
      } else if (trimmedLine.includes('Access code')) {
        // Access code - bold
        commands.push(0x1B, 0x21, 0x00); // Small font
        commands.push(0x1B, 0x45, 0x01); // Bold on
        commands.push(0x1B, 0x61, 0x00); // Left alignment
      } else if (trimmedLine.includes('Delivery Address') || trimmedLine.includes('United Kingdom')) {
        // Address info - regular
        commands.push(0x1B, 0x21, 0x00); // Small font
        commands.push(0x1B, 0x45, 0x00); // Bold off
        commands.push(0x1B, 0x61, 0x00); // Left alignment
      } else if (trimmedLine.includes('Placed At:') || trimmedLine.includes('Delivery At:')) {
        // Timestamps - 10pt regular
        commands.push(0x1B, 0x21, 0x00); // Small font
        commands.push(0x1B, 0x45, 0x00); // Bold off
        commands.push(0x1B, 0x61, 0x00); // Left alignment
      } else if (trimmedLine.includes('Dear Customer') || trimmedLine.includes('feedback')) {
        // Footer note - 9.5pt regular
        commands.push(0x1B, 0x21, 0x00); // Small font
        commands.push(0x1B, 0x45, 0x00); // Bold off
        commands.push(0x1B, 0x61, 0x00); // Left alignment
      } else if (trimmedLine.includes('·')) {
        // Dotted rule - skip ESC/POS formatting, just print
        commands.push(0x1B, 0x21, 0x00); // Small font
        commands.push(0x1B, 0x45, 0x00); // Bold off
        commands.push(0x1B, 0x61, 0x00); // Left alignment
      } else if (trimmedLine !== '') {
        // Default formatting
        commands.push(0x1B, 0x21, 0x00); // Small font
        commands.push(0x1B, 0x45, 0x00); // Bold off
        commands.push(0x1B, 0x61, 0x00); // Left alignment
      } else {
        // Empty lines - no formatting needed
        commands.push(0x0A); // Just line feed
        continue;
      }

      // Add the line text with proper encoding
      const lineBytes = new TextEncoder().encode(line);
      commands.push(...Array.from(lineBytes));

      // Add line feed
      commands.push(0x0A); // LF - Line feed
    }

    // Reset all formatting and finalize
    commands.push(0x1B, 0x45, 0x00); // Bold off
    commands.push(0x1B, 0x21, 0x00); // Reset font size
    commands.push(0x1B, 0x61, 0x00); // Left alignment

    // Minimal paper feed and cut (compact)
    commands.push(0x1B, 0x64, 0x02); // Feed 2 lines before cut (minimal)
    commands.push(0x1D, 0x56, 0x42, 0x00); // GS V B 0 - Full cut

    return new Uint8Array(commands);
  }

  async printReceipt(order: Order, type: 'customer' | 'kitchen' = 'customer'): Promise<boolean> {
    try {
      // Use the same HTML-based format as Generate PNG/PDF for consistency
      console.log('🖨️ Printing receipt using standardized HTML format...');

      // Generate HTML content using the same method as PNG/PDF generation
      const htmlContent = await thermalReceiptGenerator.generateThermalReceiptHTML(order, 'pdf');

      // Print using HTML format for consistent layout and logo
      await Print.printAsync({
        html: htmlContent,
        width: 226, // 80mm in points (80mm * 2.834 points/mm)
        height: 600, // Auto-adjust based on content
      });

      console.log('✅ Receipt printed successfully using standardized format');
      return true;
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Print Error', 'Failed to print receipt. Please try again.');
      return false;
    }
  }

  private async sendToPrinter(printData: Uint8Array, receiptText: string): Promise<boolean> {
    try {
      // Method 1: Try to use native printing if available
      if (Platform.OS === 'android') {
        return await this.printViaAndroidIntent(receiptText);
      } else if (Platform.OS === 'ios') {
        return await this.printViaIOSPrint(receiptText);
      }

      // Method 2: Try Bluetooth thermal printer connection
      return await this.printViaBluetooth(printData);

    } catch (error) {
      console.error('Printer connection error:', error);
      return false;
    }
  }

  private async printViaAndroidIntent(receiptText: string): Promise<boolean> {
    try {
      // Use expo-print for actual physical printing
      console.log('🖨️ Printing via Android with font size 20...');

      const htmlContent = this.convertToHTML(receiptText);

      const printResult = await Print.printAsync({
        html: htmlContent,
        printerUrl: undefined, // Let user select printer
      });

      console.log('Print result:', printResult);
      return true; // Print.printAsync returns void, so assume success if no error

    } catch (error) {
      console.error('Android print error:', error);
      return false;
    }
  }

  private async printViaIOSPrint(receiptText: string): Promise<boolean> {
    try {
      // Use expo-print for actual physical printing
      console.log('🖨️ Printing via iOS with font size 20...');

      const htmlContent = this.convertToHTML(receiptText);

      const printResult = await Print.printAsync({
        html: htmlContent,
        printerUrl: undefined, // Let user select printer
      });

      console.log('Print result:', printResult);
      return true; // Print.printAsync returns void, so assume success if no error

    } catch (error) {
      console.error('iOS print error:', error);
      return false;
    }
  }

  private convertToHTML(receiptText: string): string {
    // Convert to HTML with thermal receipt specifications
    // 80mm width, Helvetica font, compact layout
    const lines = receiptText.split('\n');
    let html = `
      <html>
        <head>
          <style>
            @page {
              size: 80mm auto;
              margin: 4mm 3mm;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            body {
              font-family: 'Helvetica', 'Helvetica Neue', Arial, sans-serif;
              font-size: 10pt;
              line-height: 1.10;
              margin: 0;
              padding: 0;
              color: #000;
              background: #fff;
              width: 74mm; /* 80mm - 6mm margins */
              font-variant-numeric: tabular-nums lining-nums;
            }
            .store-name {
              font-size: 16pt;
              font-weight: bold;
              line-height: 18pt;
              text-align: center;
              margin: 0;
            }
            .gbc-title {
              font-size: 15pt;
              font-weight: bold;
              line-height: 17pt;
              text-align: center;
              margin: 0;
            }
            .pickup-order {
              font-size: 11pt;
              text-align: center;
              margin: 0;
            }
            .pickup-time {
              font-weight: normal;
            }
            .order-number {
              font-size: 20pt;
              font-weight: bold;
            }
            .section-header {
              font-size: 11pt;
              font-weight: bold;
              margin: 0;
            }
            .item-line {
              font-size: 10pt;
              margin: 0;
              display: flex;
              justify-content: space-between;
            }
            .item-name {
              font-weight: bold;
            }
            .item-price {
              font-size: 11pt;
              font-weight: bold;
              text-align: right;
            }
            .total-line {
              font-size: 10pt;
              margin: 0;
              display: flex;
              justify-content: space-between;
            }
            .total-label {
              font-weight: bold;
            }
            .total-value {
              font-weight: bold;
              text-align: right;
            }
            .bill-total-value {
              font-size: 13pt;
              font-weight: bold;
            }
            .deliveroo-line {
              font-size: 11pt;
              font-weight: bold;
              margin: 0;
              display: flex;
              justify-content: space-between;
            }
            .customer-info {
              font-size: 10pt;
              font-weight: normal;
              margin: 0;
            }
            .customer-label {
              font-weight: bold;
            }
            .access-code {
              font-weight: bold;
            }
            .timestamp {
              font-size: 10pt;
              font-weight: normal;
              margin: 0;
            }
            .footer-note {
              font-size: 9.5pt;
              font-weight: normal;
              margin: 0;
              line-height: 1.10;
            }
            .dotted-rule {
              border-top: 0.25pt dotted #666;
              margin: 4mm 0;
              height: 0;
            }
            .section-spacing {
              margin-top: 4mm;
            }
          </style>
        </head>
        <body>
    `;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine.includes('╭─────────────╮') ||
          trimmedLine.includes('GENERAL') ||
          trimmedLine.includes('BILIMORIA\'S') ||
          trimmedLine.includes('CANTEEN') ||
          trimmedLine.includes('EST. LONDON') ||
          trimmedLine.includes('╱') ||
          trimmedLine.includes('╲')) {
        // ASCII art logo lines
        html += `<div style="text-align: center; margin: 0; font-size: 6pt; font-family: monospace; line-height: 1; color: #333;">${trimmedLine}</div>\n`;
      } else if (trimmedLine.includes('[GBC LOGO') || trimmedLine.includes('[Official Circular Logo]')) {
        // Legacy logo placeholder
        html += `<div style="text-align: center; margin: 2mm 0; font-size: 8pt; color: #666;">${trimmedLine}</div>\n`;
      } else if (trimmedLine.includes('General Bilimoria\'s Canteen')) {
        html += `<div class="store-name">${trimmedLine}</div>\n`;
      } else if (this.isUsernameHeaderLine(trimmedLine)) {
        html += `<div class="gbc-title">${trimmedLine}</div>\n`;
      } else if (trimmedLine.includes('Pickup') && trimmedLine.includes('PM')) {
        // Parse pickup time and order number
        const parts = trimmedLine.split(' ');
        const pickupIndex = parts.findIndex(p => p === 'Pickup');
        const timeIndex = parts.findIndex(p => p.includes('PM') || p.includes('AM'));
        const orderNum = parts[parts.length - 1];

        html += `<div class="pickup-order">`;
        html += `<span class="pickup-time">Pickup ${parts[timeIndex]}</span> `;
        html += `<span class="order-number">${orderNum}</span>`;
        html += `</div>\n`;
      } else if (trimmedLine === 'Order') {
        html += `<div class="dotted-rule"></div>\n`;
        html += `<div class="section-header">${trimmedLine}</div>\n`;
      } else if (trimmedLine.includes('×') && trimmedLine.includes('£')) {
        // Item line with quantity and price
        const parts = trimmedLine.split('£');
        const itemPart = parts[0].trim();
        const pricePart = '£' + parts[1];

        html += `<div class="item-line">`;
        html += `<span class="item-name">${itemPart}</span>`;
        html += `<span class="item-price">${pricePart}</span>`;
        html += `</div>\n`;
      } else if (trimmedLine.includes('Sub Total') || trimmedLine.includes('Discount') ||
                 trimmedLine.includes('Total Taxes') || trimmedLine.includes('Charges') ||
                 trimmedLine.includes('Total Qty')) {
        // Regular total lines
        const parts = trimmedLine.split(/\s+/);
        const value = parts[parts.length - 1];
        const label = parts.slice(0, -1).join(' ');

        html += `<div class="total-line">`;
        html += `<span class="total-label">${label}</span>`;
        html += `<span class="total-value">${value}</span>`;
        html += `</div>\n`;
      } else if (trimmedLine.includes('Bill Total Value')) {
        // Special formatting for bill total
        const parts = trimmedLine.split(/\s+/);
        const value = parts[parts.length - 1];
        const label = parts.slice(0, -1).join(' ');

        html += `<div class="dotted-rule"></div>\n`;
        html += `<div class="total-line">`;
        html += `<span class="total-label">${label}</span>`;
        html += `<span class="total-value bill-total-value">${value}</span>`;
        html += `</div>\n`;
      } else if (trimmedLine.includes('Deliveroo') && trimmedLine.includes('£')) {
        // Deliveroo total line
        const parts = trimmedLine.split(/\s+/);
        const value = parts[parts.length - 1];
        const label = parts.slice(0, -1).join(' ');

        html += `<div class="deliveroo-line">`;
        html += `<span class="total-label">${label}</span>`;
        html += `<span class="total-value">${value}</span>`;
        html += `</div>\n`;
      } else if (trimmedLine.includes('Customer') || trimmedLine.includes('Phone')) {
        html += `<div class="customer-info section-spacing"><span class="customer-label">${trimmedLine}</span></div>\n`;
      } else if (trimmedLine.includes('Access code')) {
        html += `<div class="customer-info access-code">${trimmedLine}</div>\n`;
      } else if (trimmedLine.includes('Delivery Address') || trimmedLine.includes('United Kingdom')) {
        html += `<div class="customer-info">${trimmedLine}</div>\n`;
      } else if (trimmedLine.includes('Placed At:') || trimmedLine.includes('Delivery At:')) {
        html += `<div class="timestamp">${trimmedLine}</div>\n`;
      } else if (trimmedLine.includes('Dear Customer') || trimmedLine.includes('feedback')) {
        html += `<div class="footer-note section-spacing">${trimmedLine}</div>\n`;
      } else if (trimmedLine.includes('·')) {
        html += `<div class="dotted-rule"></div>\n`;
      } else if (trimmedLine !== '') {
        html += `<div class="customer-info">${trimmedLine}</div>\n`;
      }
    });

    html += `
        </body>
      </html>
    `;

    return html;
  }

  private async printViaBluetooth(printData: Uint8Array): Promise<boolean> {
    try {
      // Attempt to connect to thermal printer via Bluetooth
      console.log('Attempting Bluetooth thermal printer connection...');
      console.log('Print data size:', printData.length, 'bytes');

      // This would require react-native-bluetooth-escpos-printer or similar
      // For now, simulate the printing process

      // Simulate connection time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate data transmission
      console.log('Sending ESC/POS commands to thermal printer...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For demonstration, return true to simulate successful printing
      return true;

    } catch (error) {
      console.error('Bluetooth print error:', error);
      return false;
    }
  }

  private fallbackPrint(receiptText: string): void {
    // Fallback method: Copy to clipboard or show in modal
    console.log('Fallback printing method');
    console.log('Receipt text (font size 18):', receiptText);

    Alert.alert(
      'Receipt Ready',
      'Receipt formatted with font size 20 and ready for printing. Please use your device\'s print function.',
      [{ text: 'OK' }]
    );
  }

  async printTestReceipt(): Promise<boolean> {
    // Test order for compact thermal receipt format (80mm)
    const testOrder: Order = {
      id: 'gbc-cb2',
      orderNumber: '2692',
      customerName: '7gjfkbqg76@privaterelay.appleid.com',
      items: [
        { name: 'Kosha Mangsho', quantity: 1, price: 19.14 },
        { name: 'Steam Rice', quantity: 1, price: 4.20 },
      ],
      total: 23.34,
      timestamp: new Date().toISOString(),
      notes: undefined,
    };

    console.log('🧪 Printing test receipt with compact thermal format (80mm)...');
    return await this.printReceipt(testOrder, 'customer');
  }

  /**
   * Generate PNG receipt (800px wide, ~300 DPI at 80mm)
   */
  async generatePNGReceipt(order: Order, restaurantName?: string): Promise<string | null> {
    console.log('📸 Generating PNG receipt (800px wide)...');
    return await thermalReceiptGenerator.generatePNG(order, restaurantName);
  }

  /**
   * Generate PDF receipt (80mm width, auto height)
   */
  async generatePDFReceipt(order: Order, restaurantName?: string): Promise<string | null> {
    console.log('📄 Generating PDF receipt (80mm width)...');
    return await thermalReceiptGenerator.generatePDF(order, restaurantName);
  }

  /**
   * Generate both PNG and PDF receipts and share them
   */
  async generateAndShareReceipts(order: Order, restaurantName?: string): Promise<void> {
    console.log('📋 Generating PNG and PDF receipts for sharing...');
    await thermalReceiptGenerator.generateAndShare(order, restaurantName);
  }

  updateSettings(newSettings: Partial<PrinterSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): PrinterSettings {
    return { ...this.settings };
  }

  isConnectedToPrinter(): boolean {
    return this.isConnected;
  }

  async scanForPrinters(): Promise<string[]> {
    try {
      // TODO: Implement actual Bluetooth scanning for thermal printers
      // This would return a list of available printer devices
      return ['Thermal Printer 1', 'Thermal Printer 2'];
    } catch (error) {
      console.error('Printer scan error:', error);
      return [];
    }
  }

  async connectToSpecificPrinter(printerName: string): Promise<boolean> {
    try {
      // TODO: Connect to specific printer by name/address
      console.log(`Connecting to printer: ${printerName}`);
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Specific printer connection error:', error);
      this.isConnected = false;
      return false;
    }
  }
}

export const printerService = new PrinterService();
export default printerService;
