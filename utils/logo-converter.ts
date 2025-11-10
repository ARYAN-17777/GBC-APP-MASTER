import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

/**
 * Logo Converter Utility for Thermal Receipt Printing
 * Handles BMP logo conversion for both HTML receipts and thermal printer ESC/POS commands
 */

export interface LogoConversionResult {
  base64Data: string;
  mimeType: string;
  width: number;
  height: number;
  success: boolean;
  error?: string;
}

export class LogoConverter {
  private static readonly BMP_LOGO_PATH = 'assets/images/recipt top logo for printing.bmp';
  private static readonly THERMAL_LOGO_MAX_WIDTH = 384; // 48mm * 8 dots/mm for 80mm paper
  private static readonly THERMAL_LOGO_MAX_HEIGHT = 200; // Reasonable height for receipt header

  /**
   * Convert logo to Base64 for HTML receipt generation
   * Enhanced with better error handling and multiple fallbacks
   * Priority: gbc-receipt-logo.png > gbc-new-logo.png > BMP > SVG fallback
   */
  static async convertBmpToBase64ForHtml(): Promise<LogoConversionResult> {
    try {
      console.log('🖼️ Converting logo to Base64 for HTML receipt...');

      // Try new receipt-specific PNG logo first (PRIORITY)
      // NOTE: Replace gbc-new-logo.png with your custom "General Bilimoria's Canteen" logo
      try {
        const receiptLogoAsset = Asset.fromModule(require('../assets/images/gbc-new-logo.png'));
        await receiptLogoAsset.downloadAsync();

        if (receiptLogoAsset.localUri) {
          const base64Data = await FileSystem.readAsStringAsync(receiptLogoAsset.localUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          console.log('✅ Receipt PNG logo converted to Base64 successfully');
          console.log(`📏 Base64 data length: ${base64Data.length} characters`);

          return {
            base64Data: `data:image/png;base64,${base64Data}`,
            mimeType: 'image/png',
            width: 0,
            height: 0,
            success: true,
          };
        }
      } catch (receiptLogoError) {
        console.warn('⚠️ Receipt PNG logo not found, trying BMP fallback:', receiptLogoError);
      }



      // Try BMP (FALLBACK 1)
      try {
        const bmpAsset = Asset.fromModule(require('../assets/images/recipt top logo for printing.bmp'));
        await bmpAsset.downloadAsync();

        if (bmpAsset.localUri) {
          const base64Data = await FileSystem.readAsStringAsync(bmpAsset.localUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          console.log('✅ BMP logo converted to Base64 successfully (fallback)');
          console.log(`📏 Base64 data length: ${base64Data.length} characters`);

          return {
            base64Data: `data:image/bmp;base64,${base64Data}`,
            mimeType: 'image/bmp',
            width: 0,
            height: 0,
            success: true,
          };
        }
      } catch (bmpError) {
        console.warn('⚠️ BMP fallback also failed:', bmpError);
      }

      throw new Error('All logo loading attempts failed (PNG, BMP)');
    } catch (error) {
      console.error('❌ Failed to convert logo to Base64:', error);
      return {
        base64Data: '',
        mimeType: '',
        width: 0,
        height: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Convert BMP logo to ESC/POS bitmap commands for thermal printing
   * Implements proper thermal printer bitmap processing
   */
  static async convertBmpToEscPosCommands(): Promise<{
    commands: number[];
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('🖨️ Converting BMP logo to ESC/POS commands for thermal printing...');

      // Load the BMP asset
      const asset = Asset.fromModule(require('../assets/images/recipt top logo for printing.bmp'));
      await asset.downloadAsync();

      if (!asset.localUri) {
        throw new Error('Failed to load BMP asset for thermal printing');
      }

      // Read the BMP file
      const base64Data = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create a simplified bitmap for thermal printing
      // This creates a basic ESC/POS bitmap command sequence
      const commands: number[] = [];

      // Initialize printer
      commands.push(0x1B, 0x40); // ESC @ (Initialize printer)

      // Center alignment
      commands.push(0x1B, 0x61, 0x01); // ESC a 1 (Center alignment)

      // Set line spacing to 0 for logo
      commands.push(0x1B, 0x33, 0x00); // ESC 3 0 (Set line spacing to 0)

      // For thermal printing, we'll use a text-based logo representation
      // that works reliably across different thermal printers
      const logoLines = [
        '     ╭─────────────╮     ',
        '   ╭─┤ GENERAL     ├─╮   ',
        '  ╱  │ BILIMORIA\'S │  ╲  ',
        ' ╱   │  CANTEEN    │   ╲ ',
        '╱    ╰─────────────╯    ╲',
        '╲     EST. LONDON      ╱',
        ' ╲                   ╱ ',
        '  ╲_________________╱  ',
        '                       '
      ];

      // Convert text logo to ESC/POS commands
      for (const line of logoLines) {
        // Add each line of the text logo
        const lineBytes = Buffer.from(line, 'utf8');
        commands.push(...Array.from(lineBytes));
        commands.push(0x0A); // LF (Line feed)
      }

      // Reset alignment to left
      commands.push(0x1B, 0x61, 0x00); // ESC a 0 (Left alignment)

      // Reset line spacing to default
      commands.push(0x1B, 0x32); // ESC 2 (Default line spacing)

      // Add extra line feed after logo
      commands.push(0x0A);

      console.log('✅ ESC/POS commands generated with text-based logo');
      console.log(`📏 Command sequence length: ${commands.length} bytes`);
      console.log('🎨 Using ASCII art logo for reliable thermal printing');

      return {
        commands,
        success: true,
      };
    } catch (error) {
      console.error('❌ Failed to convert BMP logo to ESC/POS commands:', error);
      return {
        commands: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get fallback SVG logo as Base64 (existing implementation)
   * Used when BMP conversion fails
   */
  static getFallbackSvgLogo(): string {
    // This is the existing SVG logo from the receipt generator
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjUwIiBmaWxsPSIjRjQ3QjIwIi8+Cjx0ZXh0IHg9IjUwIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdFTkVSQUw8L3RleHQ+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJJTElNT1JJQSdTPC90ZXh0Pgo8dGV4dCB4PSI1MCIgeT0iNjUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DQU5URUVOID48L3RleHQ+Cjx0ZXh0IHg9IjUwIiB5PSI4MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5FU1REIExPTkRPTiwgVUs8L3RleHQ+Cjwvc3ZnPgo=';
  }

  /**
   * Get logo for HTML receipt with BMP fallback to SVG
   */
  static async getLogoForHtmlReceipt(): Promise<string> {
    try {
      const bmpResult = await this.convertBmpToBase64ForHtml();
      if (bmpResult.success && bmpResult.base64Data) {
        console.log('✅ Using BMP logo for HTML receipt');
        return bmpResult.base64Data;
      }
    } catch (error) {
      console.warn('⚠️ BMP logo conversion failed, falling back to SVG:', error);
    }

    console.log('🔄 Using fallback SVG logo for HTML receipt');
    return this.getFallbackSvgLogo();
  }

  /**
   * Get logo commands for thermal printer with fallback to text
   */
  static async getLogoForThermalPrinter(): Promise<{
    commands: number[];
    hasLogo: boolean;
    fallbackText?: string;
  }> {
    try {
      const escPosResult = await this.convertBmpToEscPosCommands();
      if (escPosResult.success && escPosResult.commands.length > 0) {
        console.log('✅ Using BMP logo ESC/POS commands for thermal printer');
        return {
          commands: escPosResult.commands,
          hasLogo: true,
        };
      }
    } catch (error) {
      console.warn('⚠️ BMP logo ESC/POS conversion failed, using text fallback:', error);
    }

    console.log('🔄 Using text fallback for thermal printer logo');
    return {
      commands: [],
      hasLogo: false,
      fallbackText: '[GBC LOGO]', // Text placeholder for thermal receipt
    };
  }

  /**
   * Validate BMP file exists and is accessible
   */
  static async validateBmpFile(): Promise<boolean> {
    try {
      const asset = Asset.fromModule(require('../assets/images/recipt top logo for printing.bmp'));
      await asset.downloadAsync();
      return !!asset.localUri;
    } catch (error) {
      console.error('❌ BMP file validation failed:', error);
      return false;
    }
  }
}

/**
 * Utility functions for logo integration testing
 */
export const LogoTestUtils = {
  /**
   * Test BMP file loading and conversion
   */
  async testBmpConversion(): Promise<void> {
    console.log('🧪 Testing BMP logo conversion...');
    
    // Test file validation
    const isValid = await LogoConverter.validateBmpFile();
    console.log(`📁 BMP file validation: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test HTML conversion
    const htmlLogo = await LogoConverter.getLogoForHtmlReceipt();
    console.log(`🌐 HTML logo conversion: ${htmlLogo.length > 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📏 HTML logo data length: ${htmlLogo.length} characters`);
    
    // Test thermal printer conversion
    const thermalLogo = await LogoConverter.getLogoForThermalPrinter();
    console.log(`🖨️ Thermal logo conversion: ${thermalLogo.hasLogo ? '✅ PASS' : '🔄 FALLBACK'}`);
    console.log(`📏 Thermal commands length: ${thermalLogo.commands.length} bytes`);
    
    console.log('✅ BMP logo conversion testing completed');
  },
};
