// Updated Order interfaces to match new payload format

export interface OrderCustomization {
  name: string;
  qty?: number;
  price?: string;
}

export interface OrderItem {
  title: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  unitPriceMinor: number;
  price: number;
  originalUnitPrice: string;
  discountedUnitPrice: string;
  discountPerUnit: string;
  discountPerLine: string;
  customizations: OrderCustomization[];
  notes: string;
}

export interface OrderTotals {
  subtotal: string;
  discount: string;
  delivery: string;
  vat: string;
  total: string;
}

export interface OrderAddress {
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
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email: string;
  address: OrderAddress;
}

export interface OrderUser {
  name: string;
  phone: string;
}

export interface OrderRestaurant {
  name: string;
}

export interface NewOrderPayload {
  website_restaurant_id: string;
  app_restaurant_uid: string;
  userId: string;
  callback_url: string;
  idempotency_key: string;
  orderNumber: string;
  amount: number;
  amountDisplay: string;
  totals: OrderTotals;
  status: string;
  channel: 'pickup' | 'delivery';
  deliveryMethod: string;
  items: OrderItem[];
  customer: OrderCustomer;
  user: OrderUser;
  restaurant: OrderRestaurant;
  orderNotes: string;
}

// Legacy interface for backward compatibility
export interface LegacyOrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface LegacyOrder {
  id: string;
  orderNumber: string;
  time: string;
  items: LegacyOrderItem[];
  total: number;
  status: 'approved' | 'completed' | 'cancelled' | 'pending';
  customerName?: string;
  timestamp?: string;
  notes?: string;
}

// Transformation utilities
export class OrderTransformer {
  static newToLegacy(newOrder: NewOrderPayload): LegacyOrder {
    return {
      id: newOrder.userId,
      orderNumber: newOrder.orderNumber,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      items: newOrder.items.map(item => ({
        name: item.title,
        quantity: item.quantity,
        price: item.price
      })),
      total: newOrder.amount,
      status: newOrder.status as any,
      customerName: newOrder.user.name,
      timestamp: new Date().toISOString(),
      notes: ''
    };
  }

  static formatItemsForDisplay(items: OrderItem[]): string {
    return items.map(item => {
      let itemText = `${item.quantity}x ${item.title}`;
      if (item.customizations && item.customizations.length > 0) {
        const customizationText = item.customizations
          .map(c => c.price ? `${c.name} (+£${c.price})` : c.name)
          .join(', ');
        itemText += ` (${customizationText})`;
      }
      return itemText;
    }).join(', ');
  }

  static formatPriceFromMinor(priceMinor: number): string {
    return (priceMinor / 100).toFixed(2);
  }

  static formatPrice(price: string | number): string {
    if (typeof price === 'string') {
      return parseFloat(price).toFixed(2);
    }
    return price.toFixed(2);
  }
}
