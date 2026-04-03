'use client';

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
  Truck,
  QrCode,
  ShieldCheck,
  Copy,
  Download,
  X,
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
import { toast } from 'sonner';

interface OrderData {
  id: string;
  status: string;
  deliveryStatus: string;
  quantity: number;
  totalPrice: number;
  note?: string | null;
  paymentMethod?: string | null;
  pickupTime?: string | null;
  createdAt: string;
  pharmacyId: string;
  verificationCode?: string | null;
  verifiedAt?: string | null;
  pharmacy: {
    name: string;
    address: string;
    city: string;
    phone: string;
  };
  medication: {
    name: string;
    commercialName: string;
    form?: string;
  };
}

interface PharmacyCoords {
  [pharmacyId: string]: { latitude: number; longitude: number };
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'En attente',
    className:
      'bg-amber-100 text-amber-700 border-amber-200',
  },
  confirmed: {
    label: 'Confirmée',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  ready: {
    label: 'Prête',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  picked_up: {
    label: 'Récupérée',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  cancelled: {
    label: 'Annulée',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
};

const DELIVERY_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pickup: {
    label: 'Retrait',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  preparing: {
    label: 'En préparation',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  ready: {
    label: 'Prêt',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  delivering: {
    label: 'En livraison',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  delivered: {
    label: 'Livré',
    className: 'bg-green-100 text-green-700 border-green-200',
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
  const [pharmacyCoords, setPharmacyCoords] = useState<PharmacyCoords>({});
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);

      // Pre-fetch coordinates for all pharmacies in the orders
      const uniquePharmacyIds = [
        ...new Set(
          (Array.isArray(data) ? data : []).map((o: OrderData) => o.pharmacyId)
        ),
      ];
      const coords: PharmacyCoords = {};
      await Promise.allSettled(
        uniquePharmacyIds.map(async (pid) => {
          try {
            const pharmRes = await fetch(`/api/pharmacies/${pid}`);
            const pharmData = await pharmRes.json();
            coords[pid] = {
              latitude: pharmData.latitude,
              longitude: pharmData.longitude,
            };
          } catch {
            // non-critical
          }
        })
      );
      setPharmacyCoords(coords);
    } catch {
      console.error('Error fetching orders');
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

  const handleNavigate = (pharmacyId: string) => {
    const coords = pharmacyCoords[pharmacyId];
    if (coords) {
      openGoogleMaps(coords.latitude, coords.longitude);
    }
  };

  const openQrDialog = (order: OrderData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedOrder(order);
    setQrDialogOpen(true);
  };

  const handleDownloadQR = () => {
    if (!selectedOrder?.verificationCode) return;
    const svg = document.getElementById('order-qr-dialog-code');
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

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopyCode = () => {
    if (selectedOrder?.verificationCode) {
      navigator.clipboard.writeText(selectedOrder.verificationCode).then(() => {
        toast.success('Code copié');
      }).catch(() => {
        toast.error('Impossible de copier');
      });
    }
  };

  const qrValue = selectedOrder?.verificationCode
    ? `PHARMAPP-${selectedOrder.id}-${selectedOrder.verificationCode}`
    : '';

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        <Skeleton className="h-8 w-40" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <ViewHeader
          title="Mes commandes"
          icon={<ClipboardList className="h-5 w-5 text-emerald-600" />}
          action={
            orders.length > 0 ? (
              <Badge variant="secondary" className="text-xs">
                {orders.length}
              </Badge>
            ) : null
          }
        />

        {!currentUserId ? (
          <Card className="border-emerald-100">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-3">🔐</div>
              <h3 className="font-semibold mb-1">Connectez-vous</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connectez-vous pour voir vos commandes
              </p>
              <Button
                onClick={() => setCurrentView('profile')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Se connecter
              </Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card className="border-emerald-100">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="font-semibold mb-1">
                Aucune commande pour le moment
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Explorez les médicaments disponibles et passez votre première
                commande
              </p>
              <Button
                onClick={() => setCurrentView('search')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
                const deliveryInfo =
                  DELIVERY_STATUS_CONFIG[order.deliveryStatus] || DELIVERY_STATUS_CONFIG.pickup;
                const isActive = ['pending', 'confirmed', 'ready'].includes(order.status);
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-emerald-100 overflow-hidden">
                      <CardContent className="p-4 space-y-2.5">
                        {/* Top row: medication + status badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Pill className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm truncate">
                                {order.medication.commercialName ||
                                  order.medication.name}
                              </p>
                              {order.medication.name !==
                                order.medication.commercialName && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {order.medication.name}
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

                        {/* Pharmacy (clickable) */}
                        <button
                          onClick={() => handlePharmacyClick(order.pharmacyId)}
                          className="flex items-center gap-1.5 text-xs text-emerald-700 hover:underline w-full text-left"
                        >
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {order.pharmacy.name}
                          </span>
                          <ChevronRight className="h-3 w-3 flex-shrink-0 ml-auto text-emerald-500" />
                        </button>

                        {/* Verification code + QR button */}
                        {order.verificationCode && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => openQrDialog(order, e)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-xs text-emerald-700 transition-colors flex-1 justify-center"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                              <span className="font-mono font-bold tracking-wider">{order.verificationCode}</span>
                              {order.verifiedAt && (
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                            </button>
                          </div>
                        )}

                        {/* Details row */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {order.quantity}
                          </span>
                          <span className="font-semibold text-foreground">
                            {order.totalPrice.toLocaleString()} FCFA
                          </span>
                          <span className="flex items-center gap-1 ml-auto">
                            <Clock className="h-3 w-3" />
                            {formatDate(order.createdAt)}
                          </span>
                        </div>

                        {/* Delivery status badge */}
                        {order.deliveryStatus && order.deliveryStatus !== 'pickup' && (
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${deliveryInfo.className}`}
                            >
                              {order.deliveryStatus === 'delivering' && <Truck className="h-2.5 w-2.5 mr-0.5" />}
                              {deliveryInfo.label}
                            </Badge>
                            {(order.deliveryStatus === 'ready' || order.deliveryStatus === 'delivering') && (
                              <span className="text-[11px] text-muted-foreground">
                                Estimation : environ 30 min
                              </span>
                            )}
                          </div>
                        )}

                        {/* Separator */}
                        <div className="border-t border-emerald-100/80" />

                        {/* Action row */}
                        <div className="flex items-center gap-2">
                          {isActive && order.verificationCode && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs"
                              onClick={(e) => openQrDialog(order, e)}
                            >
                              <QrCode className="h-3.5 w-3.5 mr-1.5" />
                              QR Code
                            </Button>
                          )}
                          <a
                            href={`tel:${order.pharmacy.phone}`}
                            className="flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs"
                            >
                              <Phone className="h-3.5 w-3.5 mr-1.5" />
                              Appeler
                            </Button>
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs"
                            onClick={() => handleNavigate(order.pharmacyId)}
                            disabled={!pharmacyCoords[order.pharmacyId]}
                          >
                            <Navigation className="h-3.5 w-3.5 mr-1.5" />
                            Y aller
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
          <DialogContent className="sm:max-w-sm mx-auto p-0 gap-0 overflow-hidden rounded-2xl border-emerald-200">
            <DialogHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-white">
              <DialogTitle className="text-base flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Code de vérification
              </DialogTitle>
              <DialogDescription className="text-emerald-200 text-xs mt-1">
                Présentez ce QR code à la pharmacie
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="p-5 space-y-4">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
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
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-muted-foreground">Code :</span>
                    {selectedOrder.verifiedAt && (
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5">
                        <ShieldCheck className="h-3 w-3 mr-0.5" />
                        Vérifié
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold tracking-[0.3em] text-emerald-700 font-mono">
                      {selectedOrder.verificationCode}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Order info */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Médicament</span>
                    <span className="font-medium truncate ml-2 text-right">
                      {selectedOrder.medication.commercialName || selectedOrder.medication.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Pharmacie</span>
                    <span className="font-medium truncate ml-2 text-right">
                      {selectedOrder.pharmacy.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold text-emerald-700">
                      {selectedOrder.totalPrice.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadQR}
                    className="flex-1 h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-sm"
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
