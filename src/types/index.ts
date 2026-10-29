export type Language = 'fr' | 'ha' | 'dz' | 'en';

export type PaymentMethod = 'CASH' | 'MY_NITA' | 'AMANATA';

export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'FAILED';

export type OrderStatus = 
  | 'CREATED'       // Commande enregistrée
  | 'ASSIGNED'      // Livreur assigné
  | 'PICKED_UP'     // Colis récupéré
  | 'IN_TRANSIT'    // En route / en vol
  | 'ARRIVED'       // Livreur sur place
  | 'DELIVERED'     // Livré avec succès
  | 'CANCELLED';    // Annulée

export interface GeoPoint {
  lat: number;
  lng: number;
  name: string;
  zone: string;
}

export interface NiameyDistrict {
  id: string;
  name: string;
  zone: 'RIVE_GAUCHE_CENTRE' | 'RIVE_GAUCHE_EST' | 'RIVE_GAUCHE_NORD' | 'RIVE_DROITE';
  lat: number;
  lng: number;
  popularPlaces: string[];
}

export interface OrderItem {
  id: string;
  orderNumber: string; // e.g. FCX-2026-8941
  customer: {
    name: string;
    phone: string;
    verified: boolean;
    verificationCode?: string;
  };
  pickup: {
    districtId: string;
    districtName: string;
    addressDetail: string;
    contactPhone: string;
    lat: number;
    lng: number;
  };
  dropoff: {
    districtId: string;
    districtName: string;
    addressDetail: string;
    recipientName: string;
    recipientPhone: string;
    lat: number;
    lng: number;
  };
  parcel: {
    type: 'DOCUMENTS' | 'COLIS_STANDARD' | 'ALIMENTAIRE' | 'HIGH_TECH' | 'PHARMACIE';
    weightKg: number;
    description: string;
    stockItemId?: string; // If linked to stock management
    fragile: boolean;
  };
  pricing: {
    baseFareFcfa: number;
    distanceFeeFcfa: number;
    priorityExpressFeeFcfa: number;
    totalFcfa: number;
    driverCommissionFcfa: number;
  };
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    reference?: string;
    payerPhone?: string;
    paidAt?: string;
  };
  delivery: {
    status: OrderStatus;
    driverId?: string;
    driverName?: string;
    driverPhone?: string;
    driverVehicle?: string;
    currentCoords?: { lat: number; lng: number };
    progressPercent: number;
    estimatedMinutes: number;
    startedAt?: string;
    deliveredAt?: string;
    deliveryOtp?: string; // 4-digit verification code
  };
  createdAt: string;
  securityHash: string; // E2E encryption token
  smsLog: Array<{
    id: string;
    recipient: string;
    message: string;
    sentAt: string;
    status: 'DELIVERED' | 'SENT';
  }>;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: 'Moto Boxer 150' | 'Scooter Express 125' | 'Tricycle Cargo' | 'Vélo Cargo';
  licensePlate: string;
  photoUrl: string;
  rating: number;
  completedDeliveries: number;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  currentDistrict: string;
  lat: number;
  lng: number;
  batteryLevel?: number;
  earningsTodayFcfa: number;
  isBackgroundChecked: boolean;
}

export interface StockItem {
  id: string;
  name: string;
  sku: string;
  category: 'EMBALLAGE' | 'ECOMMERCE_STOCK' | 'SECURITE' | 'CONSOMMABLE';
  quantity: number;
  minAlertThreshold: number;
  unitValueFcfa: number;
  location: string;
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  itemName: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  relatedOrderNumber?: string;
  reason: string;
  timestamp: string;
}

export interface FinancialTransaction {
  id: string;
  orderNumber: string;
  type: 'PAYMENT_RECEIVED' | 'DRIVER_PAYOUT' | 'COMMISSION';
  method: PaymentMethod;
  amountFcfa: number;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  reference: string;
  senderPhone: string;
  timestamp: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  orderNumber: string;
  sender: 'CLIENT' | 'DRIVER' | 'OWNER_ADMIN';
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  orderNumber?: string;
  type: 'ORDER_UPDATE' | 'PAYMENT' | 'SECURITY' | 'SYSTEM';
  timestamp: string;
  read: boolean;
}

export interface AdminSettings {
  ownerName: string;
  ownerPhone: string; // +22799614098
  dispatchPhone: string;
  baseDeliveryFeeFcfa: number;
  crossRiverSurchargeFcfa: number; // Traversée du Pont Kennedy / Pont Chinois
  expressPrioritySurchargeFcfa: number;
  driverCommissionRate: number; // e.g. 70% to driver, 30% to Faucon Express
  autoAssignCourier: boolean;
  smsGatewayEnabled: boolean;
  strictAntiFraud: boolean;
  offlineSyncIntervalSec: number;
}
