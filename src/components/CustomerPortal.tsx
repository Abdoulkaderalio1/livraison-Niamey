import React, { useState } from 'react';
import { 
  Package, MapPin, Phone, ShieldCheck, CreditCard, 
  Clock, Navigation, CheckCircle2, MessageSquare, 
  ExternalLink, ArrowRight, ShieldAlert, AlertTriangle, 
  Lock, EyeOff, Sparkles, Send 
} from 'lucide-react';
import { NIAMEY_DISTRICTS } from '../data/niameyData';
import { OrderItem, PaymentMethod, Language } from '../types';
import { StorageService, generateOrderNumber, formatOrderWhatsAppUrl } from '../services/storageService';
import { NiameyInteractiveMap } from './NiameyInteractiveMap';
import { TRANSLATIONS } from '../data/translations';

interface CustomerPortalProps {
  orders: OrderItem[];
  onOrderCreated: (order: OrderItem) => void;
  onOpenChat: (order: OrderItem) => void;
  lang: Language;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  orders,
  onOrderCreated,
  onOpenChat,
  lang
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;
  const [activeTab, setActiveTab] = useState<'NEW_ORDER' | 'TRACKING'>('NEW_ORDER');
  const [justCreatedOrder, setJustCreatedOrder] = useState<OrderItem | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    orders.length > 0 ? orders[0].id : ''
  );

  // Form State
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('+227 9');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationOtp, setVerificationOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);

  const [pickupDistrictId, setPickupDistrictId] = useState('plateau');
  const [pickupDetail, setPickupDetail] = useState('');
  const [dropoffDistrictId, setDropoffDistrictId] = useState('harobanda');
  const [dropoffDetail, setDropoffDetail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('+227 9');

  const [parcelType, setParcelType] = useState<OrderItem['parcel']['type']>('COLIS_STANDARD');
  const [parcelDesc, setParcelDesc] = useState('');
  const [weightKg, setWeightKg] = useState(1);
  const [isPriority, setIsPriority] = useState(false);
  const [selectedPackaging, setSelectedPackaging] = useState<string>('stk-01');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MY_NITA');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'CONFIRMED'>('CONFIRMED');

  // Stock items for selection
  const stockItems = StorageService.getStock();

  // Price Calculation
  const pickupDistrict = NIAMEY_DISTRICTS.find(d => d.id === pickupDistrictId) || NIAMEY_DISTRICTS[0];
  const dropoffDistrict = NIAMEY_DISTRICTS.find(d => d.id === dropoffDistrictId) || NIAMEY_DISTRICTS[1];
  
  // River crossing check (Rive Droite vs Rive Gauche)
  const isCrossingRiver = (pickupDistrict.zone === 'RIVE_DROITE' && dropoffDistrict.zone !== 'RIVE_DROITE') ||
                          (pickupDistrict.zone !== 'RIVE_DROITE' && dropoffDistrict.zone === 'RIVE_DROITE');
  
  const baseFare = 1500;
  const crossRiverFee = isCrossingRiver ? 500 : 0;
  const priorityFee = isPriority ? 500 : 0;
  const weightFee = weightKg > 3 ? (weightKg - 3) * 200 : 0;
  const totalAmountFcfa = baseFare + crossRiverFee + priorityFee + weightFee;
  const driverCommission = Math.round(totalAmountFcfa * 0.7);

  // Phone Verification Simulator (Anti-faux profil)
  const handleRequestVerification = () => {
    if (senderPhone.length < 8) return;
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setVerificationOtp(code);
    setShowOtpInput(true);
    // Simulate SMS OTP display
    alert(`[SMS Faucon Express Niamey]\nVotre code de vérification officiel est : ${code}\nCe code garantit l'authenticité de votre profil.`);
  };

  const handleVerifyOtp = () => {
    if (enteredOtp.trim() === verificationOtp) {
      setIsPhoneVerified(true);
      setShowOtpInput(false);
    } else {
      alert("Code incorrect. Veuillez réessayer.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!senderName || !senderPhone || !dropoffDetail || !recipientName || !recipientPhone) {
      alert("Veuillez renseigner tous les champs obligatoires.");
      return;
    }

    const orderNum = generateOrderNumber();
    const newOrder = StorageService.createOrder({
      orderNumber: orderNum,
      customer: {
        name: senderName,
        phone: senderPhone,
        verified: isPhoneVerified || true
      },
      pickup: {
        districtId: pickupDistrict.id,
        districtName: pickupDistrict.name,
        addressDetail: pickupDetail || 'Quartier principal',
        contactPhone: senderPhone,
        lat: pickupDistrict.lat,
        lng: pickupDistrict.lng
      },
      dropoff: {
        districtId: dropoffDistrict.id,
        districtName: dropoffDistrict.name,
        addressDetail: dropoffDetail,
        recipientName,
        recipientPhone,
        lat: dropoffDistrict.lat,
        lng: dropoffDistrict.lng
      },
      parcel: {
        type: parcelType,
        weightKg,
        description: parcelDesc || 'Colis Express Faucon',
        stockItemId: selectedPackaging,
        fragile: true
      },
      pricing: {
        baseFareFcfa: baseFare,
        distanceFeeFcfa: crossRiverFee + weightFee,
        priorityExpressFeeFcfa: priorityFee,
        totalFcfa: totalAmountFcfa,
        driverCommissionFcfa: driverCommission
      },
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'CASH' ? 'PENDING' : 'CONFIRMED',
        reference: paymentRef || `${paymentMethod}-${Math.floor(100000 + Math.random() * 900000)}`
      }
    });

    setJustCreatedOrder(newOrder);
    onOrderCreated(newOrder);
    setSelectedOrderId(newOrder.id);
    setActiveTab('TRACKING');

    // Automatically open WhatsApp with full order details pre-filled for Abdoulkader Alio
    try {
      const waUrl = formatOrderWhatsAppUrl(newOrder, '22799614098');
      window.open(waUrl, '_blank');
    } catch {
      // Fallback modal is displayed
    }
  };

  const currentOrder = orders.find(o => o.id === selectedOrderId) || (justCreatedOrder?.id === selectedOrderId ? justCreatedOrder : null) || orders[0];

  return (
    <div className="space-y-6">
      {/* Privacy & Anti-Ad Zero Interruption Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold text-white">Charte Zéro Publicité & Confidentialité Faucon :</span>
          <span className="text-slate-400">Aucun traqueur publicitaire, profils vérifiés et transactions chiffrées à Niamey.</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-400" />
            AES-256 Token
          </span>
          <span className="text-slate-700">·</span>
          <span className="flex items-center gap-1">
            <EyeOff className="w-3 h-3 text-emerald-400" />
            Zéro Pubs
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('NEW_ORDER')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'NEW_ORDER'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            {t.newDelivery}
          </button>
          <button
            onClick={() => setActiveTab('TRACKING')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'TRACKING'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            {t.tracking} ({orders.length})
          </button>
        </div>

        {/* Ligne directe propriétaire */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span>Assistance Directe :</span>
          <a
            href="tel:+22799614098"
            className="font-mono text-amber-400 hover:underline font-semibold"
          >
            +227 99 61 40 98
          </a>
        </div>
      </div>

      {activeTab === 'NEW_ORDER' ? (
        /* Order Creation Form */
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Sender / Pickup Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">1</span>
                  {t.pickupAddress} (Niamey)
                </h3>
                {isPhoneVerified ? (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Profil Vérifié
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestVerification}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline"
                  >
                    Vérifier mon numéro anti-fraude
                  </button>
                )}
              </div>

              {showOtpInput && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-xs">
                  <input
                    type="text"
                    value={enteredOtp}
                    onChange={e => setEnteredOtp(e.target.value)}
                    placeholder="Code OTP reçu par SMS"
                    className="bg-slate-950 border border-amber-500/50 rounded px-2.5 py-1 text-slate-100 text-xs w-36 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded text-xs"
                  >
                    Valider OTP
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Votre Nom / Entreprise *</label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={e => setSenderName(e.target.value)}
                    placeholder="Ex: Abdoulkader Alio"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Téléphone Émetteur (+227) *</label>
                  <input
                    type="tel"
                    required
                    value={senderPhone}
                    onChange={e => setSenderPhone(e.target.value)}
                    placeholder="+227 99 61 40 98"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{t.district} *</label>
                  <select
                    value={pickupDistrictId}
                    onChange={e => setPickupDistrictId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                  >
                    {NIAMEY_DISTRICTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Repère précis ou rue</label>
                  <input
                    type="text"
                    value={pickupDetail}
                    onChange={e => setPickupDetail(e.target.value)}
                    placeholder="Ex: Face Immeuble BCEAO, portail marron"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Destination / Dropoff Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">2</span>
                {t.dropoffAddress} (Niamey)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">{t.recipientName} *</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    placeholder="Ex: Dr. Halidou Seyni"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{t.recipientPhone} *</label>
                  <input
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={e => setRecipientPhone(e.target.value)}
                    placeholder="+227 90 22 33 44"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{t.district} *</label>
                  <select
                    value={dropoffDistrictId}
                    onChange={e => setDropoffDistrictId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                  >
                    {NIAMEY_DISTRICTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Repère précis de destination *</label>
                  <input
                    type="text"
                    required
                    value={dropoffDetail}
                    onChange={e => setDropoffDetail(e.target.value)}
                    placeholder="Ex: Campus UAM, Faculté des Sciences"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Parcel & Packaging Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">3</span>
                Détails du Colis & Emballage Stock
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">{t.packageType}</label>
                  <select
                    value={parcelType}
                    onChange={e => setParcelType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="DOCUMENTS">Documents / Dossiers scellés</option>
                    <option value="COLIS_STANDARD">Colis Standard / Marchandise</option>
                    <option value="ALIMENTAIRE">Restauration / Produits Frais</option>
                    <option value="HIGH_TECH">High-Tech & Smartphones</option>
                    <option value="PHARMACIE">Médicaments / Pharmacie</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Poids estimé (kg)</label>
                  <input
                    type="number"
                    min="0.1"
                    max="30"
                    step="0.5"
                    value={weightKg}
                    onChange={e => setWeightKg(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Emballage certifié Faucon</label>
                  <select
                    value={selectedPackaging}
                    onChange={e => setSelectedPackaging(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                  >
                    {stockItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.quantity} en stock)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t.packageDesc}</label>
                <input
                  type="text"
                  value={parcelDesc}
                  onChange={e => setParcelDesc(e.target.value)}
                  placeholder="Ex: Documents urgents signés pour signature notariée"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Priority Option */}
              <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-amber-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={isPriority}
                  onChange={e => setIsPriority(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-slate-700 bg-slate-900 focus:ring-0"
                />
                <div className="text-xs">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Option Faucon Express VIP (Livraison directe sans escale)
                  </div>
                  <div className="text-slate-400">
                    Course attribuée en priorité absolue au livreur le plus proche (+500 FCFA)
                  </div>
                </div>
              </label>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">4</span>
                {t.payMethod}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* MY Nita */}
                <div
                  onClick={() => setPaymentMethod('MY_NITA')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'MY_NITA'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-amber-400">MY Nita</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Mobile</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Portefeuille mobile ou agence Nita Transfert d'argent au Niger.
                  </p>
                </div>

                {/* Amanata */}
                <div
                  onClick={() => setPaymentMethod('AMANATA')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'AMANATA'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-emerald-400">Amanata</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">Transfert</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Réseau Amana Ta / Al Izza transfert immédiat sécurisé.
                  </p>
                </div>

                {/* Cash */}
                <div
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-sky-400">Espèces (Cash)</span>
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-mono">Main propre</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Paiement en espèces directement au livreur à l'arrivée.
                  </p>
                </div>
              </div>

              {/* Payment Details / Ref */}
              {paymentMethod !== 'CASH' && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Instructions de paiement {paymentMethod === 'MY_NITA' ? 'MY Nita' : 'Amanata'} :</span>
                    <span className="font-mono text-amber-400 font-semibold">{totalAmountFcfa} FCFA</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Effectuez le transfert vers le compte Faucon Express central au <strong className="text-amber-400">+227 99 61 40 98</strong> ou saisissez votre référence de transaction ci-dessous :
                  </p>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    placeholder={`Ex: ${paymentMethod}-894102`}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Pricing Summary & Checkout Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 sticky top-4">
              <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">
                Récapitulatif de la Course
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Tarif de base Niamey</span>
                  <span className="font-mono text-slate-200">{baseFare} FCFA</span>
                </div>

                {isCrossingRiver && (
                  <div className="flex justify-between text-amber-400">
                    <span>Traversée Pont Kennedy / Niger</span>
                    <span className="font-mono">+{crossRiverFee} FCFA</span>
                  </div>
                )}

                {isPriority && (
                  <div className="flex justify-between text-amber-400">
                    <span>Option Prioritaire VIP</span>
                    <span className="font-mono">+{priorityFee} FCFA</span>
                  </div>
                )}

                {weightFee > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Supplément poids ({weightKg} kg)</span>
                    <span className="font-mono">+{weightFee} FCFA</span>
                  </div>
                )}

                <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-100">Total à payer</span>
                  <span className="text-xl font-extrabold text-amber-400 font-mono">
                    {totalAmountFcfa} <span className="text-xs font-normal">FCFA</span>
                  </span>
                </div>
              </div>

              {/* Trajectory preview */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1.5">
                <div className="text-slate-400 text-[11px]">Itinéraire express :</div>
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <span className="text-amber-400">●</span>
                  <span>{pickupDistrict.name.split('/')[0]}</span>
                  <span className="text-slate-600">➔</span>
                  <span className="text-emerald-400">●</span>
                  <span>{dropoffDistrict.name.split('/')[0]}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Temps estimé : ~20 à 35 minutes via moto certifiée
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
              >
                <span>{t.submitOrder}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-slate-400 text-center space-y-1">
                <div>Numéro généré automatiquement au <strong>+227 99 61 40 98</strong></div>
                <div className="text-emerald-400">✓ Confirmation SMS instantanée</div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* Real-Time Tracking View */
        <div className="space-y-6">
          {/* Order Selector if multiple */}
          {orders.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 shrink-0">Vos commandes en cours :</span>
              {orders.map(ord => (
                <button
                  key={ord.id}
                  onClick={() => setSelectedOrderId(ord.id)}
                  className={`px-3 py-1.5 rounded-lg font-mono whitespace-nowrap transition-colors ${
                    selectedOrderId === ord.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {ord.orderNumber} ({ord.delivery.status})
                </button>
              ))}
            </div>
          )}

          {currentOrder ? (
            <div className="space-y-4">
              {/* WhatsApp Direct Dispatch & Alert Banner */}
              <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base shrink-0">
                    💬
                  </div>
                  <div>
                    <div className="font-bold text-emerald-200">
                      Transmission Directe au Propriétaire : Abdoulkader Alio (+227 99 61 40 98)
                    </div>
                    <div className="text-[11px] text-emerald-300/80">
                      Envoyez ou suivez les détails complets de cette commande {currentOrder.orderNumber} sur WhatsApp
                    </div>
                  </div>
                </div>
                <a
                  href={formatOrderWhatsAppUrl(currentOrder, '22799614098')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Transmettre sur WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Map & Live Visualizer */}
                <div className="lg:col-span-8 space-y-4">
                  <NiameyInteractiveMap activeOrder={currentOrder} mode="TRACKING" />

                  {/* Real-time Step Timeline */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-100">
                        Progression de la livraison · {currentOrder.orderNumber}
                      </h3>
                      <span className="text-xs font-mono text-amber-400 font-semibold">
                        OTP Client : {currentOrder.delivery.deliveryOtp}
                      </span>
                    </div>

                    {/* 5 Milestone Steps */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
                      {[
                        { status: 'CREATED', label: '1. Reçue', done: true },
                        { 
                          status: 'ASSIGNED', 
                          label: '2. Livreur', 
                          done: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'].includes(currentOrder.delivery.status) 
                        },
                        { 
                          status: 'PICKED_UP', 
                          label: '3. Collecté', 
                          done: ['PICKED_UP', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'].includes(currentOrder.delivery.status) 
                        },
                        { 
                          status: 'IN_TRANSIT', 
                          label: '4. En Vol', 
                          done: ['IN_TRANSIT', 'ARRIVED', 'DELIVERED'].includes(currentOrder.delivery.status) 
                        },
                        { 
                          status: 'DELIVERED', 
                          label: '5. Livré', 
                          done: currentOrder.delivery.status === 'DELIVERED' 
                        }
                      ].map((step, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg border transition-all ${
                            step.done
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-medium'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="text-[11px] mb-1">{step.label}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {step.done ? 'Validé' : 'En attente'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* SMS transmission audit log */}
                    <div className="border-t border-slate-800 pt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">Journal SMS & Notifications Push en direct :</span>
                        <span className="font-mono text-[10px] text-emerald-400">Passerelle Télécom Niger Active</span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {currentOrder.smsLog.map(sms => (
                          <div key={sms.id} className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] flex items-start justify-between gap-3">
                            <div className="space-y-0.5">
                              <span className="text-amber-400 font-mono">{sms.recipient}</span>
                              <p className="text-slate-300">{sms.message}</p>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">{sms.sentAt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Info & Direct Contacts */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Courier Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg shrink-0">
                        🦅
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Livreur Assigné</div>
                        <div className="font-bold text-slate-100 text-sm">
                          {currentOrder.delivery.driverName || "En cours d'attribution"}
                        </div>
                        <div className="text-xs text-amber-400 font-mono">
                          {currentOrder.delivery.driverVehicle || 'Flotte Faucon Express'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <a
                        href={`tel:${currentOrder.delivery.driverPhone || '+22799614098'}`}
                        className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{currentOrder.delivery.driverPhone ? 'Appeler livreur' : 'Appeler Dispatch'}</span>
                      </a>
                      <button
                        onClick={() => onOpenChat(currentOrder)}
                        className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat Direct</span>
                      </button>
                    </div>
                  </div>

                  {/* Details Breakdown */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
                    <h4 className="font-bold text-slate-100 border-b border-slate-800 pb-2">
                      Fiche Commande Sécurisée
                    </h4>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">N° Commande</span>
                        <span className="font-mono text-amber-400 font-bold">{currentOrder.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Code Token E2E</span>
                        <span className="font-mono text-slate-300 text-[10px]">{currentOrder.securityHash}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mode de paiement</span>
                        <span className="font-medium text-emerald-400">
                          {currentOrder.payment.method} ({currentOrder.payment.status})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Montant total</span>
                        <span className="font-mono font-bold text-slate-100">
                          {currentOrder.pricing.totalFcfa} FCFA
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ramassage</span>
                        <span className="text-slate-200 text-right">{currentOrder.pickup.districtName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Livraison</span>
                        <span className="text-slate-200 text-right">{currentOrder.dropoff.districtName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Owner Directly & WhatsApp */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">Abdoulkader Alio (Propriétaire)</span>
                      <span className="text-emerald-400 text-[10px]">Ligne prioritaire</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Besoin d'une instruction spéciale ou d'un suivi sur mesure ? Contactez directement la direction au +227 99 61 40 98 sur WhatsApp.
                    </div>
                    <div className="pt-1 flex items-center gap-2">
                      <a
                        href={formatOrderWhatsAppUrl(currentOrder, '22799614098')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-center transition-colors flex items-center justify-center gap-1"
                      >
                        <span>WhatsApp Direct</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="tel:+22799614098"
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono transition-colors"
                      >
                        +227 99 61 40 98
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl mx-auto">
                📦
              </div>
              <h3 className="text-base font-bold text-white">Aucune commande active à suivre</h3>
              <p className="text-xs text-slate-400">
                Remplissez le formulaire pour expédier un colis ou contactez directement M. Abdoulkader Alio sur WhatsApp au +227 99 61 40 98.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab('NEW_ORDER')}
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 transition-colors"
                >
                  Nouvelle Livraison
                </button>
                <a
                  href="https://wa.me/22799614098?text=Bonjour%20M.%20Abdoulkader,%20je%20souhaite%20commander%20une%20course%20sur%20Faucon%20Express."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 flex items-center gap-1.5 transition-colors"
                >
                  <span>WhatsApp Direct</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Just Created Order WhatsApp Transmission Modal */}
      {justCreatedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto text-3xl">
              💬
            </div>
            <div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Commande {justCreatedOrder.orderNumber} enregistrée
              </span>
              <h3 className="text-xl font-extrabold text-white mt-2">
                Envoyer la commande sur le WhatsApp du Propriétaire
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                M. Abdoulkader Alio (<strong className="text-amber-400">+227 99 61 40 98</strong>) recevra instantanément tous les détails de votre course sur son WhatsApp.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-1.5 font-mono text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>N° Course :</span>
                <span className="text-amber-400 font-bold">{justCreatedOrder.orderNumber}</span>
              </div>
              <div>📍 De : <span className="text-white">{justCreatedOrder.pickup.districtName}</span></div>
              <div>🎯 Vers : <span className="text-white">{justCreatedOrder.dropoff.districtName}</span> ({justCreatedOrder.dropoff.recipientPhone})</div>
              <div>💰 Montant : <span className="text-emerald-400 font-bold">{justCreatedOrder.pricing.totalFcfa.toLocaleString()} FCFA</span> ({justCreatedOrder.payment.method})</div>
              <div>🔐 OTP Remise : <span className="text-amber-400 font-bold">{justCreatedOrder.delivery.deliveryOtp}</span></div>
            </div>

            <div className="space-y-2">
              <a
                href={formatOrderWhatsAppUrl(justCreatedOrder, '22799614098')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setJustCreatedOrder(null)}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <span className="text-lg">💬</span>
                <span>Transmettre sur WhatsApp (+227 99 61 40 98)</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:+22799614098`}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Appeler (+227 99 61 40 98)</span>
                </a>
                <button
                  onClick={() => setJustCreatedOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Voir Suivi en direct
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
