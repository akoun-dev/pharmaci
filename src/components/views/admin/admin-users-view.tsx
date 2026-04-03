'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  RefreshCw,
  Shield,
  MoreVertical,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  Star,
  Heart,
  UserCog,
  Inbox,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ViewHeader } from '@/components/view-header';
import { toast } from 'sonner';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  city: string | null;
  createdAt: string;
  linkedPharmacyId: string | null;
  _count: {
    orders: number;
    reviews: number;
    favorites: number;
  };
}

type RoleTab = 'all' | 'patient' | 'pharmacist' | 'admin';

const ROLE_CONFIG: Record<string, { label: string; className: string; avatarBg: string; avatarText: string }> = {
  patient: {
    label: 'Patient',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    avatarBg: 'bg-emerald-100',
    avatarText: 'text-emerald-700',
  },
  pharmacist: {
    label: 'Pharmacien',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    avatarBg: 'bg-blue-100',
    avatarText: 'text-blue-700',
  },
  admin: {
    label: 'Admin',
    className: 'bg-violet-100 text-violet-700 border-violet-200',
    avatarBg: 'bg-violet-100',
    avatarText: 'text-violet-700',
  },
};

const ROLE_TABS: { key: RoleTab; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'patient', label: 'Patients' },
  { key: 'pharmacist', label: 'Pharmaciens' },
  { key: 'admin', label: 'Admins' },
];

const AVATAR_COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700' },
  { bg: 'bg-pink-100', text: 'text-pink-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `il y a ${diffMin}min`;
    if (diffH < 24) return `il y a ${diffH}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `il y a ${diffDays}j`;
    if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)}sem`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function AdminUsersView() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RoleTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const currentLimit = 20;
  const offsetRef = useRef(0);

  // Role edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = useCallback(async (append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }
      if (!append) offsetRef.current = 0;

      const params = new URLSearchParams({
        limit: String(currentLimit),
        offset: String(offsetRef.current),
      });
      if (activeTab !== 'all') params.set('role', activeTab);
      if (debouncedSearch) params.set('q', debouncedSearch);

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      const fetchedUsers = Array.isArray(data.items) ? data.items : [];

      if (append) {
        setUsers((prev) => [...prev, ...fetchedUsers]);
      } else {
        setUsers(fetchedUsers);
      }
      setTotal(data.total || 0);
      offsetRef.current = offsetRef.current + fetchedUsers.length;
    } catch {
      setError('Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [activeTab, debouncedSearch, currentLimit]);

  useEffect(() => {
    setUsers([]);
    fetchUsers(false);
  }, [activeTab, debouncedSearch, fetchUsers]);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setLoading(true);
    offsetRef.current = 0;
    fetchUsers(false);
  };

  const handleLoadMore = () => {
    if (loadingMore || users.length >= total) return;
    fetchUsers(true);
  };

  const openEditDialog = (user: UserData) => {
    setEditUser(user);
    setNewRole(user.role);
    setEditDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!editUser || !newRole || newRole === editUser.role || saving) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la modification');
      }

      // Update user in the list optimistically
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUser.id
            ? { ...u, role: newRole }
            : u
        )
      );

      toast.success(`Rôle de ${editUser.name} modifié en "${ROLE_CONFIG[newRole]?.label || newRole}"`);
      setEditDialogOpen(false);
      setEditUser(null);
      setNewRole('');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la modification du rôle');
    } finally {
      setSaving(false);
    }
  };

  // Role counts
  const roleCounts: Record<string, number> = { all: total };
  users.forEach((u) => {
    roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
  });

  const hasMore = users.length < total;

  // ── Loading skeletons ──
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-24 flex-shrink-0 rounded-full" />
          ))}
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
        <ViewHeader title="Utilisateurs" icon={<Users className="h-5 w-5 text-violet-600" />} />
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Erreur de chargement</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-violet-200 text-violet-700 hover:bg-violet-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 pb-28">
      {/* Header */}
      <ViewHeader
        title="Utilisateurs"
        icon={<Users className="h-5 w-5 text-violet-600" />}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {total}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-violet-600"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-sm border-violet-200 focus:border-violet-400"
          />
        </div>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-none">
        {ROLE_TABS.map((tab) => {
          const count = roleCounts[tab.key] || 0;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                isActive
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
              }`}
            >
              {tab.key === 'patient' && <Users className="h-3 w-3" />}
              {tab.key === 'pharmacist' && <Shield className="h-3 w-3" />}
              {tab.key === 'admin' && <UserCog className="h-3 w-3" />}
              {tab.label}
              <span
                className={`text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Users list */}
      {users.length === 0 ? (
        <Card className="border-violet-100">
          <CardContent className="p-8 text-center">
            <Inbox className="h-10 w-10 text-violet-300 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">
              {searchQuery
                ? 'Aucun résultat'
                : activeTab === 'all'
                  ? 'Aucun utilisateur'
                  : `Aucun ${ROLE_CONFIG[activeTab]?.label?.toLowerCase() || ''}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Aucun utilisateur ne correspond à votre recherche'
                : activeTab === 'all'
                  ? 'Les nouveaux utilisateurs apparaîtront ici'
                  : `Aucun utilisateur avec le rôle "${ROLE_CONFIG[activeTab]?.label || ''}"`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${debouncedSearch}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {users.map((user, index) => {
              const roleInfo = ROLE_CONFIG[user.role] || ROLE_CONFIG.patient;
              const avatarColor = getAvatarColor(user.name);
              const initial = user.name.charAt(0).toUpperCase();

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="border-violet-100 hover:border-violet-300 transition-colors overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${avatarColor.bg}`}
                        >
                          <span className={`text-sm font-bold ${avatarColor.text}`}>
                            {initial}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          {/* Name + Role */}
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate">{user.name}</h3>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${roleInfo.className}`}
                            >
                              {roleInfo.label}
                            </Badge>
                          </div>

                          {/* Email */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 min-w-0">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>

                          {/* Phone + City */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                            {user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </span>
                            )}
                            {user.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {user.city}
                              </span>
                            )}
                          </div>

                          {/* Stats + Date */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-0.5">
                                <ShoppingBag className="h-3 w-3" />
                                {user._count.orders}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Star className="h-3 w-3" />
                                {user._count.reviews}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Heart className="h-3 w-3" />
                                {user._count.favorites}
                              </span>
                            </div>
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatRelativeTime(user.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 ml-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-violet-600 hover:bg-violet-50"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => openEditDialog(user)}
                                className="gap-2 text-sm cursor-pointer"
                              >
                                <UserCog className="h-4 w-4" />
                                Modifier le rôle
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Load more */}
      {users.length > 0 && hasMore && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="border-violet-200 text-violet-700 hover:bg-violet-50 px-6"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Chargement...
              </>
            ) : (
              `Charger plus (${total - users.length} restants)`
            )}
          </Button>
        </div>
      )}

      {/* ── Role Edit Dialog ── */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditUser(null);
            setNewRole('');
          }
          setEditDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md mx-auto p-0 gap-0 overflow-hidden rounded-2xl border-violet-200">
          <DialogHeader className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 text-white shrink-0">
            <DialogTitle className="text-base flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Modifier le rôle
            </DialogTitle>
            <DialogDescription className="text-violet-200 text-xs mt-1">
              {editUser
                ? `Changer le rôle de ${editUser.name}`
                : 'Sélectionnez un nouveau rôle'}
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4">
            {/* User info */}
            {editUser && (
              <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-lg">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${getAvatarColor(editUser.name).bg}`}
                >
                  <span
                    className={`text-sm font-bold ${getAvatarColor(editUser.name).text}`}
                  >
                    {editUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{editUser.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {editUser.email}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] flex-shrink-0 ${
                    ROLE_CONFIG[editUser.role]?.className || ''
                  }`}
                >
                  {ROLE_CONFIG[editUser.role]?.label || editUser.role}
                </Badge>
              </div>
            )}

            {/* Role selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Nouveau rôle
              </label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="h-11 border-violet-200 focus:border-violet-400">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-600" />
                      Patient
                    </span>
                  </SelectItem>
                  <SelectItem value="pharmacist">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      Pharmacien
                    </span>
                  </SelectItem>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-violet-600" />
                      Administrateur
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Warning for admin role */}
            {newRole === 'admin' && editUser?.role !== 'admin' && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Le rôle administrateur donne un accès complet à la plateforme. Soyez sûr
                  de vouloir attribuer ce rôle.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={saving}
                className="flex-1 h-11 border-violet-200 text-violet-700 hover:bg-violet-50"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveRole}
                disabled={saving || !newRole || newRole === editUser?.role}
                className="flex-1 h-11 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
