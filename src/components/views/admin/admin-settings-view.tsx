'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Loader2, Eye, EyeOff } from 'lucide-react';
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
  ShieldCheck,
  Globe,
  Server,
  HardDrive,
  Users,
  Building2,
  Pill,
  ShoppingCart,
  TriangleAlert,
  KeyRound,
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

  /* ---- Password change state ---- */
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

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

  /* ---- Password change handler ---- */
  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword.trim()) {
      toast.error('Veuillez saisir votre ancien mot de passe');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('La confirmation ne correspond pas au nouveau mot de passe');
      return;
    }
    if (currentPassword === newPassword) {
      toast.error('Le nouveau mot de passe doit être différent de l\'ancien');
      return;
    }

    try {
      setPwLoading(true);
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur serveur');
      }

      toast.success('Mot de passe modifié avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur serveur';
      toast.error(message);
    } finally {
      setPwLoading(false);
    }
  };

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
          <div className="rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 px-5 py-5 text-white">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-amber-200" />
              <p className="text-sm font-medium text-amber-100">
                Administration
              </p>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-1">
              Paramètres
            </h1>
            <p className="text-sm text-amber-100 mt-1">
              Configuration de la plateforme Pharma CI
            </p>
          </div>
        </motion.div>

        {/* ─── APP INFO ─── */}
        <motion.div variants={itemVariants}>
          <Card className="border-amber-100">
            <CardHeader className="flex flex-row items-center gap-3 pb-3 px-4 pt-4">
              <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-amber-100">
                <Info className="h-4.5 w-4.5 text-amber-600" />
              </div>
              <CardTitle className="text-sm sm:text-base font-semibold">
                Informations de l&apos;application
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <InfoRow icon={<Globe className="h-4 w-4 text-amber-500" />} label="Nom" value="Pharma CI" />
              <Separator />
              <InfoRow icon={<Server className="h-4 w-4 text-amber-500" />} label="Version" value="v1.0.0" />
              <Separator />
              <InfoRow icon={<HardDrive className="h-4 w-4 text-amber-500" />} label="Environnement" value="Production" />
              <Separator />
              <InfoRow icon={<Globe className="h-4 w-4 text-amber-500" />} label="Région" value="Côte d&apos;Ivoire" />
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── DATABASE STATS ─── */}
        <motion.div variants={itemVariants}>
          <Card className="border-amber-100">
            <CardHeader className="flex flex-row items-center gap-3 pb-3 px-4 pt-4">
              <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-amber-100">
                <Database className="h-4.5 w-4.5 text-amber-600" />
              </div>
              <CardTitle className="text-sm sm:text-base font-semibold">
                Statistiques de la base de données
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {statsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-amber-50 rounded-xl p-3 text-center">
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
          <Card className="border-amber-100">
            <CardHeader className="flex flex-row items-center gap-3 pb-3 px-4 pt-4">
              <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-amber-100">
                <ShieldCheck className="h-4.5 w-4.5 text-amber-600" />
              </div>
              <CardTitle className="text-sm sm:text-base font-semibold">
                Compte administrateur
              </CardTitle>
              <Badge className="ml-auto bg-amber-100 text-amber-700 border-0 text-xs">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <InfoRow icon={<User className="h-4 w-4 text-amber-500" />} label="Nom" value={currentUser?.name ?? '—'} />
              <Separator />
              <InfoRow icon={<Globe className="h-4 w-4 text-amber-500" />} label="Email" value={currentUser?.email ?? '—'} />
              <Separator />
              <InfoRow icon={<User className="h-4 w-4 text-amber-500" />} label="Téléphone" value={currentUser?.phone ?? 'Non renseigné'} />
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── CHANGE PASSWORD ─── */}
        <motion.div variants={itemVariants}>
          <Card className="border-amber-100">
            <CardHeader className="flex flex-row items-center gap-3 pb-3 px-4 pt-4">
              <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-amber-100">
                <KeyRound className="h-4.5 w-4.5 text-amber-600" />
              </div>
              <CardTitle className="text-sm sm:text-base font-semibold">
                Changer le mot de passe
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Modifiez votre mot de passe pour sécuriser votre compte.
              </p>

              <div className="space-y-3">
                {/* Current password */}
                <div className="space-y-1.5">
                  <Label htmlFor="current-pw" className="text-xs font-medium text-muted-foreground">
                    Ancien mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="current-pw"
                      type={showCurrentPw ? 'text' : 'password'}
                      placeholder="Saisissez l'ancien mot de passe"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pr-10 h-11 text-sm border-amber-200 focus:border-amber-400"
                      disabled={pwLoading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-amber-600 transition-colors"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      tabIndex={-1}
                      aria-label={showCurrentPw ? 'Masquer' : 'Afficher'}
                    >
                      {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw" className="text-xs font-medium text-muted-foreground">
                    Nouveau mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-pw"
                      type={showNewPw ? 'text' : 'password'}
                      placeholder="Minimum 6 caractères"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10 h-11 text-sm border-amber-200 focus:border-amber-400"
                      disabled={pwLoading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-amber-600 transition-colors"
                      onClick={() => setShowNewPw(!showNewPw)}
                      tabIndex={-1}
                      aria-label={showNewPw ? 'Masquer' : 'Afficher'}
                    >
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword.length > 0 && newPassword.length < 6 && (
                    <p className="text-[11px] text-amber-600">
                      Le mot de passe doit contenir au moins 6 caractères
                    </p>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pw" className="text-xs font-medium text-muted-foreground">
                    Confirmer le mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-pw"
                      type={showConfirmPw ? 'text' : 'password'}
                      placeholder="Retapez le nouveau mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pr-10 h-11 text-sm ${
                        confirmPassword.length > 0 && confirmPassword !== newPassword
                          ? 'border-red-300 focus:border-red-400'
                          : confirmPassword.length > 0 && confirmPassword === newPassword
                            ? 'border-orange-300 focus:border-orange-400'
                            : 'border-amber-200 focus:border-amber-400'
                      }`}
                      disabled={pwLoading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-amber-600 transition-colors"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      tabIndex={-1}
                      aria-label={showConfirmPw ? 'Masquer' : 'Afficher'}
                    >
                      {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                    <p className="text-[11px] text-red-600">
                      Les mots de passe ne correspondent pas
                    </p>
                  )}
                  {confirmPassword.length > 0 && confirmPassword === newPassword && newPassword.length >= 6 && (
                    <p className="text-[11px] text-orange-600">
                      Les mots de passe correspondent
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white h-11"
              >
                {pwLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
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
            Pharma CI © 2025 — Tous droits réservés
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
    <div className="bg-amber-50 rounded-xl p-3 text-center">
      <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 text-amber-600 mb-1.5 mx-auto">
        {icon}
      </div>
      <p className="text-lg font-bold text-amber-700 leading-tight">
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
