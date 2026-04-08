'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  ArrowLeft,
  Send,
  RefreshCw,
  AlertCircle,
  Inbox,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewHeader } from '@/components/view-header';
import { PharmacistPageHeader } from '@/components/views/pharmacist/ph-page-header';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';

interface PatientInfo {
  id: string;
  name: string;
  lastOrderStatus?: string;
  lastMessagePreview?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface MessageData {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: { id: string; name: string; avatar?: string | null };
  receiver: { id: string; name: string; avatar?: string | null };
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  ready: 'Prêtée',
  picked_up: 'Récupérée',
  cancelled: 'Annulée',
};

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin}min`;
    if (diffH < 24) return `il y a ${diffH}h`;
    if (diffDays === 1) return 'hier';
    if (diffDays < 7) return `il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

function formatMessageTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function PharmacistMessagesView() {
  const { currentUser, currentUserId } = useAppStore();

  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [contactSearch, setContactSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch patients from orders
  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch('/api/pharmacist/orders?limit=50');
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      const orders = Array.isArray(data.orders) ? data.orders : [];

      // Deduplicate patients, keep latest order status per patient
      const patientMap = new Map<string, PatientInfo>();
      orders.forEach((order: { user?: { id: string; name: string }; status?: string }) => {
        if (order.user) {
          const existing = patientMap.get(order.user.id);
          if (!existing) {
            patientMap.set(order.user.id, {
              id: order.user.id,
              name: order.user.name,
              lastOrderStatus: order.status,
            });
          }
        }
      });

      setPatients(Array.from(patientMap.values()));

      // Fetch last message preview for each patient
      for (const patient of patientMap.values()) {
        try {
          const msgRes = await fetch(`/api/pharmacist/messages?userId=${patient.id}`);
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            const msgs: MessageData[] = Array.isArray(msgData.messages) ? msgData.messages : [];
            if (msgs.length > 0) {
              const lastMsg = msgs[0];
              setPatients((prev) =>
                prev.map((p) =>
                  p.id === patient.id
                    ? {
                        ...p,
                        lastMessagePreview: lastMsg.content.length > 35 ? lastMsg.content.slice(0, 35) + '...' : lastMsg.content,
                        lastMessageTime: lastMsg.createdAt,
                        unreadCount: msgs.filter((m) => m.read === false && m.senderId !== currentUserId).length,
                      }
                    : p
                )
              );
            }
          }
        } catch {
          // skip per-patient message fetch errors
        }
      }
    } catch {
      toast.error('Impossible de charger la liste des patients');
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  // Fetch messages for a selected patient
  const fetchMessages = useCallback(async (userId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/pharmacist/messages?userId=${userId}`);
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch {
      toast.error('Impossible de charger les messages');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when conversation is opened
  useEffect(() => {
    if (selectedPatient) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedPatient]);

  const handleSelectPatient = (patient: PatientInfo) => {
    setSelectedPatient(patient);
    setMessages([]);
    setMessageInput('');
    fetchMessages(patient.id);
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setMessages([]);
    setMessageInput('');
  };

  const handleSendMessage = async () => {
    if (!selectedPatient || !messageInput.trim() || sending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    // Optimistic update
    const optimisticMessage: MessageData = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      receiverId: selectedPatient.id,
      content,
      read: false,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: currentUser?.name || 'Vous' },
      receiver: { id: selectedPatient.id, name: selectedPatient.name },
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch('/api/pharmacist/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: selectedPatient.id, content }),
      });

      if (!res.ok) throw new Error('Erreur serveur');

      const sentMessage = await res.json();

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMessage.id ? sentMessage : m))
      );
    } catch {
      toast.error("Impossible d'envoyer le message");
      // Remove optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setMessageInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Chat view
  if (selectedPatient) {
    return (
      <div className="w-full px-4 sm:px-6 py-4 flex flex-col" style={{ height: 'calc(100dvh - 5rem - 2rem)' }}>
        {/* Chat header */}
        <div className="flex items-center gap-3 pb-3 border-b border-orange-100 flex-shrink-0">
          <button
            onClick={handleBackToList}
            className="flex items-center justify-center w-9 h-9 -ml-1 rounded-xl text-orange-600 hover:bg-orange-50 active:bg-orange-100 transition-colors flex-shrink-0"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-orange-700">
              {selectedPatient.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm truncate">{selectedPatient.name}</h2>
            {selectedPatient.lastOrderStatus && (
              <p className="text-[11px] text-muted-foreground">
                {STATUS_LABELS[selectedPatient.lastOrderStatus] || selectedPatient.lastOrderStatus}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => fetchMessages(selectedPatient.id)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 scrollbar-thin">
          {loadingMessages ? (
            <div className="space-y-3 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <Skeleton className="h-12 w-48 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <MessageCircle className="h-10 w-10 text-orange-300 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Aucun message</p>
              <p className="text-xs text-muted-foreground mt-1">
                Envoyez le premier message à {selectedPatient.name}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg) => {
                const isSent = msg.senderId === currentUserId;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 ${
                        isSent
                          ? 'bg-orange-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-foreground rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                      <p
                        className={`text-[10px] mt-1 text-right ${
                          isSent ? 'text-orange-200' : 'text-muted-foreground'
                        }`}
                      >
                        {formatMessageTime(msg.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 pt-3 border-t border-orange-100 flex-shrink-0 pb-safe">
          <Input
            ref={inputRef}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message..."
            className="flex-1 h-11 text-sm border-orange-200 focus-visible:ring-orange-400"
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || sending}
            size="icon"
            className="h-11 w-11 bg-orange-600 hover:bg-orange-700 text-white flex-shrink-0 disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Patient list view - Loading
  if (loadingPatients) {
    return (
      <div className="w-full px-4 sm:px-6 py-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  // Patient list view
  return (
    <div className="w-full px-4 sm:px-6 py-4">
      {/* Header */}
      <PharmacistPageHeader
        title="Messagerie"
        description="Retrouvez les conversations avec vos patients et relancez rapidement les échanges liés aux commandes."
        icon={<MessageCircle className="h-5 w-5" />}
        action={
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-2xl bg-white/12 text-white hover:bg-white/18 hover:text-white"
            onClick={fetchPatients}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      {/* Search bar */}
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un patient..."
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            className="pl-9 h-10 text-sm border-orange-200 focus:border-orange-400"
          />
          {contactSearch && (
            <button
              onClick={() => setContactSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Patient list */}
      {(() => {
        const filtered = contactSearch
          ? patients.filter((p) => p.name.toLowerCase().includes(contactSearch.toLowerCase()))
          : patients;
        return filtered.length === 0 ? (
          <Card className="border-orange-100 mt-2">
            <CardContent className="p-8 text-center">
              <Inbox className="h-12 w-12 text-orange-300 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">
                {contactSearch ? 'Aucun résultat' : 'Aucune conversation'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {contactSearch
                  ? `Aucun patient trouvé pour « ${contactSearch} »`
                  : 'Les patients ayant passé des commandes apparaîtront ici'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 sm:space-y-3 mt-1"
          >
            {filtered.map((patient, index) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
              >
                <Card
                  className="border-orange-100 overflow-hidden cursor-pointer hover:border-orange-300 transition-colors active:scale-[0.99] duration-150"
                  onClick={() => handleSelectPatient(patient)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar with unread badge */}
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-sm sm:text-base font-bold text-orange-700">
                            {patient.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {patient.unreadCount && patient.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {patient.unreadCount > 9 ? '9+' : patient.unreadCount}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{patient.name}</p>
                        {patient.lastMessagePreview ? (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {patient.lastMessagePreview}
                          </p>
                        ) : patient.lastOrderStatus ? (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Commande : {STATUS_LABELS[patient.lastOrderStatus] || patient.lastOrderStatus}
                          </p>
                        ) : null}
                      </div>

                      {/* Time */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {patient.lastMessageTime && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelativeTime(patient.lastMessageTime)}
                          </span>
                        )}
                        <MessageCircle className="h-4 w-4 text-orange-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        );
      })()}
    </div>
  );
}
