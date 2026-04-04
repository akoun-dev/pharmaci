'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  User,
  Mail,
  Phone,
  Lock,
  Bell,
  ShoppingCart,
  AlertTriangle,
  Star,
  MessageCircle,
  Globe,
  Sun,
  Moon,
  HelpCircle,
  Headphones,
  LogOut,
  ChevronRight,
  Shield,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAppStore } from '@/store/app-store';
import { ViewHeader } from '@/components/view-header';
import { toast } from 'sonner';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: typeof ShoppingCart;
  enabled: boolean;
}

export function PharmacistSettingsView() {
  const { currentUser, logout, setCurrentView, darkMode, toggleDarkMode } = useAppStore();

  // Notification settings
  const [notifSettings, setNotifSettings] = useState<NotificationSetting[]>([
    { id: 'new_orders', label: 'Nouvelles commandes', description: 'Alerte pour chaque nouvelle commande', icon: ShoppingCart, enabled: true },
    { id: 'stock_alerts', label: 'Alertes stock', description: 'Notification quand le stock est bas', icon: AlertTriangle, enabled: true },
    { id: 'reviews', label: 'Avis clients', description: 'Notification pour chaque nouvel avis', icon: Star, enabled: false },
    { id: 'messages', label: 'Messages', description: 'Notification pour les nouveaux messages', icon: MessageCircle, enabled: true },
  ]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState<string | null>(null);

  // Password dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // ── Load notification preferences ─────────────────────────
  useEffect(() => {
    async function loadNotifPrefs() {
      try {
        setNotifLoading(true);
        const res = await fetch('/api/pharmacist/settings/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifSettings((prev) =>
            prev.map((s) => ({
              ...s,
              enabled: data[s.id] ?? s.enabled,
            }))
          );
        }
      } catch {
        // Use defaults
      } finally {
        setNotifLoading(false);
      }
    }
    loadNotifPrefs();
  }, []);

  // ── Toggle notification ──────────────────────────────────
  const handleToggleNotif = async (id: string) => {
    const newValue = !notifSettings.find((s) => s.id === id)?.enabled;

    // Optimistic update
    setNotifSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: newValue } : s))
    );

    try {
      setNotifSaving(id);
      const body: Record<string, boolean> = {};
      body[id] = newValue;
      const res = await fetch('/api/pharmacist/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        // Revert on error
        setNotifSettings((prev) =>
          prev.map((s) => (s.id === id ? { ...s, enabled: !newValue } : s))
        );
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur serveur');
    } finally {
      setNotifSaving(null);
    }
  };

  // ── Change password ──────────────────────────────────────
  const handleChangePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit avoir au moins 6 caractères');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setPasswordSaving(true);
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors du changement de mot de passe');
      }

      toast.success('Mot de passe mis à jour avec succès');
      setPasswordDialogOpen(false);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur serveur');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors
    }
    logout();
    toast.success('Déconnecté');
  };

  return (
    <div className="pb-4">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ViewHeader
          title="Paramètres"
          icon={<Settings className="h-5 w-5 text-emerald-600" />}
        />

        {/* Account Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-emerald-100 dark:border-emerald-900/50 mb-4">
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                Compte
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">Nom</p>
                  <p className="text-xs font-medium truncate">{currentUser?.name || 'Non renseigné'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">Email</p>
                  <p className="text-xs font-medium truncate">{currentUser?.email || 'Non renseigné'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">Téléphone</p>
                  <p className="text-xs font-medium truncate">{currentUser?.phone || 'Non renseigné'}</p>
                </div>
              </div>

              <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-10 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Lock className="h-3.5 w-3.5 mr-2" />
                    Changer le mot de passe
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base">Changer le mot de passe</DialogTitle>
                    <DialogDescription className="text-xs">
                      Entrez votre mot de passe actuel et le nouveau mot de passe.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Mot de passe actuel</Label>
                      <Input
                        type="password"
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                        className="h-10 text-sm"
                        placeholder="Mot de passe actuel"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nouveau mot de passe</Label>
                      <Input
                        type="password"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        className="h-10 text-sm"
                        placeholder="Nouveau mot de passe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Confirmer le mot de passe</Label>
                      <Input
                        type="password"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        className="h-10 text-sm"
                        placeholder="Confirmer le mot de passe"
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPasswordDialogOpen(false)}
                      className="text-xs"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      disabled={passwordSaving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      {passwordSaving ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Mise à jour...
                        </span>
                      ) : (
                        'Confirmer'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-emerald-100 dark:border-emerald-900/50 mb-4">
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald-600" />
                Préférences de notification
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-0">
              {notifLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <div className="space-y-1">
                          <Skeleton className="h-3 w-28" />
                          <Skeleton className="h-2.5 w-40" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-10" />
                    </div>
                  ))}
                </div>
              ) : (
                notifSettings.map((setting, index) => {
                  const Icon = setting.icon;
                  const isSaving = notifSaving === setting.id;
                  return (
                    <div key={setting.id}>
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium">{setting.label}</p>
                            <p className="text-[10px] text-muted-foreground">{setting.description}</p>
                          </div>
                        </div>
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-600 flex-shrink-0" />
                        ) : (
                          <Switch
                            checked={setting.enabled}
                            onCheckedChange={() => handleToggleNotif(setting.id)}
                            className="flex-shrink-0"
                          />
                        )}
                      </div>
                      {index < notifSettings.length - 1 && <Separator />}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferences Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-emerald-100 dark:border-emerald-900/50 mb-4">
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-600" />
                Préférences
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-0">
              {/* Language */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium">Langue</p>
                    <p className="text-[10px] text-muted-foreground">Français</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded-md">
                  <Lock className="h-3 w-3" />
                  Verrouillé
                </div>
              </div>

              <Separator />

              {/* Theme */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    {darkMode ? <Moon className="h-4 w-4 text-purple-600" /> : <Sun className="h-4 w-4 text-amber-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium">Thème</p>
                    <p className="text-[10px] text-muted-foreground">{darkMode ? 'Sombre' : 'Clair'}</p>
                  </div>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={() => toggleDarkMode()}
                  className="flex-shrink-0"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Support Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-emerald-100 dark:border-emerald-900/50 mb-4">
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Headphones className="h-4 w-4 text-emerald-600" />
                Support
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1">
              <button
                onClick={() => setCurrentView('ph-faq')}
                className="flex items-center gap-3 w-full text-left p-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs font-medium flex-1">FAQ - Questions fréquentes</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
              <button
                onClick={() => setCurrentView('ph-messages')}
                className="flex items-center gap-3 w-full text-left p-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
              >
                <Headphones className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs font-medium flex-1">Contacter le support</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-red-100 dark:border-red-900/50 mb-4">
            <CardContent className="p-4">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full h-11 text-sm font-medium text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Se déconnecter
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* App Version */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[10px] font-medium text-emerald-700">Pharma CI</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Version 1.0.0</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
