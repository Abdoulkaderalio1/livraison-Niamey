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

export const INITIAL_DRIVERS: Driver[] = [];

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

export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [];

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
