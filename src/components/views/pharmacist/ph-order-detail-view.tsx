'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Phone,
  Pill,
  Package,
  Clock,
  User,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Circle,
  XCircle,
  Loader2,
  ShieldCheck,
  Keyboard,
  Camera,
  SearchCode,
  Smartphone,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ViewHeader } from '@/components/view-header';
import { PharmacistPageHeader } from '@/components/views/pharmacist/ph-page-header';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';
import { useCapacitorBarcode } from '@/hooks/use-capacitor-barcode';
import { Haptics } from '@/lib/capacitor';

interface OrderData {
  id: string;
  status: string;
  totalQuantity: number;
  totalPrice: number;
  note?: string | null;
  pickupTime?: string | null;
  createdAt: string;
  updatedAt: string;
  verificationCode?: string | null;
  verifiedAt?: string | null;
  user: {
    name: string;
    phone: string | null;
  };
  pharmacy: {
    name: string;
    address: string;
    city: string;
    phone: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    medication: {
      name: string;
      commercialName: string;
      form?: string;
      needsPrescription?: boolean;
    };
  }>;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'En attente',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  confirmed: {
    label: 'Confirmée',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  ready: {
    label: 'Prêtée',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  picked_up: {
    label: 'Récupérée',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  cancelled: {
    label: 'Annulée',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
};

const TIMELINE_STEPS = [
  { status: 'pending', label: 'En attente' },
  { status: 'confirmed', label: 'Confirmée' },
  { status: 'ready', label: 'Prêtée' },
  { status: 'picked_up', label: 'Récupérée' },
];

const STATUS_FLOW_ORDER = ['pending', 'confirmed', 'ready', 'picked_up'];

function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR', { useGrouping: true }) + ' FCFA';
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatShortDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getUnitPrice(totalPrice: number, totalQuantity: number): number {
  return totalQuantity > 0 ? totalPrice / totalQuantity : 0;
}

export function PharmacistOrderDetailView() {
  const { selectedOrderId, goBack, setCurrentView, selectOrder } = useAppStore();

  // Hook pour le scan QR code
  const { scan: scanQRCode, loading: scanningQR } = useCapacitorBarcode();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Verification state
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!selectedOrderId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/pharmacist/orders/${selectedOrderId}`);
      if (!res.ok) throw new Error('Commande non trouvée');
      const data = await res.json();
      setOrder(data);
    } catch {
      setError('Impossible de charger la commande');
    } finally {
      setLoading(false);
    }
  }, [selectedOrderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Cleanup scanner resources (not needed with Capacitor plugin)
  const cleanupScanner = useCallback(() => {
    // No-op with Capacitor plugin
  }, []);

  useEffect(() => {
    return () => cleanupScanner();
  }, [cleanupScanner]);

  const updateStatus = async (newStatus: string, label: string) => {
    if (!selectedOrderId || updating) return;
    try {
      setUpdating(true);
      const res = await fetch(`/api/pharmacist/orders/${selectedOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      const updated = await res.json();
      setOrder(updated);
      Haptics.success();
      toast.success(`Commande ${label.toLowerCase()} avec succès`);
    } catch {
      Haptics.error();
      toast.error("Impossible de mettre à jour la commande");
    } finally {
      setUpdating(false);
    }
  };

  const handleVerify = async (code: string) => {
    if (!code.trim() || verifying) return;
    const normalized = code.toUpperCase().trim();
    try {
      setVerifying(true);
      setVerifyError(null);
      const res = await fetch('/api/pharmacist/orders/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized }),
      });
      const data = await res.json();

      if (!res.ok) {
        setVerifyError(data.error || 'Erreur de vérification');
        Haptics.error();
        toast.error(data.error || 'Code invalide');
        return;
      }

      Haptics.success();
      if (data.alreadyVerified) {
        toast.info('Cette commande a déjà été vérifiée');
      } else {
        toast.success('Commande vérifiée avec succès !');
      }

      // If the verified order matches the current one, update it
      if (data.id === order?.id) {
        setOrder(data);
      } else {
        selectOrder(data.id);
        setCurrentView('ph-order-detail');
      }

      setVerifyCode('');
      cleanupScanner();
      setVerifyDialogOpen(false);
    } catch {
      Haptics.error();
      setVerifyError('Erreur serveur');
      toast.error('Erreur de vérification');
    } finally {
      setVerifying(false);
    }
  };

  const startCameraScan = async () => {
    Haptics.medium();
    setScanError(null);
    setScanMode(true);

    try {
      const result = await scanQRCode({
        text: 'Placez le QR code de la commande dans le cadre'
      });

      if (result) {
        // Extraire le code de vérification du QR code
        const content = result.content;
        const match = content.match(/PHARMAPP-[a-zA-Z0-9]+-([A-Z2-9]{6})$/);

        if (match) {
          setScanMode(false);
          await handleVerify(match[1]);
        } else if (/^[A-Z2-9]{6}$/.test(content.toUpperCase().trim())) {
          setScanMode(false);
          await handleVerify(content.toUpperCase().trim());
        } else {
          Haptics.error();
          toast.error('QR code invalide');
          setScanMode(false);
        }
      } else {
        setScanMode(false);
      }
    } catch (err) {
      Haptics.error();
      setScanError('Scan annulé ou erreur');
      setScanMode(false);
    }
  };

  const stopCameraScan = () => {
    cleanupScanner();
    setScanMode(false);
  };

  // Loading
  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 py-4 space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <div className="h-24" />
      </div>
    );
  }

  // Error
  if (error || !order) {
    return (
      <div className="w-full px-4 sm:px-6 py-4">
        <ViewHeader title="Détail de la commande" back onBack={goBack} />
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Erreur</h3>
            <p className="text-sm text-muted-foreground mb-4">{error || 'Commande non trouvée'}</p>
            <Button onClick={goBack} variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const unitPrice = getUnitPrice(order.totalPrice, order.totalQuantity);
  const isCancelled = order.status === 'cancelled';
  const currentStepIndex = STATUS_FLOW_ORDER.indexOf(order.status);
  const isVerified = !!order.verifiedAt;
  const isPickedUp = order.status === 'picked_up';

  return (
    <div className="w-full px-4 sm:px-6 py-4 pb-safe lg:pb-6">
      {/* Header */}
      <PharmacistPageHeader
        title="Détail de la commande"
        description="Consultez les informations client, le statut et les actions de vérification pour cette commande."
        icon={<Package className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2">
            {isVerified && (
              <Badge className="border-0 bg-white/18 px-2 py-0.5 text-[10px] text-white">
                <ShieldCheck className="mr-0.5 h-3 w-3" />
                Vérifié
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 rounded-2xl bg-white/12 px-4 text-white hover:bg-white/18"
              onClick={goBack}
            >
              Retour
            </Button>
          </div>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-4"
      >
        {/* ── Verification Card ── */}
        {!isCancelled && order.verificationCode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`overflow-hidden transition-colors ${isVerified ? 'border-amber-300 bg-amber-50/40' : 'border-amber-200 bg-amber-50/30'}`}>
              <CardContent className="p-4 space-y-3">
                {/* Top: icon + label + code */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isVerified ? (
                      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-5 w-5 text-amber-600" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <SearchCode className="h-5 w-5 text-amber-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate">
                        {isVerified ? 'Commande vérifiée' : 'En attente de vérification'}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {isVerified
                          ? `Vérifiée le ${formatShortDate(order.verifiedAt!)}`
                          : 'Saisissez ou scannez le code du patient'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xl font-bold tracking-[0.25em] text-amber-700 font-mono shrink-0">
                    {order.verificationCode}
                  </span>
                </div>

                {/* Action buttons */}
                {!isVerified && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => { setVerifyCode(''); setVerifyError(null); setScanMode(false); setVerifyDialogOpen(true); }}
                      className="flex-1 h-10 bg-amber-600 hover:bg-amber-700 text-white text-xs"
                    >
                      <Keyboard className="h-4 w-4 mr-1.5" />
                      Saisir le code
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setVerifyCode(''); setVerifyError(null); setScanError(null); setScanMode(true); setVerifyDialogOpen(true); }}
                      className="flex-1 h-10 border-amber-200 text-amber-700 hover:bg-amber-50 text-xs"
                    >
                      <SearchCode className="h-4 w-4 mr-1.5" />
                      Scanner QR
                    </Button>
                  </div>
                )}

                {/* Verified message */}
                {isVerified && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-100/80 rounded-lg p-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      Le patient a présenté son code.
                      {isPickedUp ? ' Commande récupérée.' : ' Vous pouvez maintenant marquer la commande comme récupérée.'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Patient Info Card ── */}
        <Card className="border-amber-100">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Patient</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{order.user.name}</p>
                {order.user.phone ? (
                  <a href={`tel:${order.user.phone}`} className="flex items-center gap-1.5 text-xs text-amber-600 hover:underline mt-0.5" onClick={(e) => e.stopPropagation()}>
                    <Phone className="h-3 w-3" />
                    {order.user.phone}
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">Pas de téléphone</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Order Info Card ── */}
        <Card className="border-amber-100">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Détails de la commande</h3>

            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Pill className="h-4 w-4 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                {order.items.length === 1 ? (
                  <>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{order.items[0].medication.commercialName || order.items[0].medication.name}</p>
                      {order.items[0].medication.needsPrescription && (
                        <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0 border-0 shrink-0">Ordonnance</Badge>
                      )}
                    </div>
                    {order.items[0].medication.name !== order.items[0].medication.commercialName && (
                      <p className="text-xs text-muted-foreground truncate">{order.items[0].medication.name}</p>
                    )}
                    {order.items[0].medication.form && <p className="text-[11px] text-muted-foreground">{order.items[0].medication.form}</p>}
                  </>
                ) : (
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{order.items.length} médicaments</p>
                    {order.items.map((item, idx) => (
                      <p key={item.id || idx} className="text-xs text-muted-foreground">
                        • {item.quantity}x {item.medication.commercialName || item.medication.name}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator className="bg-amber-100/80" />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quantité</span>
                <span className="font-medium flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />{order.totalQuantity}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Prix unitaire</span>
                <span className="font-medium">{formatPrice(unitPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t border-amber-100/80">
                <span>Total</span>
                <span className="text-amber-700">{formatPrice(order.totalPrice)}</span>
              </div>
            </div>

            <Separator className="bg-amber-100/80" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Passée le</span>
              <span className="text-xs">{formatDate(order.createdAt)}</span>
            </div>

            {order.note && (
              <>
                <Separator className="bg-amber-100/80" />
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1">
                    <MessageSquare className="h-3.5 w-3.5" />Note du patient
                  </p>
                  <p className="text-sm text-amber-800">{order.note}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Timeline ── */}
        <Card className="border-amber-100">
          <CardContent className="p-4 space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Suivi de la commande</h3>

            {isCancelled ? (
              <div className="flex flex-col items-center py-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <p className="font-semibold text-red-700">Commande annulée</p>
              </div>
            ) : (
              <div className="relative">
                {TIMELINE_STEPS.map((step, index) => {
                  const stepIndex = STATUS_FLOW_ORDER.indexOf(step.status);
                  const isCompleted = currentStepIndex >= stepIndex;
                  const isCurrent = currentStepIndex === stepIndex;
                  const isLast = index === TIMELINE_STEPS.length - 1;
                  return (
                    <div key={step.status} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${isCompleted ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                        </div>
                        {!isLast && <div className={`w-0.5 h-10 transition-colors ${isCompleted && index < currentStepIndex ? 'bg-amber-500' : 'bg-gray-200'}`} />}
                      </div>
                      <div className="pt-1 pb-6">
                        <p className={`text-sm font-medium ${isCompleted ? (isCurrent ? 'text-amber-700' : 'text-amber-600') : 'text-muted-foreground'}`}>{step.label}</p>
                        {isCurrent && <p className="text-[11px] text-amber-500 mt-0.5">Étape en cours</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Fixed Action Buttons ── */}
      {order.status === 'pending' && (
        <div className="fixed bottom-0 lg:bottom-6 left-0 lg:left-64 right-0 z-50 safe-area-bottom">
          <div className="w-full px-4 sm:px-6 pb-safe">
            <Card className="border-amber-200 shadow-lg">
              <CardContent className="p-3 flex gap-2">
                <Button className="flex-1 h-11 bg-amber-600 hover:bg-amber-700 text-white text-sm" onClick={() => updateStatus('confirmed', 'Confirmée')} disabled={updating}>
                  {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Confirmer
                </Button>
                <Button variant="outline" className="flex-1 h-11 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-sm" onClick={() => updateStatus('cancelled', 'Annulée')} disabled={updating}>
                  {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Annuler
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {order.status === 'confirmed' && (
        <div className="fixed bottom-0 lg:bottom-6 left-0 lg:left-64 right-0 z-50 safe-area-bottom">
          <div className="w-full px-4 sm:px-6 pb-safe">
            <Card className="border-amber-200 shadow-lg">
              <CardContent className="p-3">
                <Button className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white text-sm" onClick={() => updateStatus('ready', 'Prêtée')} disabled={updating}>
                  {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Préparer la commande
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {order.status === 'ready' && (
        <div className="fixed bottom-0 lg:bottom-6 left-0 lg:left-64 right-0 z-50 safe-area-bottom">
          <div className="w-full px-4 sm:px-6 pb-safe">
            <Card className="border-amber-200 shadow-lg">
              <CardContent className="p-3">
                <Button className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white text-sm" onClick={() => updateStatus('picked_up', 'Récupérée')} disabled={updating}>
                  {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Marquer comme récupérée
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Verify Dialog ── */}
      <Dialog open={verifyDialogOpen} onOpenChange={(open) => {
        if (!open) { cleanupScanner(); setScanMode(false); setVerifyCode(''); setVerifyError(null); setScanError(null); }
        setVerifyDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-md mx-auto p-0 gap-0 overflow-hidden rounded-2xl border-amber-200">
          <DialogHeader className="bg-gradient-to-r from-amber-600 to-teal-600 px-5 py-4 text-white shrink-0">
            <DialogTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Vérifier une commande
            </DialogTitle>
            <DialogDescription className="text-amber-200 text-xs mt-1">
              Saisissez le code du patient ou scannez le QR code
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => { cleanupScanner(); setScanMode(false); setScanError(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${!scanMode ? 'bg-amber-100 text-amber-700 border-2 border-amber-300' : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100'}`}
              >
                <Keyboard className="h-4 w-4" />
                Saisie manuelle
              </button>
              <button
                onClick={() => { setScanError(null); startCameraScan(); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${scanMode ? 'bg-amber-100 text-amber-700 border-2 border-amber-300' : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100'}`}
              >
                <Camera className="h-4 w-4" />
                Scanner QR
              </button>
            </div>

            {/* Camera view */}
            {scanMode && (
              <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3]">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                {!streamRef.current && !scanError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 space-y-2">
                    <Camera className="h-8 w-8" />
                    <p className="text-xs">Démarrage de la caméra...</p>
                  </div>
                )}
                {verifying && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                    <p className="text-xs text-white">Vérification en cours...</p>
                  </div>
                )}
                {/* QR scanning overlay */}
                {streamRef.current && !verifying && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white/50 rounded-2xl">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-400 rounded-tl-xl -translate-x-[1px] -translate-y-[1px]" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-400 rounded-tr-xl translate-x-[1px] -translate-y-[1px]" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-400 rounded-bl-xl -translate-x-[1px] translate-y-[1px]" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-400 rounded-br-xl translate-x-[1px] translate-y-[1px]" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Camera scan error */}
            {scanMode && scanError && (
              <div className="flex items-start gap-2 bg-red-50 rounded-lg p-3">
                <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{scanError}</p>
              </div>
            )}

            {/* Camera scan instruction */}
            {scanMode && !scanError && streamRef.current && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Pointez la caméra vers le QR code du patient</span>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-[11px] text-muted-foreground">ou</span>
              <Separator className="flex-1" />
            </div>

            {/* Manual code input (always visible) */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground">Code de vérification (6 caractères)</label>
              <Input
                value={verifyCode}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6);
                  setVerifyCode(val);
                  setVerifyError(null);
                }}
                placeholder="Ex: A3K9X2"
                className="h-12 text-center text-2xl font-mono tracking-[0.4em] font-bold border-amber-200 focus:border-amber-400"
                maxLength={6}
                disabled={verifying}
                autoFocus={!scanMode}
              />
              <Button
                onClick={() => handleVerify(verifyCode)}
                disabled={verifyCode.length !== 6 || verifying}
                className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white text-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Vérification...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Vérifier le code</span>
                  </>
                )}
              </Button>
            </div>

            {/* Verify error */}
            {verifyError && (
              <div className="flex items-start gap-2 bg-red-50 rounded-lg p-3">
                <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{verifyError}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
