'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Phone,
  Navigation,
  ClipboardList,
  Pill,
  MessageSquare,
  Package,
  Store,
  QrCode,
  Download,
  Copy,
  ShieldCheck,
  Layers,
  PartyPopper,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ViewHeader } from '@/components/view-header';
import { useAppStore } from '@/store/app-store';
import { openGoogleMaps } from '@/lib/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { groupOrdersByPharmacy, type OrderGroup } from '@/lib/order-utils';

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
    latitude?: number;
    longitude?: number;
    parkingInfo?: string | null;
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

interface PharmacyDetail {
  latitude: number;
  longitude: number;
  parkingInfo?: string;
}

export function OrderConfirmationView() {
  const {
    selectedOrderId,
    currentUserId,
    setCurrentView,
    selectPharmacy,
  } = useAppStore();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [relatedOrders, setRelatedOrders] = useState<OrderData[]>([]);
  const [pharmacyDetail, setPharmacyDetail] = useState<PharmacyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      setError('Utilisateur non connecté');
      return;
    }
    if (!selectedOrderId) {
      setLoading(false);
      setError('Aucune commande sélectionnée');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Fetch the specific order directly by ID
      const res = await fetch(`/api/orders/${selectedOrderId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Commande non trouvée');
        return;
      }
      const found: OrderData = await res.json();
      if (found) {
        setOrder(found);

        // Related orders are informational only, so a failure here must not
        // break the confirmation screen after a successful order creation.
        try {
          const allOrdersRes = await fetch('/api/orders');
          if (allOrdersRes.ok) {
            const allOrdersData = await allOrdersRes.json();
            const allOrders: OrderData[] = Array.isArray(allOrdersData)
              ? allOrdersData
              : Array.isArray(allOrdersData.items)
                ? allOrdersData.items
                : [];

            // Get orders from the same pharmacy created within the last hour
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const related = allOrders.filter(
              o => o.pharmacyId === found.pharmacyId &&
              o.id !== found.id &&
              new Date(o.createdAt) > oneHourAgo
            );
            setRelatedOrders(related);
          }
        } catch (relatedOrdersError) {
          logger.warn('Unable to fetch related orders for confirmation view', relatedOrdersError);
          setRelatedOrders([]);
        }

        // Pharmacy coordinates are already included in /api/orders/[id] response
        if (found.pharmacy && 'latitude' in found.pharmacy && 'longitude' in found.pharmacy) {
          const pharm = found.pharmacy as unknown as { latitude: number; longitude: number; parkingInfo?: string };
          setPharmacyDetail({
            latitude: pharm.latitude,
            longitude: pharm.longitude,
            parkingInfo: pharm.parkingInfo,
          });
        } else {
          // Fallback: fetch pharmacy detail separately
          try {
            const pharmRes = await fetch(`/api/pharmacies/${found.pharmacyId}`);
            const pharmData = await pharmRes.json();
            setPharmacyDetail({
              latitude: pharmData.latitude,
              longitude: pharmData.longitude,
              parkingInfo: pharmData.parkingInfo,
            });
          } catch {
            // pharmacy detail fetch is non-critical
          }
        }
      } else {
        setError('Commande non trouvée');
      }
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, selectedOrderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const unitPrice = order && order.items.length > 0 ? order.items[0].price : 0;

  const handleNavigate = () => {
    if (pharmacyDetail) {
      openGoogleMaps(pharmacyDetail.latitude, pharmacyDetail.longitude);
    }
  };

  const qrValue = order?.verificationCode
    ? `PHARMAPP-${order.id}-${order.verificationCode}`
    : '';

  const handleDownloadQR = () => {
    const container = document.getElementById('order-qr-code');
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
        link.download = `pharmapp-${order?.verificationCode || 'qr'}.png`;
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

  const handleCopyCode = () => {
    if (order?.verificationCode) {
      navigator.clipboard.writeText(order.verificationCode).then(() => {
        toast.success('Code copié');
      }).catch(() => {
        toast.error('Impossible de copier');
      });
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 py-4 space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="flex flex-col items-center py-8 space-y-3">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="w-full px-4 sm:px-6 py-4">
        <ViewHeader
          title="Confirmation"
          back
        />
        <Card className="border-amber-100">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-3 flex justify-center">
              <PartyPopper className="w-12 h-12 text-amber-600" />
            </div>
            <h3 className="font-semibold mb-1">
              {error || 'Commande terminée'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error || 'Votre commande a été enregistrée avec succès.'}
            </p>
            <Button
              onClick={() => setCurrentView('order-history')}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Voir mes commandes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="w-full px-4 sm:px-6">
        <ViewHeader
          title="Confirmation"
          back
        />

        {/* Success Icon + Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center py-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-4"
          >
            <CheckCircle2 className="h-12 w-12 text-amber-600" />
          </motion.div>
          <h2 className="text-xl font-bold text-foreground">
            Commande confirmée !
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Votre commande a été enregistrée avec succès
          </p>

          {/* Prescription required warning */}
          {order.items.some(item => item.medication.needsPrescription) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 w-full max-w-sm"
            >
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-0.5">
                    Ordonnance obligatoire
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                    N'oubliez pas de munir votre ordonnance lors du retrait de vos médicaments.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* QR Code Card */}
        {order.verificationCode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="border-green-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <QrCode className="h-4 w-4 text-white/90" />
                  <p className="font-semibold text-sm text-white">
                    Code de vérification
                  </p>
                </div>
                <p className="text-xs text-white">
                  Présentez ce QR code à la pharmacie pour récupérer votre commande
                </p>
              </div>
              <CardContent className="p-6 flex flex-col items-center space-y-4">
                {/* QR Code */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                  <div id="order-qr-code">
                    <QRCodeSVG
                      value={qrValue}
                      size={180}
                      level="M"
                      includeMargin={false}
                      fgColor="#065f46"
                    />
                  </div>
                </div>

                {/* Verification code display */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-muted-foreground">Code :</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tracking-[0.3em] text-amber-700 font-mono">
                      {order.verificationCode}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="p-1.5 rounded-lg hover:bg-amber-50 text-muted-foreground hover:text-amber-600 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Download button */}
                <Button
                  variant="outline"
                  onClick={handleDownloadQR}
                  className="w-full max-w-xs h-10 border-amber-200 text-amber-700 hover:bg-amber-50 text-sm rounded-xl"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le QR Code
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Order Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-amber-100 overflow-hidden">
            {/* Pharmacy header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-3">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-white/80 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-white truncate">
                    {order.pharmacy.name}
                  </p>
                  <p className="text-xs text-amber-200 truncate">
                    {order.pharmacy.address}, {order.pharmacy.city}
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Medications */}
              {order.items.length === 1 ? (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Pill className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">
                      {order.items[0].medication.commercialName || order.items[0].medication.name}
                    </p>
                    {order.items[0].medication.form && (
                      <p className="text-xs text-muted-foreground">
                        {order.items[0].medication.form}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Pill className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">
                          {item.medication.commercialName || item.medication.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Quantité: {item.quantity} × {item.price.toLocaleString()} FCFA
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-amber-100" />

              {/* Price breakdown */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quantité totale</span>
                  <span className="font-medium">{order.totalQuantity}</span>
                </div>
                {order.items.length === 1 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Prix unitaire</span>
                    <span className="font-medium">
                      {unitPrice.toLocaleString()} FCFA
                    </span>
                  </div>
                )}
                <div className="border-t border-amber-100 pt-1.5 flex items-center justify-between">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-lg font-bold text-amber-700">
                    {order.totalPrice.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              {/* Note */}
              {order.note && (
                <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-2.5">
                  <MessageSquare className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">{order.note}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Related Orders Info */}
        {relatedOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/40">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-200 dark:bg-amber-800 flex items-center justify-center flex-shrink-0">
                    <Layers className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-1">
                      Commandes groupées
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      Vous avez <strong>{relatedOrders.length + 1} commande(s)</strong> auprès de <strong>{order.pharmacy.name}</strong>.
                      {relatedOrders.length > 0 && (
                        <span className="block mt-1">
                          Tous les médicaments seront disponibles au même point de retrait.
                        </span>
                      )}
                    </p>
                    {relatedOrders.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {relatedOrders.slice(0, 3).map((relatedOrder) => (
                          <Badge
                            key={relatedOrder.id}
                            variant="secondary"
                            className="text-[10px] bg-white dark:bg-gray-900 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                          >
                            <Pill className="h-2.5 w-2.5 mr-1" />
                            {relatedOrder.items.length === 1
                              ? (relatedOrder.items[0].medication.commercialName || relatedOrder.items[0].medication.name)
                              : `${relatedOrder.items.length} médicament${relatedOrder.items.length > 1 ? 's' : ''}`
                            }
                          </Badge>
                        ))}
                        {relatedOrders.length > 3 && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-white dark:bg-gray-900 text-muted-foreground"
                          >
                            +{relatedOrders.length - 3} autre(s)
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-4 space-y-2"
        >
          {/* Call pharmacy */}
          <a
            href={`tel:${order.pharmacy.phone}`}
            className="block"
          >
            <Button
              className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium text-sm"
            >
              <Phone className="h-4 w-4 mr-2" />
              Appeler la pharmacie
            </Button>
          </a>

          {/* Navigate */}
          {pharmacyDetail && (
            <Button
              variant="outline"
              className="w-full h-11 border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl font-medium text-sm"
              onClick={handleNavigate}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Y aller
            </Button>
          )}

          {/* View orders */}
          <Button
            variant="outline"
            className="w-full h-11 border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl font-medium text-sm"
            onClick={() => setCurrentView('order-history')}
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Voir mes commandes
          </Button>
        </motion.div>

        {/* Pickup info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-4"
        >
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
              <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Retrait en pharmacie
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                Présentez le QR code ou communiquez le code de vérification au pharmacien lors du retrait de votre commande.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
