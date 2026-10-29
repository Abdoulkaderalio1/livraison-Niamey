import { 
  OrderItem, Driver, StockItem, FinancialTransaction, 
  ChatMessage, AdminSettings, PushNotification, StockMovement 
} from '../types';
import { 
  NIAMEY_DISTRICTS, INITIAL_DRIVERS, INITIAL_STOCK, 
  INITIAL_TRANSACTIONS, DEFAULT_SETTINGS 
} from '../data/niameyData';

const STORAGE_KEYS = {
  ORDERS: 'faucon_orders_v1',
  DRIVERS: 'faucon_drivers_v1',
  STOCK: 'faucon_stock_v1',
  STOCK_MOVEMENTS: 'faucon_stock_mvts_v1',
  TRANSACTIONS: 'faucon_transactions_v1',
  CHAT_MESSAGES: 'faucon_chat_v1',
  SETTINGS: 'faucon_settings_v1',
  OFFLINE_QUEUE: 'faucon_offline_queue_v1',
  NOTIFICATIONS: 'faucon_notifications_v1',
  OFFLINE_STATUS: 'faucon_force_offline'
};

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
      localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(INITIAL_DRIVERS));
      return INITIAL_DRIVERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_DRIVERS;
    }
  },

  saveDrivers(drivers: Driver[]): void {
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
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
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
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
      const seeded = this.createSeedOrders();
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(seeded));
      return seeded;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
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
        status: 'ASSIGNED',
        driverId: availableDriver.id,
        driverName: availableDriver.name,
        driverPhone: availableDriver.phone,
        driverVehicle: availableDriver.vehicle,
        currentCoords: {
          lat: pickupDistrict.lat + 0.003,
          lng: pickupDistrict.lng + 0.002
        },
        progressPercent: 20,
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
          message: `Faucon Express: Votre commande ${orderNumber} est validée! Suivi GPS en direct. Livreur: ${availableDriver.name} (${availableDriver.phone}). Code de livraison: ${otp}.`,
          sentAt: now,
          status: 'DELIVERED'
        },
        {
          id: `sms-owner-${Date.now()}`,
          recipient: settings.ownerPhone, // +227 99 61 40 98
          message: `[FAUCON EXPRESS DISPATCH] Nouvelle course ${orderNumber} de ${pickupDistrict.name} vers ${dropoffDistrict.name}. Montant: ${orderData.pricing?.totalFcfa || 2000} FCFA (${orderData.payment?.method || 'MY_NITA'}). Livreur: ${availableDriver.name}.`,
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

  // Seed default orders
  createSeedOrders(): OrderItem[] {
    const now = '2026-10-29 09:12';
    return [
      {
        id: 'ord-seed-01',
        orderNumber: 'FCX-2026-7841',
        customer: {
          name: 'Ibrahim Dan Baba',
          phone: '+227 96 11 22 33',
          verified: true,
          verificationCode: '4920'
        },
        pickup: {
          districtId: 'plateau',
          districtName: 'Plateau / Centre des Affaires',
          addressDetail: 'Face Immeuble Sonitel, Rue de la BCEAO',
          contactPhone: '+227 96 11 22 33',
          lat: 13.5152,
          lng: 2.1105
        },
        dropoff: {
          districtId: 'harobanda',
          districtName: 'Harobanda (Rive Droite)',
          addressDetail: 'Campus UAM, Faculté des Sciences',
          recipientName: 'Dr. Halidou Seyni',
          recipientPhone: '+227 90 22 33 44',
          lat: 13.5010,
          lng: 2.1010
        },
        parcel: {
          type: 'DOCUMENTS',
          weightKg: 0.8,
          description: 'Dossier confidentiel d’appels d’offres et contrats scellés',
          fragile: false
        },
        pricing: {
          baseFareFcfa: 1500,
          distanceFeeFcfa: 500,
          priorityExpressFeeFcfa: 500,
          totalFcfa: 2500,
          driverCommissionFcfa: 1750
        },
        payment: {
          method: 'MY_NITA',
          status: 'PAID',
          reference: 'NITA-TX-99812401',
          payerPhone: '+227 96 11 22 33',
          paidAt: '2026-10-29 09:14'
        },
        delivery: {
          status: 'IN_TRANSIT',
          driverId: 'drv-01',
          driverName: 'Moussa Ibrahim',
          driverPhone: '+227 96 45 12 80',
          driverVehicle: 'Moto Boxer 150',
          currentCoords: { lat: 13.5085, lng: 2.1060 }, // Sur le Pont Kennedy
          progressPercent: 70,
          estimatedMinutes: 8,
          startedAt: '2026-10-29 09:15',
          deliveryOtp: '4920'
        },
        createdAt: now,
        securityHash: 'E2E-SHA256-7841BCEAO',
        smsLog: [
          {
            id: 'sms-01',
            recipient: '+227 96 11 22 33',
            message: 'Faucon Express: Commande FCX-2026-7841 confirmée. Livreur Moussa (+227 96 45 12 80). Code OTP: 4920',
            sentAt: '09:12',
            status: 'DELIVERED'
          },
          {
            id: 'sms-02',
            recipient: '+227 99 61 40 98',
            message: '[FAUCON DISPATCH] Course FCX-2026-7841: Plateau -> Harobanda (2500 FCFA MY Nita) assignée à Moussa.',
            sentAt: '09:13',
            status: 'DELIVERED'
          },
          {
            id: 'sms-03',
            recipient: '+227 90 22 33 44',
            message: 'Faucon Express: Votre colis approche via Pont Kennedy. Arrivée prévue dans 8 min.',
            sentAt: '09:20',
            status: 'DELIVERED'
          }
        ]
      },
      {
        id: 'ord-seed-02',
        orderNumber: 'FCX-2026-7840',
        customer: {
          name: 'Amina Kountché',
          phone: '+227 90 44 55 66',
          verified: true,
          verificationCode: '8112'
        },
        pickup: {
          districtId: 'wadata',
          districtName: 'Wadata / Grand Marché',
          addressDetail: 'Boutique Épices & Parfums, Allée Centrale',
          contactPhone: '+227 90 44 55 66',
          lat: 13.5220,
          lng: 2.1365
        },
        dropoff: {
          districtId: 'koira_kano',
          districtName: 'Koira Kano',
          addressDetail: 'Villa 142, Rue des Ambassades',
          recipientName: 'Mme Zeinabou',
          recipientPhone: '+227 92 11 88 77',
          lat: 13.5450,
          lng: 2.0965
        },
        parcel: {
          type: 'COLIS_STANDARD',
          weightKg: 2.4,
          description: 'Coffret cadeaux de senteurs traditionnelles et tissus',
          fragile: true
        },
        pricing: {
          baseFareFcfa: 2000,
          distanceFeeFcfa: 1000,
          priorityExpressFeeFcfa: 0,
          totalFcfa: 3000,
          driverCommissionFcfa: 2100
        },
        payment: {
          method: 'AMANATA',
          status: 'PAID',
          reference: 'AMN-TRANSFER-48190',
          payerPhone: '+227 90 44 55 66',
          paidAt: '2026-10-29 08:45'
        },
        delivery: {
          status: 'DELIVERED',
          driverId: 'drv-03',
          driverName: 'Garba Oumarou',
          driverPhone: '+227 90 77 66 55',
          driverVehicle: 'Scooter Express 125',
          currentCoords: { lat: 13.5450, lng: 2.0965 },
          progressPercent: 100,
          estimatedMinutes: 0,
          startedAt: '2026-10-29 08:35',
          deliveredAt: '2026-10-29 09:05',
          deliveryOtp: '8112'
        },
        createdAt: '2026-10-29 08:30',
        securityHash: 'E2E-SHA256-7840WADATA',
        smsLog: [
          {
            id: 'sms-04',
            recipient: '+227 90 44 55 66',
            message: 'Faucon Express: Colis FCX-2026-7840 livré avec succès à Koira Kano. Merci !',
            sentAt: '09:05',
            status: 'DELIVERED'
          }
        ]
      }
    ];
  }
};
