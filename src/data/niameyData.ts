import { NiameyDistrict, Driver, StockItem, FinancialTransaction, AdminSettings } from '../types';

export const NIAMEY_DISTRICTS: NiameyDistrict[] = [
  {
    id: 'plateau',
    name: 'Plateau / Centre des Affaires',
    zone: 'RIVE_GAUCHE_CENTRE',
    lat: 13.5152,
    lng: 2.1105,
    popularPlaces: ['Siège BCEAO', 'Présidence de la République', 'Grand Hôtel', 'Banque Atlantique', 'Avenue du Général de Gaulle']
  },
  {
    id: 'yantala',
    name: 'Yantala (Haut & Bas)',
    zone: 'RIVE_GAUCHE_NORD',
    lat: 13.5305,
    lng: 2.0880,
    popularPlaces: ['Gendarmerie Yantala', 'Clinique Gamkalley', 'Corniche Yantala', 'Place Toumo']
  },
  {
    id: 'koira_kano',
    name: 'Koira Kano',
    zone: 'RIVE_GAUCHE_NORD',
    lat: 13.5450,
    lng: 2.0965,
    popularPlaces: ['Ambassade des USA', 'Résidences Diplomatiques', 'Complexe Scolaire Privé', 'Rond-point Gadafawa']
  },
  {
    id: 'boukoki',
    name: 'Boukoki / Katako',
    zone: 'RIVE_GAUCHE_CENTRE',
    lat: 13.5340,
    lng: 2.1320,
    popularPlaces: ['Marché Katako', 'Boukoki 1 & 2', 'Pharmacie Populaire', 'Boulevard Mali Béro']
  },
  {
    id: 'wadata',
    name: 'Wadata / Grand Marché',
    zone: 'RIVE_GAUCHE_CENTRE',
    lat: 13.5220,
    lng: 2.1365,
    popularPlaces: ['Grand Marché de Niamey', 'Stade Général Seyni Kountché', 'Gare Wadata', 'Marché de bétail']
  },
  {
    id: 'talladje',
    name: 'Talladjé',
    zone: 'RIVE_GAUCHE_EST',
    lat: 13.4980,
    lng: 2.1550,
    popularPlaces: ['Rond-point Talladjé', 'Pharmacie Talladjé', 'Voie Express Aéroport']
  },
  {
    id: 'aeroport',
    name: 'Aéroport Diori Hamani',
    zone: 'RIVE_GAUCHE_EST',
    lat: 13.4830,
    lng: 2.1760,
    popularPlaces: ['Terminal Passagers', 'Zone Fret Aérien', 'Hangar Présidentiel']
  },
  {
    id: 'francophonie',
    name: 'Francophonie / Cité Députés',
    zone: 'RIVE_GAUCHE_NORD',
    lat: 13.5460,
    lng: 2.1450,
    popularPlaces: ['Cité de la Francophonie', 'Cité des Députés', 'Rond-point Sixième']
  },
  {
    id: 'lazaret',
    name: 'Lazaret / Route Torodi',
    zone: 'RIVE_GAUCHE_EST',
    lat: 13.5260,
    lng: 2.1620,
    popularPlaces: ['Carrefour Lazaret', 'Poste de Police Lazaret', 'Complexe Artisanal']
  },
  {
    id: 'dar_es_salam',
    name: 'Dar-es-salam',
    zone: 'RIVE_GAUCHE_EST',
    lat: 13.5410,
    lng: 2.1720,
    popularPlaces: ['Zone Résidentielle Est', 'Grand Mosquée Dar-es-salam']
  },
  {
    id: 'harobanda',
    name: 'Harobanda (Rive Droite)',
    zone: 'RIVE_DROITE',
    lat: 13.5010,
    lng: 2.1010,
    popularPlaces: ['Université Abdou Moumouni', 'Hôpital National Lamordé', 'Débouché Pont Kennedy']
  },
  {
    id: 'kirkissoye',
    name: 'Kirkissoye (Rive Droite)',
    zone: 'RIVE_DROITE',
    lat: 13.4880,
    lng: 2.0870,
    popularPlaces: ['Village Kirkissoye', 'Zone Maraîchère', 'Rive Fleuve Niger']
  },
  {
    id: 'gamkalle',
    name: 'Gamkallé / Terminus',
    zone: 'RIVE_GAUCHE_CENTRE',
    lat: 13.5070,
    lng: 2.1240,
    popularPlaces: ['Abattoir Frigorifique', 'Quartier Industriel', 'Port Fluvial']
  },
  {
    id: 'saga',
    name: 'Saga',
    zone: 'RIVE_GAUCHE_EST',
    lat: 13.4810,
    lng: 2.1460,
    popularPlaces: ['Périmètre Rizicole de Saga', 'Centre de Santé de Saga']
  }
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'drv-01',
    name: 'Moussa Ibrahim',
    phone: '+227 96 45 12 80',
    vehicle: 'Moto Boxer 150',
    licensePlate: 'RN-8492-NE',
    photoUrl: '/src/assets/images/faucon_express_courier_1793266544653.jpg',
    rating: 4.95,
    completedDeliveries: 428,
    status: 'BUSY',
    currentDistrict: 'Plateau / Centre des Affaires',
    lat: 13.5165,
    lng: 2.1120,
    batteryLevel: 92,
    earningsTodayFcfa: 16500,
    isBackgroundChecked: true
  },
  {
    id: 'drv-02',
    name: 'Abdoulaye Soumana',
    phone: '+227 88 12 34 56',
    vehicle: 'Moto Boxer 150',
    licensePlate: 'RN-3129-NE',
    photoUrl: '/src/assets/images/faucon_express_courier_1793266544653.jpg',
    rating: 4.88,
    completedDeliveries: 312,
    status: 'AVAILABLE',
    currentDistrict: 'Harobanda (Rive Droite)',
    lat: 13.5030,
    lng: 2.1025,
    batteryLevel: 85,
    earningsTodayFcfa: 12000,
    isBackgroundChecked: true
  },
  {
    id: 'drv-03',
    name: 'Garba Oumarou',
    phone: '+227 90 77 66 55',
    vehicle: 'Scooter Express 125',
    licensePlate: 'RN-9011-NE',
    photoUrl: '/src/assets/images/faucon_express_courier_1793266544653.jpg',
    rating: 4.91,
    completedDeliveries: 195,
    status: 'AVAILABLE',
    currentDistrict: 'Boukoki / Katako',
    lat: 13.5350,
    lng: 2.1330,
    batteryLevel: 97,
    earningsTodayFcfa: 9500,
    isBackgroundChecked: true
  },
  {
    id: 'drv-04',
    name: 'Salissou Amadou',
    phone: '+227 94 22 11 33',
    vehicle: 'Tricycle Cargo',
    licensePlate: 'RN-5544-NE',
    photoUrl: '/src/assets/images/faucon_express_courier_1793266544653.jpg',
    rating: 4.97,
    completedDeliveries: 540,
    status: 'AVAILABLE',
    currentDistrict: 'Wadata / Grand Marché',
    lat: 13.5210,
    lng: 2.1380,
    batteryLevel: 88,
    earningsTodayFcfa: 21000,
    isBackgroundChecked: true
  }
];

export const INITIAL_STOCK: StockItem[] = [
  {
    id: 'stk-01',
    name: 'Pochette Sécurisée Faucon A4 (Inviolable)',
    sku: 'FCX-ENV-A4',
    category: 'EMBALLAGE',
    quantity: 340,
    minAlertThreshold: 50,
    unitValueFcfa: 350,
    location: 'Dépôt Central Plateau',
    lastUpdated: '2026-10-29 08:30'
  },
  {
    id: 'stk-02',
    name: 'Carton Renforcé Faucon Format M (10kg)',
    sku: 'FCX-BOX-M',
    category: 'EMBALLAGE',
    quantity: 180,
    minAlertThreshold: 30,
    unitValueFcfa: 900,
    location: 'Dépôt Central Plateau',
    lastUpdated: '2026-10-29 09:15'
  },
  {
    id: 'stk-03',
    name: 'Sacs Isothermes Médicaux & Frais',
    sku: 'FCX-ISO-MED',
    category: 'SECURITE',
    quantity: 45,
    minAlertThreshold: 10,
    unitValueFcfa: 3500,
    location: 'Hub Spécial Pharmacie Lamordé',
    lastUpdated: '2026-10-29 07:45'
  },
  {
    id: 'stk-04',
    name: 'Stock E-commerce Partenaire (Smartphones & Électronique)',
    sku: 'ECM-SMART-N9',
    category: 'ECOMMERCE_STOCK',
    quantity: 28,
    minAlertThreshold: 5,
    unitValueFcfa: 48000,
    location: 'Rayon Marchand Recasement',
    lastUpdated: '2026-10-29 08:00'
  },
  {
    id: 'stk-05',
    name: 'Ruban Adhésif de Sécurité Scellé Faucon',
    sku: 'FCX-TAPE-GOLD',
    category: 'CONSOMMABLE',
    quantity: 92,
    minAlertThreshold: 20,
    unitValueFcfa: 1200,
    location: 'Dépôt Central Plateau',
    lastUpdated: '2026-10-28 17:00'
  }
];

export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: 'tx-1001',
    orderNumber: 'FCX-2026-7841',
    type: 'PAYMENT_RECEIVED',
    method: 'MY_NITA',
    amountFcfa: 2500,
    status: 'CONFIRMED',
    reference: 'NITA-TX-99812401',
    senderPhone: '+227 96 11 22 33',
    timestamp: '2026-10-29 09:14',
    notes: 'Règlement express MY Nita vérifié avec succès'
  },
  {
    id: 'tx-1002',
    orderNumber: 'FCX-2026-7840',
    type: 'PAYMENT_RECEIVED',
    method: 'AMANATA',
    amountFcfa: 3000,
    status: 'CONFIRMED',
    reference: 'AMN-TRANSFER-48190',
    senderPhone: '+227 90 44 55 66',
    timestamp: '2026-10-29 08:45',
    notes: 'Transfert Amanata validé au guichet'
  },
  {
    id: 'tx-1003',
    orderNumber: 'FCX-2026-7839',
    type: 'PAYMENT_RECEIVED',
    method: 'CASH',
    amountFcfa: 1500,
    status: 'CONFIRMED',
    reference: 'CASH-REC-7839',
    senderPhone: '+227 97 88 99 00',
    timestamp: '2026-10-29 08:12',
    notes: 'Espèces encaissées par livreur Moussa Ibrahim'
  },
  {
    id: 'tx-1004',
    orderNumber: 'FCX-2026-7838',
    type: 'DRIVER_PAYOUT',
    method: 'MY_NITA',
    amountFcfa: 8400,
    status: 'CONFIRMED',
    reference: 'NITA-DISB-44120',
    senderPhone: '+227 99 61 40 98',
    timestamp: '2026-10-29 07:30',
    notes: 'Versement commission livreur Moussa Ibrahim'
  }
];

export const DEFAULT_SETTINGS: AdminSettings = {
  ownerName: 'Abdoulkader Alio',
  ownerPhone: '+227 99 61 40 98',
  dispatchPhone: '+227 99 61 40 98',
  baseDeliveryFeeFcfa: 1000,
  crossRiverSurchargeFcfa: 500, // Traversée fleuve Niger (Pont Kennedy / Pont Chinois)
  expressPrioritySurchargeFcfa: 500,
  driverCommissionRate: 0.70, // 70% livreur, 30% plateforme
  autoAssignCourier: true,
  smsGatewayEnabled: true,
  strictAntiFraud: true,
  offlineSyncIntervalSec: 15
};
