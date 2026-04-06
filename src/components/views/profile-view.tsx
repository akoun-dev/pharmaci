'use client';

import { logger } from '@/lib/logger';
import { fetcher } from '@/lib/fetcher';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Settings,
  LogOut,
  Search,
  Clock,
  Info,
  ChevronRight,
  ShieldCheck,
  Heart,
  Building2,
  ClipboardList,
  Lock,
  Bell,
  Tag,
  ShoppingCart,
  Globe,
  Sun,
  Moon,
  Loader2,
  Pencil,
  Check,
  X,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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

export function ProfileView() {
  const { currentUser, currentUserId, setCurrentView: setView, logout, darkMode, toggleDarkMode } = useAppStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);

  // Edit profile
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);

  // Password dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Notification settings
  const NOTIF_STORAGE_KEY = 'pharmapp-notif-prefs';
  const defaultNotifSettings: NotificationSetting[] = [
    { id: 'order_updates', label: 'Mises à jour de commandes', description: 'Notifications pour les changements de statut', icon: ShoppingCart, enabled: true },
    { id: 'promotions', label: 'Promotions', description: 'Offres spéciales et réductions', icon: Tag, enabled: true },
    { id: 'stock_alerts', label: 'Alertes stock', description: 'Quand un médicament recherché est disponible', icon: Bell, enabled: false },
    { id: 'news', label: 'Actualités', description: 'Nouvelles fonctionnalités et informations', icon: Info, enabled: false },
  ];
  const [notifSettings, setNotifSettings] = useState<NotificationSetting[]>(() => {
    if (typeof window === 'undefined') return defaultNotifSettings;
    try {
      const saved = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, boolean>;
        return defaultNotifSettings.map((s) => ({
          ...s,
          enabled: parsed[s.id] !== undefined ? parsed[s.id] : s.enabled,
        }));
      }
    } catch {
      // ignore parse errors
    }
    return defaultNotifSettings;
  });

  const fetchUser = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/users/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setRecentSearches(data.searchHistory || []);
        setEditName(data.name || '');
        setEditPhone(data.phone || '');
        setEditCity(data.city || '');
        setEditAddress(data.address || '');
      }
    } catch (error) {
      logger.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    try {
      await fetcher('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors
    }
    logout();
    toast.success('Déconnecté');
  };

  const handleSearchClick = (query: string) => {
    useAppStore.getState().setSearchQuery(query);
    setView('search');
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error('Le nom est requis');
      return;
    }
    setSaving(true);
    try {
      const res = await fetcher('/api/users', {
        method: 'PUT',
        body: JSON.stringify({
          name: editName,
          phone: editPhone || null,
          city: editCity || null,
          address: editAddress || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        // Update store
        if (currentUser) {
          useAppStore.getState().setCurrentUser({
            ...currentUser,
            name: data.name,
            phone: data.phone,
            city: data.city,
          });
        }
        setEditing(false);
        toast.success('Profil mis à jour avec succès');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la mise à jour');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

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
      const res = await fetcher('/api/auth/password', {
        method: 'PUT',
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

  // Persist notification settings to localStorage
  useEffect(() => {
    try {
      const prefs: Record<string, boolean> = {};
      notifSettings.forEach((s) => {
        prefs[s.id] = s.enabled;
      });
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore storage errors
    }
  }, [notifSettings]);

  const handleToggleNotif = (id: string) => {
    setNotifSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : currentUser?.name
        ? currentUser.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    : '??';

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 py-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="w-full px-4 sm:px-6">
        <ViewHeader title="Mon Profil" icon={<User className="h-5 w-5 text-amber-600" />} />

        {/* User card */}
        {currentUser ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-amber-100 dark:border-amber-900/50 mb-4">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Avatar className="h-12 w-12 sm:h-14 sm:w-14 bg-amber-100 flex-shrink-0">
                    <AvatarFallback className="bg-amber-100 text-amber-700 text-base sm:text-lg font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-base sm:text-lg truncate">{currentUser.name}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{currentUser.email}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-green-50 text-green-700"
                      >
                        {currentUser.role === 'pharmacist' ? 'Pharmacien' : 'Patient'}
                      </Badge>
                      {currentUser.city && (
                        <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {currentUser.city}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {currentUser.role === 'pharmacist' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-200 text-amber-700 text-xs"
                        onClick={() => setView('pharmacy-dashboard')}
                      >
                        <Building2 className="h-3.5 w-3.5 mr-1" />
                        Gestion
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-green-200 text-green-700 hover:bg-green-50"
                      onClick={() => {
                        setEditName(currentUser.name || '');
                        setEditPhone(currentUser.phone || '');
                        setEditCity(currentUser.city || '');
                        setEditAddress(user?.address || '');
                        setEditing(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {currentUser.phone && (
                  <div className="flex items-center gap-2 mt-3 text-xs sm:text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{currentUser.phone}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-amber-100">
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold text-green-700">
                      {user?._count?.reviews || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Avis</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold text-green-700">
                      {user?.favorites?.length || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Favoris</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold text-green-700">
                      {user?._count?.orders || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Commandes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold text-green-700">
                      {recentSearches.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Recherches</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-amber-100 mb-4">
              <CardContent className="p-5 sm:p-6 text-center">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 mx-auto mb-3 bg-amber-50">
                  <AvatarFallback className="bg-amber-50 text-amber-600">
                    <User className="h-7 w-7 sm:h-8 sm:w-8" />
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold mb-1">Connectez-vous</h3>
                <p className="text-sm text-muted-foreground">
                  Vous n&apos;êtes pas connecté. Rechargez la page pour accéder à l&apos;écran de connexion.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Edit Profile Dialog */}
        <Dialog open={editing} onOpenChange={setEditing}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Modifier le profil</DialogTitle>
              <DialogDescription className="text-xs">
                Mettez à jour vos informations personnelles.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nom complet *</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 text-sm"
                  placeholder="Votre nom"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Téléphone</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="h-10 text-sm"
                  placeholder="+225 XX XX XX XX"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ville</Label>
                <Input
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="h-10 text-sm"
                  placeholder="Ex: Abidjan"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Adresse</Label>
                <Input
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="h-10 text-sm"
                  placeholder="Quartier, rue..."
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                className="text-xs"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Annuler
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
              >
                {saving ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Enregistrement...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    Enregistrer
                  </span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Recent searches */}
        {currentUser && recentSearches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <Card className="border-amber-100 dark:border-amber-900/50">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  <h3 className="font-semibold text-sm">Recherches récentes</h3>
                </div>
                <div className="space-y-1">
                  {recentSearches.slice(0, 8).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSearchClick(s.query)}
                      className="flex items-center gap-3 w-full text-left text-sm hover:bg-amber-50 dark:hover:bg-amber-950/30 p-2 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                        <Search className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="flex-1 truncate text-xs">{s.query}</span>
                      <Badge variant="outline" className="text-[10px] flex-shrink-0 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                        {s.searchType}
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Card className="border-amber-100 dark:border-amber-900/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                <h3 className="font-semibold text-sm">Accès rapide</h3>
              </div>
              <div className="space-y-1">
                {[
                  { icon: Search, label: 'Rechercher', view: 'search' as const },
                  { icon: Globe, label: 'Carte', view: 'map' as const },
                  { icon: ClipboardList, label: 'Mes commandes', view: 'order-history' as const },
                  { icon: Heart, label: 'Mes favoris', view: 'favorites' as const },
                  { icon: Star, label: 'Mes avis', view: 'my-reviews' as const },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setView(item.view)}
                    className="flex items-center gap-3 w-full text-left text-sm hover:bg-amber-50 dark:hover:bg-amber-950/30 p-2.5 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="flex-1 text-xs font-medium">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
                {currentUser?.role === 'pharmacist' && (
                  <button
                    onClick={() => setView('pharmacy-dashboard')}
                    className="flex items-center gap-3 w-full text-left text-sm hover:bg-amber-50 dark:hover:bg-amber-950/30 p-2.5 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="flex-1 text-xs font-medium">Gestion pharmacie</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>


        {/* Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mt-4"
        >
          <Card className="border-amber-100 dark:border-amber-900/50">
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4 text-amber-600" />
                Paramètres
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-0">
              {/* Change password */}
              <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-3 w-full text-left p-2.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                      <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-xs font-medium flex-1">Changer le mot de passe</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
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
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
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

              <Separator />

              {/* Dark mode */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                    {darkMode ? <Moon className="h-4 w-4 text-amber-600 dark:text-amber-400" /> : <Sun className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium">Mode sombre</p>
                    <p className="text-[10px] text-muted-foreground">{darkMode ? 'Activé' : 'Désactivé'}</p>
                  </div>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={() => toggleDarkMode()}
                  className="flex-shrink-0"
                />
              </div>
              <Separator />

              {/* Language */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-4 w-4 text-amber-600 dark:text-amber-400" />
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
            </CardContent>
          </Card>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mt-4"
        >
          {currentUser && (
            <Card className="border-red-100 dark:border-red-900/50">
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
          )}
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4"
        >
          <Card className="border-amber-100 dark:border-amber-900/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                <h3 className="font-semibold text-sm">À propos</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Pharma CI est votre application de référence pour trouver des pharmacies et
                médicaments en Côte d&apos;Ivoire. Recherchez, comparez les prix et trouvez les
                pharmacies de garde près de chez vous.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">Version 1.0.0 • 2025</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
