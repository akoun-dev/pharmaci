'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Phone,
  Navigation,
  MapPin,
  Pill,
  Package,
  Clock,
  ChevronRight,
  AlertCircle,
  Search,
  QrCode,
  ShieldCheck,
  Copy,
  Download,
  X,
  FileText,
  Lock,
  Scan,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewHeader } from '@/components/view-header';
import { useAppStore } from '@/store/app-store';
import { openGoogleMaps } from '@/lib/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useCapacitorBarcode } from '@/hooks/use-capacitor-barcode';
import { Haptics } from '@/lib/capacitor';

interface OrderData {
  id: string;
  status: string;
  totalQuantity: number;
  totalPrice: number;
  note?: string | null;
  createdAt: string;
  pharmacyId: string;
  verificationCode?: string | null;
  verifiedAt?: string | null;
  pharmacy: {
    name: string;
    address: string;
    city: string;
    phone: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  items: {
    id: string;
    quantity: number;
    price: number;
    medication: {
      name: string;
      commercialName: string;
      form?: string;
      needsPrescription?: boolean;
    };
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'En attente',
    className:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800',
  },
  confirmed: {
    label: 'Confirmée',
    className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800',
  },
  ready: {
    label: 'Prête',
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800',
  },
  picked_up: {
    label: 'Récupérée',
    className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-200 dark:border-green-800',
  },
  cancelled: {
    label: 'Annulée',
    className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800',
  },
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function OrderHistoryView() {
  const {
    currentUserId,
    selectPharmacy,
    setCurrentView,
  } = useAppStore();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<OrderData | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Hook pour le scan QR code
  const { scan: scanQRCode, loading: scanningQR } = useCapacitorBarcode();

  const fetchOrders = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      const data = await res.json();
      // API returns { items: orders[], pagination: {...} }
      const ordersList = Array.isArray(data) ? data : (data.items || []);
      setOrders(ordersList);
    } catch {
      logger.error('Error fetching orders');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handlePharmacyClick = (pharmacyId: string) => {
    selectPharmacy(pharmacyId);
    setCurrentView('pharmacy-detail');
  };

  const handleNavigate = (order: OrderData) => {
    if (order.pharmacy.latitude && order.pharmacy.longitude) {
      openGoogleMaps(order.pharmacy.latitude, order.pharmacy.longitude);
    }
  };

  const openQrDialog = (order: OrderData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedOrder(order);
    setQrDialogOpen(true);
  };

  const handleDownloadQR = () => {
    if (!selectedOrder?.verificationCode) return;
    const container = document.getElementById('order-qr-dialog-code');
    if (!container) return;

    const svg = container.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `pharmapp-${selectedOrder.verificationCode}.png`;
        link.href = pngUrl;
        link.click();
        toast.success('QR Code téléchargé');
      }
    };

    img.onerror = () => {
      toast.error('Erreur lors de la génération du QR Code');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;
    setCancelling(true);
    try {
      // Optimistic: remove from local list immediately
      setOrders(prev => prev.filter(o => o.id !== cancellingOrder.id));
      setCancelDialogOpen(false);

      const res = await fetch(`/api/orders/${cancellingOrder.id}`, { method: 'DELETE' });
      if (!res.ok) {
        // Rollback on failure
        await fetchOrders();
        const data = await res.json().catch(() => null);
        toast.error(data?.error || 'Impossible d\'annuler cette commande');
      } else {
        toast.success('Commande annulée avec succès');
      }
    } catch {
      await fetchOrders();
      toast.error('Erreur réseau lors de l\'annulation');
    } finally {
      setCancelling(false);
      setCancellingOrder(null);
    }
  };

  const openCancelDialog = (order: OrderData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCancellingOrder(order);
    setCancelDialogOpen(true);
  };

  const handleCopyCode = () => {
    if (selectedOrder?.verificationCode) {
      navigator.clipboard.writeText(selectedOrder.verificationCode).then(() => {
        toast.success('Code copié');
        Haptics.light();
      }).catch(() => {
        toast.error('Impossible de copier');
        Haptics.error();
      });
    }
  };

  const handleScanQR = async () => {
    Haptics.medium();
    const result = await scanQRCode({ text: 'Placez le QR code de votre commande dans le cadre' });

    if (result) {
      // Vérifier si c'est un QR code de commande valide
      const orderData = parseQRCodeContent(result.content);

      if (orderData) {
        Haptics.success();

        // Vérifier si la commande existe dans la liste
        const existingOrder = orders.find(o => o.id === orderData.orderId);

        if (existingOrder) {
          // Afficher les détails de la commande
          setSelectedOrder(existingOrder);
          setQrDialogOpen(true);
          toast.success('Commande trouvée !');
        } else {
          // Récupérer les détails de la commande depuis l'API
          try {
            const res = await fetch(`/api/orders/${orderData.orderId}`);
            if (res.ok) {
              const orderDetails = await res.json();
              setSelectedOrder(orderDetails);
              setQrDialogOpen(true);
              toast.success('Commande trouvée !');
            } else {
              toast.error('Commande non trouvée');
              Haptics.error();
            }
          } catch {
            toast.error('Impossible de récupérer la commande');
            Haptics.error();
          }
        }
      } else {
        toast.error('QR code invalide');
        Haptics.error();
      }
    }
  };

  const parseQRCodeContent = (content: string): { orderId: string } | null => {
    // Format: PHARMAPP-{orderId}-{verificationCode}
    const match = content.match(/^PHARMAPP-([\w-]+)-([A-Z0-9]+)$/);
    if (!match) return null;

    return {
      orderId: match[1],
    };
  };

  const qrValue = selectedOrder?.verificationCode
    ? `PHARMAPP-${selectedOrder.id}-${selectedOrder.verificationCode}`
    : '';

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 py-4 space-y-4">
        <Skeleton className="h-8 w-40" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="w-full px-4 sm:px-6">
        <ViewHeader
          title="Mes commandes"
          icon={<ClipboardList className="h-5 w-5 text-amber-600" />}
          action={
            <div className="flex items-center gap-2">
              {orders.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {orders.length}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleScanQR}
                disabled={scanningQR}
                className="h-8 px-2 sm:px-3 text-xs border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/50 dark:text-green-200"
              >
                <Scan className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Scanner QR</span>
              </Button>
            </div>
          }
        />

        {!currentUserId ? (
          <Card className="border-amber-100 dark:border-amber-900/50 dark:bg-gray-950/70">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-3">
                <Lock className="w-12 h-12 text-amber-600" />
              </div>
              <h3 className="font-semibold mb-1">Connectez-vous</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connectez-vous pour voir vos commandes
              </p>
              <Button
                onClick={() => setCurrentView('profile')}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Se connecter
              </Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card className="border-amber-100 dark:border-amber-900/50 dark:bg-gray-950/70">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-3 flex justify-center">
                <FileText className="w-12 h-12 text-amber-600" />
              </div>
              <h3 className="font-semibold mb-1">
                Aucune commande pour le moment
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Explorez les médicaments disponibles et passez votre première
                commande
              </p>
              <Button
                onClick={() => setCurrentView('search')}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Search className="h-4 w-4 mr-2" />
                Parcourir les médicaments
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {orders.map((order, index) => {
                const statusInfo =
                  STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const isActive = ['pending', 'confirmed', 'ready'].includes(order.status);
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="overflow-hidden border-amber-100 dark:border-amber-900/50 dark:bg-gray-950/70">
                      <CardContent className="p-4 space-y-2.5">
                        {/* Top row: medications + status badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                              <Pill className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                            </div>
                            <div className="min-w-0 flex-1">
                              {order.items.length === 1 ? (
                                <>
                                  <p className="font-semibold text-sm truncate">
                                    {order.items[0].medication.commercialName ||
                                      order.items[0].medication.name}
                                  </p>
                                  {order.items[0].medication.name !==
                                    order.items[0].medication.commercialName && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {order.items[0].medication.name}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="font-semibold text-sm truncate">
                                  {order.items.length} médicament{order.items.length > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[11px] px-2 py-0.5 flex-shrink-0 ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </Badge>
                        </div>

                        {/* Multiple medications list */}
                        {order.items.length > 1 && (
                          <div className="ml-10 space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={item.id || idx} className="text-xs text-muted-foreground">
                                • {item.quantity}x {item.medication.commercialName || item.medication.name}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Prescription required warning */}
                        {order.items.some(item => item.medication.needsPrescription) && (
                          <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800">
                            <FileText className="h-3.5 w-3.5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                              Ordonnance obligatoire
                            </p>
                          </div>
                        )}

                        {/* Pharmacy (clickable) */}
                        <button
                          onClick={() => handlePharmacyClick(order.pharmacyId)}
                          className="flex w-full items-center gap-1.5 text-left text-xs text-green-700 hover:underline dark:text-green-300"
                        >
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {order.pharmacy.name}
                          </span>
                          <ChevronRight className="h-3 w-3 flex-shrink-0 ml-auto text-amber-500" />
                        </button>

                        {/* Verification code + QR button */}
                        {order.verificationCode && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => openQrDialog(order, e)}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs text-green-700 transition-colors hover:bg-green-100 dark:bg-green-950/30 dark:text-green-200 dark:hover:bg-green-950/50"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                              <span className="font-mono font-bold tracking-wider">{order.verificationCode}</span>
                              {order.verifiedAt && (
                                <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                              )}
                            </button>
                          </div>
                        )}

                        {/* Details row */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {order.totalQuantity}
                          </span>
                          <span className="font-semibold text-foreground">
                            {order.totalPrice.toLocaleString()} FCFA
                          </span>
                          <span className="flex items-center gap-1 ml-auto">
                            <Clock className="h-3 w-3" />
                            {formatDate(order.createdAt)}
                          </span>
                        </div>

                        {/* Separator */}
                        <div className="border-t border-amber-100/80 dark:border-amber-900/40" />

                        {/* Action row */}
                        <div className="flex flex-wrap items-center gap-2">
                          {(order.status === 'pending' || order.status === 'confirmed') && (
                            <AlertDialog open={cancelDialogOpen && cancellingOrder?.id === order.id} onOpenChange={(open) => { if (!open) { setCancelDialogOpen(false); setCancellingOrder(null); } else { openCancelDialog(order); } }}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 flex-1 min-w-[80px] border-red-200 px-2 sm:px-3 text-xs text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
                                onClick={(e) => openCancelDialog(order, e)}
                                disabled={cancelling}
                              >
                                <X className="h-3.5 w-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline">Annuler</span>
                              </Button>
                              <AlertDialogContent className="sm:max-w-md">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Annuler la commande</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir annuler votre commande de <strong>{order.items.length === 1
                                      ? (order.items[0].medication.commercialName || order.items[0].medication.name)
                                      : `${order.items.length} médicaments`}
                                    </strong> auprès de <strong>{order.pharmacy.name}</strong> ? Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel disabled={cancelling}>
                                    Non, garder
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleCancelOrder}
                                    disabled={cancelling}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    {cancelling ? 'Annulation...' : 'Oui, annuler'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {isActive && order.verificationCode && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 flex-1 min-w-[80px] border-amber-200 px-2 sm:px-3 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-200 dark:hover:bg-amber-950/40"
                              onClick={(e) => openQrDialog(order, e)}
                            >
                              <QrCode className="h-3.5 w-3.5 sm:mr-1.5" />
                              <span className="hidden sm:inline">QR Code</span>
                            </Button>
                          )}
                          <a
                            href={`tel:${order.pharmacy.phone}`}
                            className="flex-1 min-w-[80px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-full border-green-200 px-2 sm:px-3 text-xs text-green-700 hover:bg-amber-50 dark:border-green-900/50 dark:text-green-200 dark:hover:bg-green-950/30"
                            >
                              <Phone className="h-3.5 w-3.5 sm:mr-1.5" />
                              <span className="hidden sm:inline">Appeler</span>
                            </Button>
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 flex-1 min-w-[80px] border-amber-200 px-2 sm:px-3 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-200 dark:hover:bg-amber-950/40"
                            onClick={() => handleNavigate(order)}
                            disabled={!order.pharmacy.latitude || !order.pharmacy.longitude}
                          >
                            <Navigation className="h-3.5 w-3.5 sm:mr-1.5" />
                            <span className="hidden sm:inline">Y aller</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* QR Code Dialog */}
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent className="mx-auto gap-0 overflow-hidden rounded-2xl border-green-200 p-0 dark:border-green-900/50 dark:bg-gray-950 sm:max-w-sm">
            <DialogHeader className="bg-gradient-to-r from-green-600 to-teal-600 px-5 py-4 text-white">
              <DialogTitle className="text-base flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Code de vérification
              </DialogTitle>
              <DialogDescription className="text-white text-xs mt-1">
                Présentez ce QR code à la pharmacie
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="p-5 space-y-4">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-gray-900">
                    <div id="order-qr-dialog-code">
                      <QRCodeSVG
                        value={qrValue}
                        size={200}
                        level="M"
                        includeMargin={false}
                        fgColor="#065f46"
                      />
                    </div>
                  </div>
                </div>

                {/* Code display */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-muted-foreground">Code :</span>
                    {selectedOrder.verifiedAt && (
                      <Badge className="bg-amber-100 px-1.5 text-[10px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                        <ShieldCheck className="h-3 w-3 mr-0.5" />
                        Vérifié
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-2xl font-bold tracking-[0.3em] text-amber-700 dark:text-amber-200">
                      {selectedOrder.verificationCode}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30 dark:hover:text-amber-200"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Order info */}
                <div className="space-y-1.5 rounded-lg bg-gray-50 p-3 dark:bg-gray-900/70">
                  {selectedOrder.items.length === 1 ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Médicament</span>
                      <span className="font-medium truncate ml-2 text-right">
                        {selectedOrder.items[0].medication.commercialName || selectedOrder.items[0].medication.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between text-xs">
                      <span className="text-muted-foreground">Médicaments</span>
                      <div className="text-right ml-2 space-y-0.5">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={item.id || idx} className="font-medium">
                            {item.quantity}x {item.medication.commercialName || item.medication.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Pharmacie</span>
                    <span className="font-medium truncate ml-2 text-right">
                      {selectedOrder.pharmacy.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-200">
                      {selectedOrder.totalPrice.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>

                {/* Prescription required warning */}
                {selectedOrder.items.some(item => item.medication.needsPrescription) && (
                  <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800">
                    <FileText className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                        Ordonnance obligatoire
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                        N'oubliez pas de munir votre ordonnance lors du retrait.
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadQR}
                    className="flex-1 h-10 border-green-200 text-sm text-green-700 hover:bg-green-50 dark:border-green-900/50 dark:text-green-200 dark:hover:bg-green-950/30"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Télécharger
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setQrDialogOpen(false)}
                    className="flex-1 h-10 text-sm"
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
