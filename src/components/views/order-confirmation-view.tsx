'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Phone,
  Navigation,
  ClipboardList,
  Pill,
  CreditCard,
  Clock,
  MessageSquare,
  Package,
  Store,
  QrCode,
  Download,
  Copy,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ViewHeader } from '@/components/view-header';
import { useAppStore } from '@/store/app-store';
import { openGoogleMaps, PAYMENT_LABELS } from '@/lib/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

interface OrderData {
  id: string;
  status: string;
  quantity: number;
  totalPrice: number;
  note?: string | null;
  paymentMethod?: string | null;
  pickupTime?: string | null;
  createdAt: string;
  pharmacyId: string;
  verificationCode?: string | null;
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

interface PharmacyDetail {
  latitude: number;
  longitude: number;
  paymentMethods: string;
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
  const [pharmacyDetail, setPharmacyDetail] = useState<PharmacyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      setError('Utilisateur non connecté');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/orders');
      const data = await res.json();
      const orders: OrderData[] = Array.isArray(data) ? data : [];
      const found = selectedOrderId
        ? orders.find((o) => o.id === selectedOrderId)
        : orders[0];
      if (found) {
        setOrder(found);
        // Fetch pharmacy detail for lat/lng
        try {
          const pharmRes = await fetch(`/api/pharmacies/${found.pharmacyId}`);
          const pharmData = await pharmRes.json();
          setPharmacyDetail({
            latitude: pharmData.latitude,
            longitude: pharmData.longitude,
            paymentMethods: pharmData.paymentMethods || '[]',
            parkingInfo: pharmData.parkingInfo,
          });
        } catch {
          // pharmacy detail fetch is non-critical
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

  const unitPrice = order ? Math.round(order.totalPrice / order.quantity) : 0;

  const handleNavigate = () => {
    if (pharmacyDetail) {
      openGoogleMaps(pharmacyDetail.latitude, pharmacyDetail.longitude);
    }
  };

  const qrValue = order?.verificationCode
    ? `PHARMAPP-${order.id}-${order.verificationCode}`
    : '';

  const handleDownloadQR = () => {
    const svg = document.getElementById('order-qr-code');
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 space-y-4">
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
        <ViewHeader
          title="Confirmation"
          back
        />
        <Card className="border-emerald-100">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-3">😕</div>
            <h3 className="font-semibold mb-1">
              {error || 'Commande introuvable'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              La commande demandée n&apos;a pas pu être trouvée.
            </p>
            <Button
              onClick={() => setCurrentView('order-history')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Voir mes commandes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
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
            className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
          >
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </motion.div>
          <h2 className="text-xl font-bold text-foreground">
            Commande confirmée !
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Votre commande a été enregistrée avec succès
          </p>
        </motion.div>

        {/* QR Code Card */}
        {order.verificationCode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="border-emerald-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <QrCode className="h-4 w-4 text-white/90" />
                  <p className="font-semibold text-sm text-white">
                    Code de vérification
                  </p>
                </div>
                <p className="text-xs text-emerald-200">
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
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-muted-foreground">Code :</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tracking-[0.3em] text-emerald-700 font-mono">
                      {order.verificationCode}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Download button */}
                <Button
                  variant="outline"
                  onClick={handleDownloadQR}
                  className="w-full max-w-xs h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-sm rounded-xl"
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
          <Card className="border-emerald-100 overflow-hidden">
            {/* Pharmacy header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-white/80 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-white truncate">
                    {order.pharmacy.name}
                  </p>
                  <p className="text-xs text-emerald-200 truncate">
                    {order.pharmacy.address}, {order.pharmacy.city}
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Medication */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Pill className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">
                    {order.medication.commercialName || order.medication.name}
                  </p>
                  {order.medication.form && (
                    <p className="text-xs text-muted-foreground">
                      {order.medication.form}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-emerald-100" />

              {/* Price breakdown */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quantité</span>
                  <span className="font-medium">{order.quantity}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prix unitaire</span>
                  <span className="font-medium">
                    {unitPrice.toLocaleString()} FCFA
                  </span>
                </div>
                <div className="border-t border-emerald-100 pt-1.5 flex items-center justify-between">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-lg font-bold text-emerald-700">
                    {order.totalPrice.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              {/* Payment method */}
              {order.paymentMethod && (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">Paiement :</span>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-emerald-50 text-emerald-700"
                  >
                    {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                  </Badge>
                </div>
              )}

              {/* Pickup time */}
              {order.pickupTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    Retrait prévu à {order.pickupTime}
                  </span>
                </div>
              )}

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
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm"
            >
              <Phone className="h-4 w-4 mr-2" />
              Appeler la pharmacie
            </Button>
          </a>

          {/* Navigate */}
          {pharmacyDetail && (
            <Button
              variant="outline"
              className="w-full h-11 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl font-medium text-sm"
              onClick={handleNavigate}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Y aller
            </Button>
          )}

          {/* View orders */}
          <Button
            variant="outline"
            className="w-full h-11 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl font-medium text-sm"
            onClick={() => setCurrentView('order-history')}
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Voir mes commandes
          </Button>
        </motion.div>

        {/* Pickup info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 flex items-start gap-2.5 p-3 bg-emerald-50 rounded-xl"
        >
          <Package className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-800 leading-relaxed">
            Retrait en pharmacie — Présentez le QR code ou communiquez le code
            de vérification au pharmacien lors du retrait de votre commande.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
