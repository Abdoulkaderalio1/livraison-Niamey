import React, { useState } from 'react';
import { 
  BarChart3, Package, Users, DollarSign, Settings, 
  MapPin, ShieldCheck, Phone, CheckCircle2, AlertTriangle, 
  RefreshCw, Plus, Download, Filter, MessageSquare, 
  Smartphone, Send, Eye, Shield 
} from 'lucide-react';
import { 
  OrderItem, Driver, StockItem, FinancialTransaction, 
  AdminSettings, StockMovement, Language 
} from '../types';
import { StorageService } from '../services/storageService';
import { NiameyInteractiveMap } from './NiameyInteractiveMap';
import { NIAMEY_DISTRICTS } from '../data/niameyData';
import { TRANSLATIONS } from '../data/translations';

interface AdminDashboardProps {
  orders: OrderItem[];
  drivers: Driver[];
  stock: StockItem[];
  transactions: FinancialTransaction[];
  settings: AdminSettings;
  onOrderUpdated: (order: OrderItem) => void;
  onStockUpdated: (stock: StockItem[]) => void;
  onSettingsUpdated: (settings: AdminSettings) => void;
  onOpenChat: (order: OrderItem) => void;
  lang: Language;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  drivers,
  stock,
  transactions,
  settings,
  onOrderUpdated,
  onStockUpdated,
  onSettingsUpdated,
  onOpenChat,
  lang
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  const [activeTab, setActiveTab] = useState<'OPERATIONS' | 'STOCK' | 'FINANCE' | 'SMS_LOG' | 'SETTINGS'>('OPERATIONS');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(orders[0] || null);

  // Stock edit state
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [newStockName, setNewStockName] = useState('');
  const [newStockSku, setNewStockSku] = useState('');
  const [newStockQty, setNewStockQty] = useState(50);
  const [newStockThreshold, setNewStockThreshold] = useState(15);
  const [newStockUnitCost, setNewStockUnitCost] = useState(500);

  // Settings form state
  const [currentSettings, setCurrentSettings] = useState<AdminSettings>(settings);

  // Custom SMS test state
  const [testSmsPhone, setTestSmsPhone] = useState(settings.ownerPhone);
  const [testSmsMessage, setTestSmsMessage] = useState('');

  // Financial Computations
  const totalGrossRevenue = transactions
    .filter(t => t.type === 'PAYMENT_RECEIVED' && t.status === 'CONFIRMED')
    .reduce((sum, t) => sum + t.amountFcfa, 0);

  const totalDriverPayouts = transactions
    .filter(t => t.type === 'DRIVER_PAYOUT' && t.status === 'CONFIRMED')
    .reduce((sum, t) => sum + t.amountFcfa, 0);

  const netPlatformProfit = totalGrossRevenue - totalDriverPayouts;

  const myNitaTotal = transactions
    .filter(t => t.method === 'MY_NITA' && t.type === 'PAYMENT_RECEIVED')
    .reduce((sum, t) => sum + t.amountFcfa, 0);

  const amanataTotal = transactions
    .filter(t => t.method === 'AMANATA' && t.type === 'PAYMENT_RECEIVED')
    .reduce((sum, t) => sum + t.amountFcfa, 0);

  const cashTotal = transactions
    .filter(t => t.method === 'CASH' && t.type === 'PAYMENT_RECEIVED')
    .reduce((sum, t) => sum + t.amountFcfa, 0);

  // Handle Driver Assignment
  const handleAssignDriver = (orderId: string, driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    const updated = StorageService.updateOrderStatus(orderId, 'ASSIGNED', {
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      driverVehicle: driver.vehicle
    });

    if (updated) {
      onOrderUpdated(updated);
      setSelectedOrder(updated);
    }
  };

  // Handle Order Status Manual Step
  const handleStatusChange = (orderId: string, newStatus: OrderItem['delivery']['status']) => {
    const updated = StorageService.updateOrderStatus(orderId, newStatus);
    if (updated) {
      onOrderUpdated(updated);
      setSelectedOrder(updated);
    }
  };

  // Handle Add New Stock Item
  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockName || !newStockSku) return;

    const newItem: StockItem = {
      id: `stk-${Date.now()}`,
      name: newStockName,
      sku: newStockSku.toUpperCase(),
      category: 'EMBALLAGE',
      quantity: Number(newStockQty),
      minAlertThreshold: Number(newStockThreshold),
      unitValueFcfa: Number(newStockUnitCost),
      location: 'Dépôt Central Plateau',
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updatedStock = [...stock, newItem];
    StorageService.saveStock(updatedStock);
    onStockUpdated(updatedStock);

    setShowAddStockModal(false);
    setNewStockName('');
    setNewStockSku('');
  };

  // Handle Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(currentSettings);
    onSettingsUpdated(currentSettings);
    alert("Paramètres de la plateforme Faucon Express mis à jour avec succès.");
  };

  // Handle Send Test SMS
  const handleSendTestSms = () => {
    if (!testSmsMessage.trim()) return;
    alert(`[Passerelle SMS Niger]\nMessage envoyé au ${testSmsPhone} :\n"${testSmsMessage}"`);
    setTestSmsMessage('');
  };

  // Export CSV Ledger
  const handleExportCsv = () => {
    const header = "ID,Commande,Type,Methode,Montant_FCFA,Statut,Reference,Date\n";
    const rows = transactions.map(t => 
      `${t.id},${t.orderNumber},${t.type},${t.method},${t.amountFcfa},${t.status},${t.reference},${t.timestamp}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `faucon_express_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stockMovements = StorageService.getStockMovements();

  return (
    <div className="space-y-6">
      {/* Super Admin Owner Identity Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg">
            🦅
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">{settings.ownerName}</h2>
              <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-semibold">
                Propriétaire & Administrateur Suprême
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
              <span>Ligne Directe : <strong className="text-amber-400 font-mono">{settings.ownerPhone}</strong></span>
              <span>·</span>
              <span>Hub Central : Plateau / Niamey</span>
              <span>·</span>
              <span className="text-emerald-400">Système Sécurisé Actif</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 text-xs">
          <a
            href={`https://wa.me/22799614098`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>WhatsApp Ligne 99614098</span>
          </a>
          <button
            onClick={() => handleStatusChange(selectedOrder?.id || '', 'DELIVERED')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors"
          >
            Clôturer Course
          </button>
        </div>
      </div>

      {/* Financial KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Gross */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>{t.totalRevenue}</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-400 font-mono tabular-nums">
            {totalGrossRevenue.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">FCFA</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Encaissé via Nita, Amanata & Cash
          </div>
        </div>

        {/* MY Nita Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Part MY Nita</span>
            <span className="text-[10px] text-amber-400 font-mono">Mobile Money</span>
          </div>
          <div className="text-xl font-extrabold text-slate-100 font-mono tabular-nums">
            {myNitaTotal.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">FCFA</span>
          </div>
          <div className="text-[11px] text-emerald-400">
            Transactions automatiques
          </div>
        </div>

        {/* Amanata Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Part Amanata / Al Izza</span>
            <span className="text-[10px] text-emerald-400 font-mono">Guichet</span>
          </div>
          <div className="text-xl font-extrabold text-slate-100 font-mono tabular-nums">
            {amanataTotal.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">FCFA</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Espèces : {cashTotal.toLocaleString('fr-FR')} FCFA
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>{t.netProfit} (30%)</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono tabular-nums">
            {netPlatformProfit.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">FCFA</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Livreurs : {totalDriverPayouts.toLocaleString('fr-FR')} FCFA
          </div>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('OPERATIONS')}
          className={`px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'OPERATIONS'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Opérations & Carte GPS ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'STOCK'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Gestion des Stocks ({stock.length})
        </button>
        <button
          onClick={() => setActiveTab('FINANCE')}
          className={`px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'FINANCE'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Historique Financier ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('SMS_LOG')}
          className={`px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'SMS_LOG'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Passerelle SMS & Alertes
        </button>
        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'SETTINGS'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Paramètres Plateforme
        </button>
      </div>

      {/* Tab 1: Operations & Live Map */}
      {activeTab === 'OPERATIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map Column */}
          <div className="lg:col-span-7 space-y-4">
            <NiameyInteractiveMap 
              activeOrder={selectedOrder} 
              drivers={drivers} 
              mode="DISPATCH" 
            />

            {/* Courier Fleet Status Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <h4 className="font-bold text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Flotte de Livreurs Niamey ({drivers.length})
                </h4>
                <span className="text-slate-400 text-[11px]">Tous vérifiés avec casier vierge</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="pb-2">Livreur</th>
                      <th className="pb-2">Véhicule</th>
                      <th className="pb-2">Secteur</th>
                      <th className="pb-2">Statut</th>
                      <th className="pb-2 text-right">Courses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {drivers.map(drv => (
                      <tr key={drv.id} className="hover:bg-slate-800/40">
                        <td className="py-2 font-medium text-slate-200 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>{drv.name}</span>
                        </td>
                        <td className="py-2 text-slate-400">{drv.vehicle}</td>
                        <td className="py-2 text-slate-300">{drv.currentDistrict.split('/')[0]}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            drv.status === 'AVAILABLE'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {drv.status === 'AVAILABLE' ? 'Disponible' : 'En course'}
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono text-slate-200">
                          {drv.completedDeliveries}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Orders Stream Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <h4 className="font-bold text-slate-100 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  Flux des Commandes Directes
                </h4>
                <span className="text-amber-400 font-mono text-[11px]">{orders.length} enregistrées</span>
              </div>

              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {orders.map(order => {
                  const isSelected = selectedOrder?.id === order.id;

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-xs text-amber-400">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                          {order.delivery.status}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                        <span>{order.pickup.districtName.split('/')[0]}</span>
                        <span className="text-slate-500">➔</span>
                        <span>{order.dropoff.districtName.split('/')[0]}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{order.customer.name} ({order.customer.phone})</span>
                        <span className="font-mono text-emerald-400 font-semibold">{order.pricing.totalFcfa} FCFA</span>
                      </div>

                      {/* Expanded Actions if selected */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs">
                          {/* Driver assign dropdown */}
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-[11px]">Assigner :</span>
                            <select
                              value={order.delivery.driverId || ''}
                              onChange={e => handleAssignDriver(order.id, e.target.value)}
                              className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
                            >
                              <option value="">Sélectionner un livreur</option>
                              {drivers.map(d => (
                                <option key={d.id} value={d.id}>
                                  {d.name} ({d.vehicle})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quick Status advance */}
                          <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                            {(['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'] as const).map(st => (
                              <button
                                key={st}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(order.id, st);
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap transition-colors ${
                                  order.delivery.status === st
                                    ? 'bg-amber-500 text-slate-950 font-bold'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenChat(order);
                              }}
                              className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-center font-medium flex items-center justify-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Messagerie Directe</span>
                            </button>
                            <a
                              href={`tel:${order.customer.phone}`}
                              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-center font-mono"
                            >
                              Appeler Client
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Management */}
      {activeTab === 'STOCK' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  Système de Gestion des Stocks & Marchandises Partenaires
                </h3>
                <p className="text-xs text-slate-400">
                  Déduction automatique des consommables et synchronisation avec les commandes reçues.
                </p>
              </div>
              <button
                onClick={() => setShowAddStockModal(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter Article au Stock</span>
              </button>
            </div>

            {/* Stock Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-3">Article & SKU</th>
                    <th className="pb-3">Catégorie</th>
                    <th className="pb-3 text-right">Quantité</th>
                    <th className="pb-3 text-right">Seuil d'Alerte</th>
                    <th className="pb-3 text-right">Valeur Unitaire</th>
                    <th className="pb-3">Emplacement Hub</th>
                    <th className="pb-3 text-center">Action Directe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stock.map(item => {
                    const isLow = item.quantity <= item.minAlertThreshold;

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/30">
                        <td className="py-3 font-semibold text-slate-200">
                          <div>{item.name}</div>
                          <span className="font-mono text-[10px] text-amber-400">{item.sku}</span>
                        </td>
                        <td className="py-3 text-slate-400">{item.category}</td>
                        <td className="py-3 text-right font-mono font-bold">
                          <span className={isLow ? 'text-rose-400' : 'text-emerald-400'}>
                            {item.quantity} unités
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono text-slate-400">
                          {item.minAlertThreshold}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-200">
                          {item.unitValueFcfa} FCFA
                        </td>
                        <td className="py-3 text-slate-400">{item.location}</td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                StorageService.adjustStock(item.id, 10, 'Réapprovisionnement manuel');
                                onStockUpdated(StorageService.getStock());
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold"
                              title="+10 unités"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => {
                                StorageService.adjustStock(item.id, -1, 'Sortie manuelle');
                                onStockUpdated(StorageService.getStock());
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 text-[11px] font-bold"
                              title="-1 unité"
                            >
                              -1
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock In/Out Movements Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              Journal des Mouvements de Stock Récent
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stockMovements.length > 0 ? (
                stockMovements.map(mvt => (
                  <div key={mvt.id} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <span className={`font-bold mr-2 ${mvt.type === 'IN' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        [{mvt.type === 'IN' ? '+ ENTRÉE' : '- SORTIE'}]
                      </span>
                      <span className="text-slate-200 font-medium">{mvt.itemName}</span>
                      <span className="text-slate-400 text-[11px] ml-2">({mvt.reason})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-100">{mvt.quantity} u.</span>
                      <span className="font-mono text-[10px] text-slate-500">{mvt.timestamp}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 p-3 text-center">Aucun mouvement récent enregistré.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Finance & Transactions */}
      {activeTab === 'FINANCE' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  Historique Complet des Transactions & Règlements
                </h3>
                <p className="text-xs text-slate-400">
                  Suivi financier précis MY Nita, Amanata et espèces certifiées.
                </p>
              </div>

              <button
                onClick={handleExportCsv}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Exporter Grand Livre (CSV)</span>
              </button>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-3">Réf Transaction</th>
                    <th className="pb-3">N° Course</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Moyen de Paiement</th>
                    <th className="pb-3 text-right">Montant FCFA</th>
                    <th className="pb-3">Date & Heure</th>
                    <th className="pb-3 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-mono text-amber-400 font-medium">{tx.reference}</td>
                      <td className="py-2.5 font-mono text-slate-200">{tx.orderNumber}</td>
                      <td className="py-2.5 text-slate-300">
                        {tx.type === 'PAYMENT_RECEIVED' ? 'Encaissement Client' : 'Versement Livreur'}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          tx.method === 'MY_NITA' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          tx.method === 'AMANATA' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        }`}>
                          {tx.method}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-100">
                        {tx.amountFcfa.toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="py-2.5 font-mono text-slate-400 text-[11px]">{tx.timestamp}</td>
                      <td className="py-2.5 text-center">
                        <span className="text-emerald-400 text-[11px] font-semibold">
                          ✓ Confirmé
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: SMS Gateway & Dispatch */}
      {activeTab === 'SMS_LOG' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              Passerelle SMS Télécom Niger en Direct
            </h3>
            <p className="text-xs text-slate-400">
              Chaque étape critique déclenche un SMS automatique au client et au propriétaire (+227 99 61 40 98).
            </p>

            <div className="space-y-2 max-h-[460px] overflow-y-auto">
              {orders.flatMap(o => o.smsLog).map((sms, i) => (
                <div key={sms.id || i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-mono text-amber-400 font-bold">{sms.recipient}</span>
                    <span className="font-mono text-[10px]">{sms.sentAt} · Statut: REMIS</span>
                  </div>
                  <p className="text-slate-200">{sms.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-100">
              Envoi Manuel de Notification SMS
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Destinataire (+227)</label>
                <input
                  type="text"
                  value={testSmsPhone}
                  onChange={e => setTestSmsPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Message SMS</label>
                <textarea
                  rows={4}
                  value={testSmsMessage}
                  onChange={e => setTestSmsMessage(e.target.value)}
                  placeholder="Ex: Faucon Express info: Votre livraison est confirmée..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSendTestSms}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Diffuser le SMS instantanément</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Settings */}
      {activeTab === 'SETTINGS' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              Paramètres Complets de Fonctionnement & Tarification
            </h3>
            <p className="text-xs text-slate-400">
              Configuration des coordonnées du propriétaire, des frais par quartier et des algorithmes de dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Nom du Propriétaire Administrateur</label>
              <input
                type="text"
                value={currentSettings.ownerName}
                onChange={e => setCurrentSettings({ ...currentSettings, ownerName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Téléphone Propriétaire / WhatsApp (+227)</label>
              <input
                type="text"
                value={currentSettings.ownerPhone}
                onChange={e => setCurrentSettings({ ...currentSettings, ownerPhone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Tarif de Base Niamey (FCFA)</label>
              <input
                type="number"
                value={currentSettings.baseDeliveryFeeFcfa}
                onChange={e => setCurrentSettings({ ...currentSettings, baseDeliveryFeeFcfa: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Majoration Traversée Pont Fleuve Niger (FCFA)</label>
              <input
                type="number"
                value={currentSettings.crossRiverSurchargeFcfa}
                onChange={e => setCurrentSettings({ ...currentSettings, crossRiverSurchargeFcfa: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Taux de Commission Livreur (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={Math.round(currentSettings.driverCommissionRate * 100)}
                onChange={e => setCurrentSettings({ ...currentSettings, driverCommissionRate: Number(e.target.value) / 100 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Délai Sync Hors-Ligne (secondes)</label>
              <input
                type="number"
                value={currentSettings.offlineSyncIntervalSec}
                onChange={e => setCurrentSettings({ ...currentSettings, offlineSyncIntervalSec: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-lg shadow-amber-500/10"
            >
              Enregistrer les Nouveaux Paramètres
            </button>
          </div>
        </form>
      )}

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleAddStock} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-100 text-sm">Ajouter un Article au Stock</h4>
              <button type="button" onClick={() => setShowAddStockModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nom de l'article *</label>
                <input
                  type="text"
                  required
                  value={newStockName}
                  onChange={e => setNewStockName(e.target.value)}
                  placeholder="Ex: Pochette Format A3 Sécurisée"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Code SKU *</label>
                <input
                  type="text"
                  required
                  value={newStockSku}
                  onChange={e => setNewStockSku(e.target.value)}
                  placeholder="Ex: FCX-ENV-A3"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Quantité</label>
                  <input
                    type="number"
                    value={newStockQty}
                    onChange={e => setNewStockQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Seuil Alerte</label>
                  <input
                    type="number"
                    value={newStockThreshold}
                    onChange={e => setNewStockThreshold(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Prix (FCFA)</label>
                  <input
                    type="number"
                    value={newStockUnitCost}
                    onChange={e => setNewStockUnitCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddStockModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
              >
                Enregistrer l'Article
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
