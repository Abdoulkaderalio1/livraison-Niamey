import React, { useState, useEffect } from 'react';
import { 
  Wifi, WifiOff, RefreshCw, Navigation, Phone, 
  CheckCircle2, Clock, MapPin, AlertCircle, 
  Smartphone, ShieldCheck, ChevronRight, Award, 
  TrendingUp, Sparkles, Send, MessageSquare 
} from 'lucide-react';
import { OrderItem, Driver, Language } from '../types';
import { StorageService } from '../services/storageService';
import { NiameyInteractiveMap } from './NiameyInteractiveMap';
import { TRANSLATIONS } from '../data/translations';

interface DriverAppProps {
  orders: OrderItem[];
  onOrderUpdated: (order: OrderItem) => void;
  onOpenChat: (order: OrderItem) => void;
  lang: Language;
}

export const DriverApp: React.FC<DriverAppProps> = ({
  orders,
  onOrderUpdated,
  onOpenChat,
  lang
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  // Active driver simulation (Moussa Ibrahim)
  const drivers = StorageService.getDrivers();
  const currentDriver = drivers[0];

  // Offline mode state
  const [isOffline, setIsOffline] = useState<boolean>(() => StorageService.isOffline());
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(() => StorageService.getOfflineQueue().length);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    const active = orders.find(o => o.delivery.status !== 'DELIVERED' && o.delivery.status !== 'CANCELLED');
    return active ? active.id : (orders[0]?.id || '');
  });

  const [otpInput, setOtpInput] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isSimulatingGpsMove, setIsSimulatingGpsMove] = useState(false);
  const [viewMode, setViewMode] = useState<'MOBILE_FRAME' | 'FULL_WIDTH'>('MOBILE_FRAME');

  // Active assigned course
  const currentOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  const toggleOfflineMode = () => {
    const nextState = !isOffline;
    setIsOffline(nextState);
    StorageService.setOffline(nextState);

    if (!nextState) {
      // Sync pending queue
      const syncedCount = StorageService.syncOfflineQueue();
      setPendingQueueCount(0);
      if (syncedCount > 0) {
        alert(`Connexion rétablie ! ${syncedCount} action(s) synchronisée(s) avec le serveur central Faucon Express.`);
      }
    }
  };

  const handleUpdateStatus = (newStatus: OrderItem['delivery']['status']) => {
    if (!currentOrder) return;

    if (isOffline) {
      // Enqueue offline action
      StorageService.enqueueOfflineAction('UPDATE_ORDER_STATUS', {
        orderId: currentOrder.id,
        status: newStatus
      });
      setPendingQueueCount(prev => prev + 1);

      // Optimistic local update
      const updated = {
        ...currentOrder,
        delivery: {
          ...currentOrder.delivery,
          status: newStatus
        }
      };
      onOrderUpdated(updated as OrderItem);
      alert(`[Mode Hors-Ligne] Changement de statut enregistré localement. Sera transmis dès le retour de connexion.`);
      return;
    }

    const updated = StorageService.updateOrderStatus(currentOrder.id, newStatus);
    if (updated) {
      onOrderUpdated(updated);
    }
  };

  const handleValidateDeliveryWithOtp = () => {
    if (!currentOrder) return;
    if (otpInput.trim() !== currentOrder.delivery.deliveryOtp) {
      alert(`Code OTP incorrect ! Demandez au client le code à 4 chiffres (Simulation test: ${currentOrder.delivery.deliveryOtp}).`);
      return;
    }

    handleUpdateStatus('DELIVERED');
    setShowOtpModal(false);
    setOtpInput('');
    alert(`🎉 Félicitations ! Livraison ${currentOrder.orderNumber} validée et clôturée avec succès.`);
  };

  // Simulate GPS progression on Niamey map
  const simulateLiveCourse = () => {
    if (!currentOrder || isSimulatingGpsMove) return;
    setIsSimulatingGpsMove(true);

    let progress = currentOrder.delivery.progressPercent || 30;
    const interval = setInterval(() => {
      progress += 15;
      if (progress >= 95) {
        clearInterval(interval);
        setIsSimulatingGpsMove(false);
        handleUpdateStatus('ARRIVED');
      } else {
        const updated = StorageService.updateOrderStatus(currentOrder.id, 'IN_TRANSIT', {
          progressPercent: progress,
          estimatedMinutes: Math.max(1, Math.round((100 - progress) / 5))
        });
        if (updated) onOrderUpdated(updated);
      }
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Driver Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={currentDriver.photoUrl}
              alt={currentDriver.name}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover border-2 border-amber-500"
            />
            <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
              isOffline ? 'bg-rose-500' : 'bg-emerald-500'
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm">{currentDriver.name}</h3>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                {currentDriver.licensePlate}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>{currentDriver.vehicle}</span>
              <span>·</span>
              <span className="text-amber-400">★ {currentDriver.rating}</span>
              <span>·</span>
              <span>{currentDriver.completedDeliveries} courses</span>
            </div>
          </div>
        </div>

        {/* Mode Hors-Ligne & Device View Toggle */}
        <div className="flex items-center gap-3">
          {/* Offline Switcher */}
          <button
            onClick={toggleOfflineMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isOffline
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
            }`}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-4 h-4 text-rose-400" />
                <span>Mode Hors-Ligne ACTIF</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span>Connecté (En Ligne)</span>
              </>
            )}
          </button>

          {/* Sync status badge if queue > 0 */}
          {pendingQueueCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{pendingQueueCount} en attente</span>
            </div>
          )}

          {/* Mobile frame vs full width toggle */}
          <button
            onClick={() => setViewMode(v => v === 'MOBILE_FRAME' ? 'FULL_WIDTH' : 'MOBILE_FRAME')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>{viewMode === 'MOBILE_FRAME' ? 'Vue Plein Écran' : 'Vue Smartphone'}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className={`mx-auto ${viewMode === 'MOBILE_FRAME' ? 'max-w-md' : 'w-full'}`}>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Phone Top Notch Bar */}
          <div className="bg-slate-950 px-6 py-2 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono">Faucon Rider Niamey</span>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">GPS: Actif</span>
              <span>·</span>
              <span className="font-mono text-slate-300">92%</span>
            </div>
          </div>

          {/* Daily Earnings Strip */}
          <div className="bg-slate-950/70 p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">Gains du jour (Commissions)</div>
              <div className="text-lg font-extrabold text-amber-400 font-mono">
                {currentDriver.earningsTodayFcfa} <span className="text-xs font-normal text-slate-400">FCFA</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400">Courses accomplies</div>
              <div className="text-sm font-bold text-slate-200">
                4 / 5 prévues
              </div>
            </div>
          </div>

          {/* Active Course Card */}
          {currentOrder ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400">{currentOrder.orderNumber}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-semibold">
                    {currentOrder.delivery.status}
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {currentOrder.pricing.driverCommissionFcfa} FCFA net
                </span>
              </div>

              {/* Itinerary Optimization Guidance */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Optimisation d'Itinéraire Niamey :</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Empruntez le <strong>Pont Kennedy</strong> puis la Corniche Gamkallé pour éviter les ralentissements du Rond-point Gadafawa.
                </p>
              </div>

              {/* Waypoints: Pickup -> Dropoff */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3 text-xs">
                {/* Pickup */}
                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Ramassage</div>
                    <div className="font-semibold text-slate-200">{currentOrder.pickup.districtName}</div>
                    <div className="text-[11px] text-slate-400">{currentOrder.pickup.addressDetail}</div>
                    <a href={`tel:${currentOrder.pickup.contactPhone}`} className="text-amber-400 text-[11px] hover:underline font-mono">
                      📞 {currentOrder.pickup.contactPhone}
                    </a>
                  </div>
                </div>

                <div className="ml-1 pl-2 border-l border-slate-800 py-1 text-[11px] text-slate-400">
                  Distance estimée: ~4.2 km · Traversée Rive Droite
                </div>

                {/* Dropoff */}
                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Livraison</div>
                    <div className="font-semibold text-slate-200">{currentOrder.dropoff.districtName}</div>
                    <div className="text-[11px] text-slate-400">{currentOrder.dropoff.addressDetail}</div>
                    <div className="text-slate-300 font-medium">Destinataire: {currentOrder.dropoff.recipientName}</div>
                    <a href={`tel:${currentOrder.dropoff.recipientPhone}`} className="text-emerald-400 text-[11px] hover:underline font-mono">
                      📞 {currentOrder.dropoff.recipientPhone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Map Preview */}
              <div className="rounded-xl overflow-hidden border border-slate-800">
                <NiameyInteractiveMap activeOrder={currentOrder} mode="TRACKING" />
              </div>

              {/* Action Buttons based on status */}
              <div className="space-y-2 pt-1">
                {currentOrder.delivery.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleUpdateStatus('PICKED_UP')}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg"
                  >
                    1. Confirmer la récupération du colis
                  </button>
                )}

                {currentOrder.delivery.status === 'PICKED_UP' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleUpdateStatus('IN_TRANSIT')}
                      className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg"
                    >
                      2. Démarrer acheminement (En Vol)
                    </button>
                    <button
                      onClick={simulateLiveCourse}
                      disabled={isSimulatingGpsMove}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-medium rounded-xl text-xs transition-colors"
                    >
                      {isSimulatingGpsMove ? '⚡ Simulation GPS en cours...' : '⚡ Lancer simulation trajet moto'}
                    </button>
                  </div>
                )}

                {currentOrder.delivery.status === 'IN_TRANSIT' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleUpdateStatus('ARRIVED')}
                      className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg"
                    >
                      3. Signaler : Je suis arrivé sur place
                    </button>
                    <button
                      onClick={simulateLiveCourse}
                      disabled={isSimulatingGpsMove}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-medium rounded-xl text-xs transition-colors"
                    >
                      {isSimulatingGpsMove ? '⚡ Avancement automatique...' : '⚡ Simuler avancement GPS'}
                    </button>
                  </div>
                )}

                {currentOrder.delivery.status === 'ARRIVED' && (
                  <button
                    onClick={() => setShowOtpModal(true)}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg animate-pulse"
                  >
                    4. Valider livraison avec Code OTP Client
                  </button>
                )}

                {currentOrder.delivery.status === 'DELIVERED' && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs text-emerald-400 font-bold">
                    ✓ Course livrée et encaissée avec succès
                  </div>
                )}

                {/* Direct contact with customer & Owner */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onOpenChat(currentOrder)}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Chat Client</span>
                  </button>
                  <a
                    href="tel:+22799614098"
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Propriétaire (+227)</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Aucune course active en cours. En attente de dispatch central.
            </div>
          )}
        </div>
      </div>

      {/* OTP Validation Modal */}
      {showOtpModal && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-100 text-sm">Validation Sécurisée OTP</h4>
              <button onClick={() => setShowOtpModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-300">
              Demandez au destinataire son code de confirmation à 4 chiffres envoyé par SMS :
            </p>
            <div className="text-[11px] text-amber-400 font-mono bg-amber-500/10 p-2 rounded border border-amber-500/20">
              Indice démo / test : Le code OTP de ce client est <strong>{currentOrder.delivery.deliveryOtp}</strong>
            </div>
            <input
              type="text"
              maxLength={4}
              value={otpInput}
              onChange={e => setOtpInput(e.target.value)}
              placeholder="0000"
              className="w-full text-center text-2xl font-mono tracking-widest bg-slate-950 border border-slate-700 rounded-xl py-3 text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={handleValidateDeliveryWithOtp}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
            >
              Confirmer la remise du colis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
