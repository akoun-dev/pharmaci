'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  Info,
  Database,
  User,
  Shield,
  Globe,
  Server,
  HardDrive,
  Users,
  Building2,
  Pill,
  ShoppingCart,
  TriangleAlert,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DbStats {
  totalUsers: number;
  totalPharmacies: number;
  totalMedications: number;
  totalOrders: number;
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminSettingsView() {
  const { currentUser } = useAppStore();

  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  /* ---- Fetch DB stats ---- */
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const json = await res.json();
        setDbStats({
          totalUsers: json.users?.total ?? 0,
          totalPharmacies: json.pharmacies?.total ?? 0,
          totalMedications: json.medications?.total ?? 0,
          totalOrders: json.orders?.total ?? 0,
        });
      }
    } catch {
      // Stats are optional — fail silently
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const firstName = currentUser?.name?.split(' ')[0] ?? 'Admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 lg:pb-6 pt-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* ─── HEADER ─── */}
        <motion.div variants={itemVariants}>
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 px-5 py-5 text-white">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-violet-200" />
              <p className="text-sm font-medium text-violet-100">
                Administration
              </p>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-1">
              Paramètres
            </h1>
            <p className="text-sm text-violet-100 mt-1">
              Configuration de la plateforme PharmApp CI
            </p>
          </div>
        </motion.div>

        {/* ─── APP INFO ─── */}
        <motion.div variants={itemVariants}>
          <Card className="border-violet-100">
            <CardHeader className="flex flex-row items-center gap-3 pb-3 px-4 pt-4">
              <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-violet-100">
                <Info className="h-4.5 w-4.5 text-violet-600" />
              </div>
              <CardTitle className="text-sm sm:text-base font-semibold">
                Informations de l&apos;application
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <InfoRow icon={<Globe className="h-4 w-4 text-violet-500" />} label="Nom" value="PharmApp CI" />
              <Separator />
              <InfoRow icon={<Server className="h-4 w-4 text-violet-500" />} label="Version" value="v1.0.0" />
              <Separator />
              <InfoRow icon={<HardDrive className="h-4 w-4 text-violet-500" />} label="Environnement" value="Production" />
              <Separator />
              <InfoRow icon={<Globe className="h-4 w-4 text-violet-500" />} label="Région" value="Côte d&apos;Ivoire" />
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── DATABASE STATS ─── */}
        <motion.div variants={itemVariants}>
          <Card className="border-violet-100">
            <CardHeader className="flex flex-row items-center gap-3 pb-3 px-4 pt-4">
              <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-violet-100">
                <Database className="h-4.5 w-4.5 text-violet-600" />
              </div>
              <CardTitle className="text-sm sm:text-base font-semibold">
                Statistiques de la base de données
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {statsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-violet-50 rounded-xl p-3 text-center">
                      <Skeleton className="h-7 w-12 mx-auto mb-1" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                  ))}
                </div>
              ) : dbStats ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatBlock
                    icon={<Users className="h-5 w-5" />}
                    value={dbStats.totalUsers}
                    label="Utilisateurs"
                  />
                  <StatBlock
                    icon={<Building2 className="h-5 w-5" />}
                    value={dbStats.totalPharmacies}
                    label="Pharmacies"
                  />
                  <StatBlock
                    icon={<Pill className="h-5 w-5" />}
                    value={dbStats.totalMedications}
                    label="Médicaments"
                  />
                  <StatBlock
                    icon={<ShoppingCart className="h-5 w-5" />}
                    value={dbStats.totalOrders}
                    label="Commandes"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Impossible de charger les statistiques
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── ADMIN ACCOUNT ─── */}
        <motion.div variants={itemVariants}>
          <Card className="border-violet-100">
            <CardHeader className="flex flex-row items-center gap-3 pb-3 px-4 pt-4">
              <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-violet-100">
                <Shield className="h-4.5 w-4.5 text-violet-600" />
              </div>
              <CardTitle className="text-sm sm:text-base font-semibold">
                Compte administrateur
              </CardTitle>
              <Badge className="ml-auto bg-violet-100 text-violet-700 border-0 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <InfoRow icon={<User className="h-4 w-4 text-violet-500" />} label="Nom" value={currentUser?.name ?? '—'} />
              <Separator />
              <InfoRow icon={<Globe className="h-4 w-4 text-violet-500" />} label="Email" value={currentUser?.email ?? '—'} />
              <Separator />
              <InfoRow icon={<User className="h-4 w-4 text-violet-500" />} label="Téléphone" value={currentUser?.phone ?? 'Non renseigné'} />
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── DANGER ZONE ─── */}
        <motion.div variants={itemVariants}>
          <Card className="border-red-200">
            <CardHeader className="flex flex-row items-center gap-3 pb-3 px-4 pt-4">
              <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-red-100">
                <TriangleAlert className="h-4.5 w-4.5 text-red-600" />
              </div>
              <CardTitle className="text-sm sm:text-base font-semibold text-red-700">
                Zone dangereuse
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm text-muted-foreground mb-4">
                Actions irréversibles. Veuillez vérifier attentivement avant de continuer.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <TriangleAlert className="h-4 w-4 mr-2" />
                    Réinitialiser les données
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-red-200">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-700 flex items-center gap-2">
                      <TriangleAlert className="h-5 w-5" />
                      Confirmer la réinitialisation
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera toutes les données de la plateforme
                      (utilisateurs, pharmacies, médicaments, commandes). Cette
                      opération est <strong>irréversible</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-gray-200">
                      Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => {
                        toast.info('Fonctionnalité non disponible en démonstration');
                      }}
                    >
                      Réinitialiser
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── FOOTER ─── */}
        <motion.div variants={itemVariants}>
          <p className="text-center text-xs text-muted-foreground py-2">
            PharmApp CI © 2025 — Tous droits réservés
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0">{icon}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-medium truncate text-right">{value}</span>
    </div>
  );
}

function StatBlock({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-violet-50 rounded-xl p-3 text-center">
      <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-violet-100 text-violet-600 mb-1.5 mx-auto">
        {icon}
      </div>
      <p className="text-lg font-bold text-violet-700 leading-tight">
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
