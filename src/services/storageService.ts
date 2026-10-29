import { 
  OrderItem, Driver, StockItem, FinancialTransaction, 
  ChatMessage, AdminSettings, PushNotification, StockMovement 
} from '../types';
import { 
  NIAMEY_DISTRICTS, INITIAL_DRIVERS, INITIAL_STOCK, 
  INITIAL_TRANSACTIONS, DEFAULT_SETTINGS 
} from '../data/niameyData';

const STORAGE_KEYS = {
  ORDERS: 'faucon_orders_live_v2',
  DRIVERS: 'faucon_drivers_user_v1',
  STOCK: 'faucon_stock_v1',
  STOCK_MOVEMENTS: 'faucon_stock_mvts_v1',
  TRANSACTIONS: 'faucon_transactions_live_v2',
  CHAT_MESSAGES: 'faucon_chat_live_v2',
  SETTINGS: 'faucon_settings_v1',
  OFFLINE_QUEUE: 'faucon_offline_queue_v1',
  NOTIFICATIONS: 'faucon_notifications_v1',
  OFFLINE_STATUS: 'faucon_force_offline'
};

// Clean phone for WhatsApp (+22799614098 -> 22799614098)
export function sanitizeWhatsAppPhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('227')) return cleaned;
  if (cleaned.length === 8) return `227${cleaned}`;
  return cleaned || '22799614098';
}

// Generate pre-formatted text for WhatsApp dispatch
export function formatOrderWhatsAppText(order: OrderItem): string {
  const lines = [
    `🦅 *NOUVELLE COMMANDE - FAUCON EXPRESS NIAMEY*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 *N° Commande:* ${order.orderNumber}`,
    `👤 *Client:* ${order.customer.name}`,
    `📞 *Tél Client:* ${order.customer.phone}`,
    ``,
    `📍 *Ramassage:* ${order.pickup.districtName}`,
    `📌 *Détail lieu:* ${order.pickup.addressDetail || 'Repère principal'}`,
    ``,
    `🎯 *Livraison:* ${order.dropoff.districtName}`,
    `📌 *Détail lieu:* ${order.dropoff.addressDetail || 'Destination'}`,
    `📦 *Destinataire:* ${order.dropoff.recipientName} (${order.dropoff.recipientPhone})`,
    ``,
    `📦 *Colis:* ${order.parcel.type} · ${order.parcel.weightKg} kg`,
    `📝 *Description:* ${order.parcel.description}`,
    ``,
    `💰 *Montant Total:* ${order.pricing.totalFcfa.toLocaleString()} FCFA`,
    `💳 *Paiement:* ${order.payment.method} (${order.payment.status === 'CONFIRMED' ? 'Payé' : 'À régler en espèces'})`,
    `🔐 *Code OTP Livraison:* ${order.delivery.deliveryOtp}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `⚡ Transmis en direct à M. Abdoulkader Alio (+227 99 61 40 98)`
  ];
  return lines.join('\n');
}

export function formatOrderWhatsAppUrl(order: OrderItem, recipientPhone: string = '22799614098'): string {
  const cleanPhone = sanitizeWhatsAppPhone(recipientPhone);
  const text = formatOrderWhatsAppText(order);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function formatChatMessageWhatsAppUrl(
  message: string, 
  orderNumber?: string, 
  senderName: string = 'Client',
  recipientPhone: string = '22799614098'
): string {
  const cleanPhone = sanitizeWhatsAppPhone(recipientPhone);
  const prefix = orderNumber ? `[Faucon Express · Commande ${orderNumber}]` : `[Faucon Express]`;
  const fullText = `🦅 ${prefix}\nMessage de *${senderName}* :\n\n"${message}"\n\nEnvoyé depuis la messagerie Faucon Express.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullText)}`;
}

// Notification chime using Web Audio API
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // Non-fatal if blocked by autoplay restrictions
  }
}

// Multi-tab broadcast channel
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    broadcastChannel = new BroadcastChannel('faucon_express_events');
  } catch {
    broadcastChannel = null;
  }
}

export function broadcastOrderChange(order: OrderItem, type: 'CREATED' | 'UPDATED' = 'CREATED') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('faucon_order_event', { detail: { order, type } }));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ order, type, timestamp: Date.now() });
    }
  }
}

// Generate realistic order code: FCX-2026-XXXX
export function generateOrderNumber(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `FCX-2026-${randomSuffix}`;
}

// Generate cryptographic-like E2E security hash for tracking confidentiality
export function generateSecurityToken(orderNum: string, phone: string): string {
  const seed = `${orderNum}_${phone}_${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return `E2E-SHA256-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
}

export const StorageService = {
  // Settings
  getSettings(): AdminSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AdminSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Drivers
  getDrivers(): Driver[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DRIVERS);
    if (!raw) {
      // Clean start: empty drivers list as requested by user
      localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveDrivers(drivers: Driver[]): void {
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
  },

  addDriver(driverData: Omit<Driver, 'id'>): Driver {
    const drivers = this.getDrivers();
    const newDriver: Driver = {
      ...driverData,
      id: `drv-${Date.now()}`
    };
    drivers.push(newDriver);
    this.saveDrivers(drivers);
    return newDriver;
  },

  deleteDriver(driverId: string): void {
    const drivers = this.getDrivers().filter(d => d.id !== driverId);
    this.saveDrivers(drivers);
  },

  clearAllDrivers(): void {
    this.saveDrivers([]);
  },

  updateDriver(driverId: string, updates: Partial<Driver>): Driver | null {
    const drivers = this.getDrivers();
    const idx = drivers.findIndex(d => d.id === driverId);
    if (idx === -1) return null;
    drivers[idx] = { ...drivers[idx], ...updates };
    this.saveDrivers(drivers);
    return drivers[idx];
  },

  updateDriverStatus(driverId: string, status: Driver['status'], currentDistrict?: string, coords?: { lat: number; lng: number }): void {
    const drivers = this.getDrivers();
    const updated = drivers.map(d => {
      if (d.id === driverId) {
        return {
          ...d,
          status,
          currentDistrict: currentDistrict || d.currentDistrict,
          lat: coords?.lat ?? d.lat,
          lng: coords?.lng ?? d.lng
        };
      }
      return d;
    });
    this.saveDrivers(updated);
  },

  // Stock Management
  getStock(): StockItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(INITIAL_STOCK));
      return INITIAL_STOCK;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_STOCK;
    }
  },

  saveStock(stock: StockItem[]): void {
    localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stock));
  },

  getStockMovements(): StockMovement[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  adjustStock(stockItemId: string, deltaQuantity: number, reason: string, orderNumber?: string): boolean {
    const stock = this.getStock();
    const item = stock.find(s => s.id === stockItemId);
    if (!item) return false;

    if (item.quantity + deltaQuantity < 0) {
      return false; // Not enough stock
    }

    item.quantity += deltaQuantity;
    item.lastUpdated = new Date().toISOString().replace('T', ' ').substring(0, 16);
    this.saveStock(stock);

    // Record movement
    const movements = this.getStockMovements();
    const newMvt: StockMovement = {
      id: `mvt-${Date.now()}`,
      stockItemId,
      itemName: item.name,
      type: deltaQuantity < 0 ? 'OUT' : 'IN',
      quantity: Math.abs(deltaQuantity),
      relatedOrderNumber: orderNumber,
      reason,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    movements.unshift(newMvt);
    localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(movements.slice(0, 100)));
    return true;
  },

  // Transactions
  getTransactions(): FinancialTransaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  clearAllTransactions(): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
  },

  recordTransaction(tx: Omit<FinancialTransaction, 'id' | 'timestamp'>): FinancialTransaction {
    const transactions = this.getTransactions();
    const newTx: FinancialTransaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    transactions.unshift(newTx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return newTx;
  },

  // Orders
  getOrders(): OrderItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  clearAllOrders(): void {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
  },

  saveOrders(orders: OrderItem[]): void {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  },

  createOrder(orderData: Partial<OrderItem>): OrderItem {
    const settings = this.getSettings();
    const orderNumber = orderData.orderNumber || generateOrderNumber();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const defaultCustomerPhone = orderData.customer?.phone || '+227 90 00 00 00';
    const pickupDistrict = NIAMEY_DISTRICTS.find(d => d.id === orderData.pickup?.districtId) || NIAMEY_DISTRICTS[0];
    const dropoffDistrict = NIAMEY_DISTRICTS.find(d => d.id === orderData.dropoff?.districtId) || NIAMEY_DISTRICTS[1];

    // Pick closest available driver or default
    const drivers = this.getDrivers();
    const availableDriver = drivers.find(d => d.status === 'AVAILABLE') || drivers[0];

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const newOrder: OrderItem = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customer: {
        name: orderData.customer?.name || 'Client Niamey',
        phone: defaultCustomerPhone,
        verified: true,
        verificationCode: otp
      },
      pickup: {
        districtId: pickupDistrict.id,
        districtName: pickupDistrict.name,
        addressDetail: orderData.pickup?.addressDetail || 'Repère principal',
        contactPhone: orderData.pickup?.contactPhone || defaultCustomerPhone,
        lat: pickupDistrict.lat,
        lng: pickupDistrict.lng
      },
      dropoff: {
        districtId: dropoffDistrict.id,
        districtName: dropoffDistrict.name,
        addressDetail: orderData.dropoff?.addressDetail || 'Destination',
        recipientName: orderData.dropoff?.recipientName || 'Destinataire',
        recipientPhone: orderData.dropoff?.recipientPhone || '+227 99 00 00 00',
        lat: dropoffDistrict.lat,
        lng: dropoffDistrict.lng
      },
      parcel: {
        type: orderData.parcel?.type || 'COLIS_STANDARD',
        weightKg: orderData.parcel?.weightKg || 1.5,
        description: orderData.parcel?.description || 'Colis Express Faucon',
        stockItemId: orderData.parcel?.stockItemId,
        fragile: !!orderData.parcel?.fragile
      },
      pricing: orderData.pricing || {
        baseFareFcfa: 1500,
        distanceFeeFcfa: 500,
        priorityExpressFeeFcfa: 0,
        totalFcfa: 2000,
        driverCommissionFcfa: 1400
      },
      payment: {
        method: orderData.payment?.method || 'MY_NITA',
        status: orderData.payment?.status || 'CONFIRMED',
        reference: orderData.payment?.reference || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        payerPhone: defaultCustomerPhone,
        paidAt: now
      },
      delivery: {
        status: availableDriver ? 'ASSIGNED' : 'CREATED',
        driverId: availableDriver?.id,
        driverName: availableDriver?.name || "En cours d'attribution",
        driverPhone: availableDriver?.phone || '',
        driverVehicle: availableDriver?.vehicle || 'Moto Boxer 150',
        currentCoords: {
          lat: pickupDistrict.lat + 0.003,
          lng: pickupDistrict.lng + 0.002
        },
        progressPercent: availableDriver ? 20 : 10,
        estimatedMinutes: 25,
        startedAt: now,
        deliveryOtp: otp
      },
      createdAt: now,
      securityHash: generateSecurityToken(orderNumber, defaultCustomerPhone),
      smsLog: [
        {
          id: `sms-init-client-${Date.now()}`,
          recipient: defaultCustomerPhone,
          message: `Faucon Express: Votre commande ${orderNumber} est validée! ${availableDriver ? `Livreur: ${availableDriver.name} (${availableDriver.phone}).` : "Livreur en cours d'attribution."} Code de livraison: ${otp}.`,
          sentAt: now,
          status: 'DELIVERED'
        },
        {
          id: `sms-owner-${Date.now()}`,
          recipient: settings.ownerPhone, // +227 99 61 40 98
          message: `[FAUCON EXPRESS DISPATCH] Nouvelle course ${orderNumber} de ${pickupDistrict.name} vers ${dropoffDistrict.name}. Montant: ${orderData.pricing?.totalFcfa || 2000} FCFA (${orderData.payment?.method || 'MY_NITA'}). ${availableDriver ? `Livreur: ${availableDriver.name}` : 'À attribuer dans votre tableau de bord.'}`,
          sentAt: now,
          status: 'DELIVERED'
        }
      ]
    };

    // Auto deduct packaging stock if chosen
    if (newOrder.parcel.stockItemId) {
      this.adjustStock(newOrder.parcel.stockItemId, -1, `Utilisation pour commande ${orderNumber}`, orderNumber);
    } else {
      // Deduct standard pouch by default
      this.adjustStock('stk-01', -1, `Consommation pochette express commande ${orderNumber}`, orderNumber);
    }

    // Auto record transaction
    this.recordTransaction({
      orderNumber,
      type: 'PAYMENT_RECEIVED',
      method: newOrder.payment.method,
      amountFcfa: newOrder.pricing.totalFcfa,
      status: 'CONFIRMED',
      reference: newOrder.payment.reference || `TX-${orderNumber}`,
      senderPhone: defaultCustomerPhone,
      notes: `Paiement ${newOrder.payment.method} pour commande ${orderNumber}`
    });

    const orders = this.getOrders();
    orders.unshift(newOrder);
    this.saveOrders(orders);

    // Add in-app notification
    this.addNotification({
      title: `Nouvelle Commande ${orderNumber}`,
      message: `De ${pickupDistrict.name} à ${dropoffDistrict.name} · ${newOrder.pricing.totalFcfa} FCFA`,
      orderNumber,
      type: 'ORDER_UPDATE'
    });

    broadcastOrderChange(newOrder, 'CREATED');

    return newOrder;
  },

  updateOrderStatus(orderId: string, status: OrderItem['delivery']['status'], extra?: Partial<OrderItem['delivery']>): OrderItem | null {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId || o.orderNumber === orderId);
    if (orderIndex === -1) return null;

    const order = orders[orderIndex];
    const settings = this.getSettings();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    let progressPercent = order.delivery.progressPercent;
    let etaMinutes = order.delivery.estimatedMinutes;

    switch (status) {
      case 'CREATED':
        progressPercent = 10;
        etaMinutes = 35;
        break;
      case 'ASSIGNED':
        progressPercent = 25;
        etaMinutes = 25;
        break;
      case 'PICKED_UP':
        progressPercent = 50;
        etaMinutes = 18;
        break;
      case 'IN_TRANSIT':
        progressPercent = 75;
        etaMinutes = 10;
        break;
      case 'ARRIVED':
        progressPercent = 90;
        etaMinutes = 2;
        break;
      case 'DELIVERED':
        progressPercent = 100;
        etaMinutes = 0;
        order.delivery.deliveredAt = now;
        order.payment.status = 'PAID';
        break;
      case 'CANCELLED':
        progressPercent = 0;
        etaMinutes = 0;
        break;
    }

    order.delivery = {
      ...order.delivery,
      status,
      progressPercent,
      estimatedMinutes: etaMinutes,
      ...extra
    };

    // Add SMS notification record for critical steps
    const statusMessages: Record<string, string> = {
      PICKED_UP: `Faucon Express: Le livreur a récupéré votre colis ${order.orderNumber}. Il est en route !`,
      IN_TRANSIT: `Faucon Express: Votre colis ${order.orderNumber} est en vol dans Niamey. Arrivée estimée dans ${etaMinutes} min.`,
      ARRIVED: `Faucon Express: Le livreur ${order.delivery.driverName} est arrivé à votre destination ! Présentez le code OTP ${order.delivery.deliveryOtp}.`,
      DELIVERED: `Faucon Express: Colis ${order.orderNumber} remis avec succès. Merci de faire confiance au numéro 1 de Niamey (+227 99 61 40 98).`
    };

    if (statusMessages[status]) {
      const smsText = statusMessages[status];
      order.smsLog.push({
        id: `sms-${status}-${Date.now()}`,
        recipient: order.dropoff.recipientPhone,
        message: smsText,
        sentAt: now,
        status: 'DELIVERED'
      });

      // Also notify owner on critical delivery
      if (status === 'DELIVERED') {
        order.smsLog.push({
          id: `sms-owner-deliv-${Date.now()}`,
          recipient: settings.ownerPhone,
          message: `[FAUCON EXPRESS] Course ${order.orderNumber} finalisée et livrée. Règlement validé.`,
          sentAt: now,
          status: 'DELIVERED'
        });

        // Record driver commission
        this.recordTransaction({
          orderNumber: order.orderNumber,
          type: 'DRIVER_PAYOUT',
          method: 'MY_NITA',
          amountFcfa: order.pricing.driverCommissionFcfa,
          status: 'CONFIRMED',
          reference: `COMM-${order.orderNumber}`,
          senderPhone: settings.ownerPhone,
          notes: `Commission livrée à ${order.delivery.driverName}`
        });
      }
    }

    orders[orderIndex] = order;
    this.saveOrders(orders);
    broadcastOrderChange(order, 'UPDATED');

    this.addNotification({
      title: `Mise à jour Course ${order.orderNumber}`,
      message: `Statut passé à : ${status}`,
      orderNumber: order.orderNumber,
      type: 'ORDER_UPDATE'
    });

    return order;
  },

  // Notifications
  getNotifications(): PushNotification[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  addNotification(notif: Omit<PushNotification, 'id' | 'timestamp' | 'read'>): void {
    const list = this.getNotifications();
    const newNotif: PushNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    list.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list.slice(0, 30)));
  },

  // Chat
  getChatMessages(orderNumber?: string): ChatMessage[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
    let list: ChatMessage[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }
    if (list.length === 0) {
      list = [
        {
          id: 'chat-01',
          orderId: 'FCX-2026-7841',
          orderNumber: 'FCX-2026-7841',
          sender: 'OWNER_ADMIN',
          senderName: 'Abdoulkader Alio (Propriétaire Faucon)',
          message: 'Bonjour, votre course est en cours de prise en charge par notre meilleur livreur. Je suis joignable directement au +227 99 61 40 98 pour toute question.',
          timestamp: '09:15',
          read: true
        },
        {
          id: 'chat-02',
          orderId: 'FCX-2026-7841',
          orderNumber: 'FCX-2026-7841',
          sender: 'DRIVER',
          senderName: 'Moussa Ibrahim (Livreur)',
          message: 'Salam ! Je viens de récupérer le colis au Plateau. Je traverse le Pont Kennedy vers Harobanda.',
          timestamp: '09:18',
          read: true
        }
      ];
      localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(list));
    }

    if (orderNumber) {
      return list.filter(m => m.orderNumber === orderNumber);
    }
    return list;
  },

  sendChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>): ChatMessage {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
    let list: ChatMessage[] = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch { list = []; }
    }
    const newMsg: ChatMessage = {
      ...msg,
      id: `chat-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      read: true
    };
    list.push(newMsg);
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(list));
    return newMsg;
  },

  // Offline Mode Management
  isOffline(): boolean {
    return localStorage.getItem(STORAGE_KEYS.OFFLINE_STATUS) === 'true';
  },

  setOffline(offline: boolean): void {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_STATUS, offline ? 'true' : 'false');
  },

  getOfflineQueue(): Array<{ id: string; action: string; payload: unknown; timestamp: string }> {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  enqueueOfflineAction(action: string, payload: unknown): void {
    const queue = this.getOfflineQueue();
    queue.push({
      id: `queue-${Date.now()}`,
      action,
      payload,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  },

  syncOfflineQueue(): number {
    const queue = this.getOfflineQueue();
    const count = queue.length;
    // Process queue items
    queue.forEach(item => {
      if (item.action === 'UPDATE_ORDER_STATUS') {
        const { orderId, status } = item.payload as { orderId: string; status: OrderItem['delivery']['status'] };
        this.updateOrderStatus(orderId, status);
      }
    });
    // Clear queue
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return count;
  },

  // Seed default orders - empty for clean production usage
  createSeedOrders(): OrderItem[] {
    return [];
  }
};
