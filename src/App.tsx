/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Phone, MessageSquare, Globe, 
  MapPin, Clock, ArrowRight, Smartphone, 
  UserCheck, Shield, Sparkles, Navigation 
} from 'lucide-react';
import { StorageService, formatOrderWhatsAppUrl, playNotificationChime } from './services/storageService';
import { 
  OrderItem, Driver, StockItem, FinancialTransaction, 
  AdminSettings, Language 
} from './types';
import { CustomerPortal } from './components/CustomerPortal';
import { DriverApp } from './components/DriverApp';
import { AdminDashboard } from './components/AdminDashboard';
import { IntegratedChatModal } from './components/IntegratedChatModal';
import { TRANSLATIONS } from './data/translations';

type ActiveView = 'CLIENT' | 'DRIVER' | 'ADMIN';

export default function App() {
  const [lang, setLang] = useState<Language>('fr');
  const [activeView, setActiveView] = useState<ActiveView>('CLIENT');

  const [orders, setOrders] = useState<OrderItem[]>(() => StorageService.getOrders());
  const [drivers, setDrivers] = useState<Driver[]>(() => StorageService.getDrivers());
  const [stock, setStock] = useState<StockItem[]>(() => StorageService.getStock());
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => StorageService.getTransactions());
  const [settings, setSettings] = useState<AdminSettings>(() => StorageService.getSettings());

  // Real-time Order Alert Toast
  const [liveAlertOrder, setLiveAlertOrder] = useState<OrderItem | null>(null);

  // Chat Modal State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatOrder, setChatOrder] = useState<OrderItem | null>(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  // Real-time synchronization across browser tabs and components
  useEffect(() => {
    const handleSync = () => {
      setOrders(StorageService.getOrders());
      setDrivers(StorageService.getDrivers());
      setStock(StorageService.getStock());
      setTransactions(StorageService.getTransactions());
    };

    const handleOrderEvent = (e: Event) => {
      handleSync();
      const custom = e as CustomEvent<{ order: OrderItem; type: string }>;
      if (custom.detail?.type === 'CREATED') {
        playNotificationChime();
        setLiveAlertOrder(custom.detail.order);
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('faucon_order_event', handleOrderEvent);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('faucon_express_events');
        bc.onmessage = (msg) => {
          handleSync();
          if (msg.data?.type === 'CREATED') {
            playNotificationChime();
            setLiveAlertOrder(msg.data.order);
          }
        };
      } catch {
        // ignore
      }
    }

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('faucon_order_event', handleOrderEvent);
      if (bc) bc.close();
    };
  }, []);

  const handleOrderCreated = (newOrder: OrderItem) => {
    setOrders(StorageService.getOrders());
    setStock(StorageService.getStock());
    setTransactions(StorageService.getTransactions());
    setLiveAlertOrder(newOrder);
  };

  const handleOrderUpdated = (updatedOrder: OrderItem) => {
    setOrders(StorageService.getOrders());
    setTransactions(StorageService.getTransactions());
  };

  const handleOpenChat = (order?: OrderItem) => {
    setChatOrder(order || orders[0] || null);
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Privacy & Anti-Fraud Top Safety Ribbon */}
      <div className="bg-slate-900 border-b border-slate-800 text-[11px] py-1.5 px-4 text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-medium text-slate-300">Niamey Express Direct :</span>
            <span>Garantie 0% publicité · Profils certifiés · Cryptage de bout en bout</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Propriétaire :</span>
              <a
                href="tel:+22799614098"
                className="font-mono text-amber-400 hover:text-amber-300 font-semibold"
              >
                +227 99 61 40 98
              </a>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5">
              <Globe className="w-3 h-3 text-slate-400" />
              <button
                onClick={() => setLang('fr')}
                className={`px-1 py-0.5 rounded text-[10px] font-bold ${lang === 'fr' ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}
              >
                FR
              </button>
              <span className="text-slate-700">·</span>
              <button
                onClick={() => setLang('ha')}
                className={`px-1 py-0.5 rounded text-[10px] font-bold ${lang === 'ha' ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}
              >
                HA
              </button>
              <span className="text-slate-700">·</span>
              <button
                onClick={() => setLang('dz')}
                className={`px-1 py-0.5 rounded text-[10px] font-bold ${lang === 'dz' ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}
              >
                DZ
              </button>
              <span className="text-slate-700">·</span>
              <button
                onClick={() => setLang('en')}
                className={`px-1 py-0.5 rounded text-[10px] font-bold ${lang === 'en' ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Order Received Notification Banner for Admin / Owner */}
      {liveAlertOrder && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/50 px-4 py-2.5 text-xs text-white flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top duration-200 sticky top-0 z-50">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-extrabold text-emerald-300">NOUVELLE COMMANDE REÇUE :</span>
            <span className="font-mono text-amber-400 font-bold">{liveAlertOrder.orderNumber}</span>
            <span className="hidden sm:inline text-slate-300">
              · {liveAlertOrder.pickup.districtName} ➔ {liveAlertOrder.dropoff.districtName} ({liveAlertOrder.pricing.totalFcfa.toLocaleString()} FCFA)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={formatOrderWhatsAppUrl(liveAlertOrder, '22799614098')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-lg flex items-center gap-1 shadow-sm transition-colors"
            >
              <span>Transmettre sur WhatsApp (+227 99 61 40 98)</span>
            </a>
            <button
              onClick={() => {
                setActiveView('ADMIN');
                setLiveAlertOrder(null);
              }}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              Gérer dans Dashboard
            </button>
            <button
              onClick={() => setLiveAlertOrder(null)}
              className="text-slate-400 hover:text-white px-2 py-1 text-sm font-bold"
              title="Fermer notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Bar Contract (Zone 1: Brand, Zone 2: Nav Links, Zone 3: 1 Primary CTA) */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-950/95 sticky top-0 z-40 backdrop-blur-md">
        {/* Zone 1: Single text wordmark */}
        <div 
          onClick={() => setActiveView('CLIENT')}
          className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <span className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-base shadow-sm">
            🦅
          </span>
          <span>Faucon Express</span>
        </div>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <button
            onClick={() => setActiveView('CLIENT')}
            className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'CLIENT' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            {t.newDelivery}
          </button>
          <button
            onClick={() => setActiveView('CLIENT')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            {t.tracking}
          </button>
          <button
            onClick={() => setActiveView('DRIVER')}
            className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'DRIVER' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            {t.driverApp}
          </button>
          <button
            onClick={() => setActiveView('ADMIN')}
            className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'ADMIN' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            {t.adminDashboard}
          </button>
        </nav>

        {/* Zone 3: Action CTAs */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://wa.me/22799614098?text=Bonjour%20M.%20Abdoulkader,%20je%20vous%20contacte%20concernant%20Faucon%20Express."
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0 shadow-sm flex items-center gap-1.5"
            title="WhatsApp direct avec le propriétaire"
          >
            <span>💬</span>
            <span className="hidden sm:inline">WhatsApp</span>
            <span className="font-mono text-[11px]">+227 99 61 40 98</span>
          </a>
          <button
            onClick={() => handleOpenChat()}
            className="px-3 py-2 text-xs font-bold text-slate-950 bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 shadow-sm flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Chat</span>
          </button>
        </div>
      </header>

      {/* Hero Showcase (Visible on Client Home View) */}
      {activeView === 'CLIENT' && (
        <div className="relative border-b border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left text column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Réseau Logistique Officiel Niamey & Traversée Fleuve Niger</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight" style={{ textWrap: 'balance' }}>
                Livraison Ultra-Rapide, Suivi en Temps Réel & Discrétion Absolue.
              </h1>

              <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
                Plateau, Harobanda, Koira Kano, Yantala, Talladjé, Wadata, Boukoki. Vos colis acheminés en moto certifiée avec paiement sécurisé <strong>MY Nita</strong>, <strong>Amanata</strong> ou espèces. Zéro publicité et suivi GPS direct.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Profils Vérifiés Anti-Fraude</span>
                </div>
                <span className="text-slate-700">·</span>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Navigation className="w-4 h-4 text-amber-400" />
                  <span>Trajet Fleuve Niger Optimisé</span>
                </div>
                <span className="text-slate-700">·</span>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Ligne Directe +227 99 61 40 98</span>
                </div>
              </div>
            </div>

            {/* Right Hero Tactical Status Card (Zero Photos, 100% Vector & Telemetry) */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl p-6 bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
                      🦅
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm">Poste Central Niamey</h3>
                      <p className="text-[11px] text-slate-400">Plateau · Ligne +227 99 61 40 98</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En Service 24/7
                  </span>
                </div>

                {/* Key Dispatch Metrics */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Prise en charge</div>
                    <div className="text-base font-extrabold text-amber-400 font-mono mt-0.5">~10-15 min</div>
                    <div className="text-[10px] text-slate-500">Motos disponibles</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Pont Kennedy</div>
                    <div className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">Fluide</div>
                    <div className="text-[10px] text-slate-500">Liaison Rive Droite</div>
                  </div>
                </div>

                {/* Security and direct line strip */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span>Paiements certifiés</span>
                    <span className="font-semibold text-amber-400">MY Nita · Amanata · Cash</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Confidentialité</span>
                    <span className="text-emerald-400 font-mono">100% Chiffré & Sans Pub</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Superviseur</span>
                    <span className="text-slate-200 font-medium">Abdoulkader Alio</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Switcher Toolbar (Below Header) */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>{t.changeRole}</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveView('CLIENT')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  activeView === 'CLIENT'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Client & Suivi GPS
              </button>
              <button
                onClick={() => setActiveView('DRIVER')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  activeView === 'DRIVER'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Application Livreur (Hors-Ligne)
              </button>
              <button
                onClick={() => setActiveView('ADMIN')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  activeView === 'ADMIN'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tableau Propriétaire (+227 99 61 40 98)
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            N° Commande auto-généré · SMS automatique à chaque étape
          </div>
        </div>
      </div>

      {/* Main View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeView === 'CLIENT' && (
          <CustomerPortal
            orders={orders}
            onOrderCreated={handleOrderCreated}
            onOpenChat={handleOpenChat}
            lang={lang}
          />
        )}

        {activeView === 'DRIVER' && (
          <DriverApp
            orders={orders}
            drivers={drivers}
            onOrderUpdated={handleOrderUpdated}
            onOpenChat={handleOpenChat}
            onDriversUpdated={setDrivers}
            lang={lang}
          />
        )}

        {activeView === 'ADMIN' && (
          <AdminDashboard
            orders={orders}
            drivers={drivers}
            stock={stock}
            transactions={transactions}
            settings={settings}
            onOrderUpdated={handleOrderUpdated}
            onStockUpdated={setStock}
            onDriversUpdated={setDrivers}
            onTransactionsUpdated={setTransactions}
            onOrdersUpdated={setOrders}
            onSettingsUpdated={setSettings}
            onOpenChat={handleOpenChat}
            lang={lang}
          />
        )}
      </main>

      {/* Integrated Live Chat Modal */}
      <IntegratedChatModal
        order={chatOrder}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUserRole={activeView === 'ADMIN' ? 'OWNER_ADMIN' : activeView === 'DRIVER' ? 'DRIVER' : 'CLIENT'}
      />

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-slate-300 font-semibold flex items-center gap-2">
              <span>Faucon Express Niamey</span>
              <span>·</span>
              <span className="text-amber-400 font-mono">+227 99 61 40 98</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Service certifié de livraison express à Niamey · Paiements sécurisés MY Nita & Amanata · Plateau, Niger.
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>100% Sans Publicité</span>
            <span>·</span>
            <span>Chiffrement E2E</span>
            <span>·</span>
            <span>Direction: Abdoulkader Alio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
