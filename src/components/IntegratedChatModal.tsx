import React, { useState } from 'react';
import { 
  Send, Phone, MessageSquare, ShieldCheck, X, 
  ExternalLink, UserCheck, CheckCheck 
} from 'lucide-react';
import { ChatMessage, OrderItem } from '../types';
import { StorageService } from '../services/storageService';

interface IntegratedChatModalProps {
  order?: OrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: 'CLIENT' | 'DRIVER' | 'OWNER_ADMIN';
}

export const IntegratedChatModal: React.FC<IntegratedChatModalProps> = ({
  order,
  isOpen,
  onClose,
  currentUserRole
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return StorageService.getChatMessages(order?.orderNumber);
  });
  const [inputVal, setInputVal] = useState('');

  if (!isOpen) return null;

  const orderNum = order?.orderNumber || 'GENERAL';
  const ownerPhone = '+227 99 61 40 98';
  const cleanPhone = '22799614098';

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    let senderName = 'Client';
    if (currentUserRole === 'DRIVER') senderName = order?.delivery.driverName || 'Livreur Faucon';
    if (currentUserRole === 'OWNER_ADMIN') senderName = 'Abdoulkader Alio (Fondateur)';

    const newMsg = StorageService.sendChatMessage({
      orderId: order?.id || 'gen',
      orderNumber: orderNum,
      sender: currentUserRole,
      senderName,
      message: text
    });

    setMessages(prev => [...prev, newMsg]);
    setInputVal('');

    // If client asked something and owner isn't active, simulate automatic acknowledgement after 800ms
    if (currentUserRole === 'CLIENT') {
      setTimeout(() => {
        const autoReply = StorageService.sendChatMessage({
          orderId: order?.id || 'gen',
          orderNumber: orderNum,
          sender: 'OWNER_ADMIN',
          senderName: 'Abdoulkader Alio (Faucon Express)',
          message: `Bien reçu pour la course ${orderNum}. Nous veillons personnellement sur votre livraison à Niamey. Ligne directe : ${ownerPhone}.`
        });
        setMessages(prev => [...prev, autoReply]);
      }, 1000);
    }
  };

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Bonjour M. Abdoulkader Alio (Faucon Express), je vous contacte concernant la commande ${orderNum}.`
  )}`;

  const quickReplies = [
    "Où en est mon livreur ?",
    "Paiement MY Nita effectué avec succès",
    "Paiement Amanata envoyé",
    "Je suis disponible au portail"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-sm">Messagerie Faucon Express</h3>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  Chiffré E2E
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Abdoulkader Alio · {ownerPhone}</span>
                <span>·</span>
                <span className="font-mono text-amber-400">{orderNum}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direct Action Bar to Owner */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Ligne directe propriétaire :</span>
          <div className="flex items-center gap-2">
            <a
              href={`tel:${cleanPhone}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Appeler</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
            >
              <span>WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/50">
          {messages.map(msg => {
            const isMe = msg.sender === currentUserRole;
            const isOwner = msg.sender === 'OWNER_ADMIN';
            const isDriver = msg.sender === 'DRIVER';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <span>{msg.senderName}</span>
                  <span>·</span>
                  <span className="font-mono text-[10px]">{msg.timestamp}</span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                      : isOwner
                      ? 'bg-slate-800 border border-amber-500/30 text-slate-100 rounded-bl-none shadow-sm'
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <p>{msg.message}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick chip responses */}
        <div className="p-2 bg-slate-900 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-xs">
          {quickReplies.map((qr, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qr)}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap transition-colors"
            >
              {qr}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Écrivez votre message..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputVal.trim()}
            className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
