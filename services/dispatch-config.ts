/**
 * Dispatch Configuration Service
 * 
 * Manages dispatch endpoint configurations for different environments
 * and provides utilities for testing and validating endpoints.
 */

export interface DispatchEndpointConfig {
  name: string;
  url: string;
  environment: 'development' | 'staging' | 'production';
  timeout: number;
  retryAttempts: number;
  description?: string;
  isActive: boolean;
}

export interface DispatchSettings {
  defaultEndpoint: string;
  endpoints: DispatchEndpointConfig[];
  globalTimeout: number;
  globalRetryAttempts: number;
  enableLogging: boolean;
}

class DispatchConfigService {
  private settings: DispatchSettings = {
    defaultEndpoint: 'production',
    globalTimeout: 10000,
    globalRetryAttempts: 3,
    enableLogging: true,
    endpoints: [
      {
        name: 'production',
        url: 'https://hotel-website.com/api/order-dispatch',
        environment: 'production',
        timeout: 10000,
        retryAttempts: 3,
        description: 'Production website endpoint',
        isActive: true
      },
      {
        name: 'staging',
        url: 'https://staging-hotel-website.com/api/order-dispatch',
        environment: 'staging',
        timeout: 12000,
        retryAttempts: 3,
        description: 'Staging environment for testing',
        isActive: true
      },
      {
        name: 'development',
        url: 'https://dev-hotel-website.com/api/order-dispatch',
        environment: 'development',
        timeout: 15000,
        retryAttempts: 2,
        description: 'Development environment',
        isActive: true
      },
      {
        name: 'local',
        url: 'http://localhost:8080/api/order-dispatch',
        environment: 'development',
        timeout: 5000,
        retryAttempts: 1,
        description: 'Local development server',
        isActive: false
      }
    ]
  };

  /**
   * Get all available dispatch endpoints
   */
  getEndpoints(): DispatchEndpointConfig[] {
    return this.settings.endpoints;
  }

  /**
   * Get active dispatch endpoints only
   */
  getActiveEndpoints(): DispatchEndpointConfig[] {
    return this.settings.endpoints.filter(endpoint => endpoint.isActive);
  }

  /**
   * Get endpoint configuration by name
   */
  getEndpoint(name: string): DispatchEndpointConfig | null {
    return this.settings.endpoints.find(endpoint => endpoint.name === name) || null;
  }

  /**
   * Get default endpoint configuration
   */
  getDefaultEndpoint(): DispatchEndpointConfig | null {
    return this.getEndpoint(this.settings.defaultEndpoint);
  }

  /**
   * Get endpoint configuration by environment
   */
  getEndpointsByEnvironment(environment: 'development' | 'staging' | 'production'): DispatchEndpointConfig[] {
    return this.settings.endpoints.filter(endpoint => 
      endpoint.environment === environment && endpoint.isActive
    );
  }

  /**
   * Add a new dispatch endpoint
   */
  addEndpoint(config: Omit<DispatchEndpointConfig, 'name'> & { name?: string }): boolean {
    try {
      const name = config.name || `endpoint_${Date.now()}`;
      
      // Check if endpoint with same name already exists
      if (this.getEndpoint(name)) {
        console.warn(`Endpoint with name '${name}' already exists`);
        return false;
      }

      const newEndpoint: DispatchEndpointConfig = {
        name,
        url: config.url,
        environment: config.environment,
        timeout: config.timeout || this.settings.globalTimeout,
        retryAttempts: config.retryAttempts || this.settings.globalRetryAttempts,
        description: config.description,
        isActive: config.isActive !== undefined ? config.isActive : true
      };

      this.settings.endpoints.push(newEndpoint);
      console.log(`Added new dispatch endpoint: ${name}`);
      return true;

    } catch (error) {
      console.error('Failed to add endpoint:', error);
      return false;
    }
  }

  /**
   * Update an existing dispatch endpoint
   */
  updateEndpoint(name: string, updates: Partial<DispatchEndpointConfig>): boolean {
    try {
      const endpointIndex = this.settings.endpoints.findIndex(endpoint => endpoint.name === name);
      
      if (endpointIndex === -1) {
        console.warn(`Endpoint '${name}' not found`);
        return false;
      }

      this.settings.endpoints[endpointIndex] = {
        ...this.settings.endpoints[endpointIndex],
        ...updates,
        name // Prevent name changes
      };

      console.log(`Updated dispatch endpoint: ${name}`);
      return true;

    } catch (error) {
      console.error('Failed to update endpoint:', error);
      return false;
    }
  }

  /**
   * Remove a dispatch endpoint
   */
  removeEndpoint(name: string): boolean {
    try {
      const initialLength = this.settings.endpoints.length;
      this.settings.endpoints = this.settings.endpoints.filter(endpoint => endpoint.name !== name);
      
      if (this.settings.endpoints.length < initialLength) {
        console.log(`Removed dispatch endpoint: ${name}`);
        return true;
      } else {
        console.warn(`Endpoint '${name}' not found`);
        return false;
      }

    } catch (error) {
      console.error('Failed to remove endpoint:', error);
      return false;
    }
  }

  /**
   * Set the default endpoint
   */
  setDefaultEndpoint(name: string): boolean {
    const endpoint = this.getEndpoint(name);
    if (!endpoint) {
      console.warn(`Cannot set default: endpoint '${name}' not found`);
      return false;
    }

    if (!endpoint.isActive) {
      console.warn(`Cannot set default: endpoint '${name}' is not active`);
      return false;
    }

    this.settings.defaultEndpoint = name;
    console.log(`Set default dispatch endpoint to: ${name}`);
    return true;
  }

  /**
   * Test endpoint connectivity
   */
  async testEndpoint(name: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
    const endpoint = this.getEndpoint(name);
    if (!endpoint) {
      return { success: false, message: 'Endpoint not found' };
    }

    const startTime = Date.now();
    
    try {
      console.log(`Testing endpoint: ${name} (${endpoint.url})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);

      const response = await fetch(endpoint.url, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://gbc-kitchen-app.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: 'Endpoint is accessible',
          responseTime
        };
      } else {
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          message: `Timeout after ${endpoint.timeout}ms`,
          responseTime
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        responseTime
      };
    }
  }

  /**
   * Test all active endpoints
   */
  async testAllEndpoints(): Promise<{ [endpointName: string]: { success: boolean; message: string; responseTime?: number } }> {
    const results: { [endpointName: string]: { success: boolean; message: string; responseTime?: number } } = {};
    const activeEndpoints = this.getActiveEndpoints();

    console.log(`Testing ${activeEndpoints.length} active endpoints...`);

    const testPromises = activeEndpoints.map(async (endpoint) => {
      const result = await this.testEndpoint(endpoint.name);
      results[endpoint.name] = result;
    });

    await Promise.all(testPromises);
    return results;
  }

  /**
   * Get current settings
   */
  getSettings(): DispatchSettings {
    return { ...this.settings };
  }

  /**
   * Update global settings
   */
  updateSettings(updates: Partial<DispatchSettings>): void {
    this.settings = {
      ...this.settings,
      ...updates
    };
    console.log('Updated dispatch settings');
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    this.settings = {
      defaultEndpoint: 'production',
      globalTimeout: 10000,
      globalRetryAttempts: 3,
      enableLogging: true,
      endpoints: [
        {
          name: 'production',
          url: 'https://hotel-website.com/api/order-dispatch',
          environment: 'production',
          timeout: 10000,
          retryAttempts: 3,
          description: 'Production website endpoint',
          isActive: true
        }
      ]
    };
    console.log('Reset dispatch configuration to defaults');
  }

  /**
   * Export configuration as JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  importConfig(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);
      
      // Validate the configuration structure
      if (!config.endpoints || !Array.isArray(config.endpoints)) {
        throw new Error('Invalid configuration: missing or invalid endpoints array');
      }

      this.settings = config;
      console.log('Imported dispatch configuration successfully');
      return true;

    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }
}

export const dispatchConfigService = new DispatchConfigService();
export default dispatchConfigService;
