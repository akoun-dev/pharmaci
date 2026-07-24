"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Loader2,
  Trash2,
  ChevronDown,
  Shield,
  User,
  Building2,
} from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  city: string | null;
  district: string | null;
  createdAt: string;
  pharmacy: { id: string; name: string } | null;
  _count: { orders: number; reviews: number };
}

const ROLE_LABELS: Record<string, string> = {
  PATIENT: "Patient",
  PHARMACIST: "Pharmacien",
  ADMIN: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  PATIENT: "bg-blue-100 text-blue-700",
  PHARMACIST: "bg-green-100 text-green-700",
  ADMIN: "bg-purple-100 text-purple-700",
};

export function AdminUsersScreen() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleCounts, setRoleCounts] = useState({ PATIENT: 0, PHARMACIST: 0, ADMIN: 0 });
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);
  const [roleTarget, setRoleTarget] = useState<{ user: UserItem; role: string } | null>(null);

  useEffect(() => {
    void loadUsers();
  }, [roleFilter, page]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function loadUsers() {
    if (page === 1) setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (roleFilter) q.set("role", roleFilter);
      q.set("page", String(page));
      q.set("limit", "20");
      const res = await api.get<{ users: UserItem[]; total: number; totalPages: number }>(
        `/api/admin/users?${q.toString()}`
      );
      if (page === 1) {
        setUsers(res.users);
      } else {
        setUsers((prev) => [...prev, ...res.users]);
      }
      setTotal(res.total);
      setTotalPages(res.totalPages);
      // Compute role counts from current data (approximate from first page)
      if (page === 1 && !roleFilter) {
        const counts = { PATIENT: 0, PHARMACIST: 0, ADMIN: 0 };
        for (const u of res.users) {
          if (counts[u.role as keyof typeof counts] !== undefined) {
            counts[u.role as keyof typeof counts]++;
          }
        }
        setRoleCounts(counts);
      }
    } catch (err) {
      useAppStore.getState().pushToast(err instanceof Error ? err.message : "Erreur de chargement", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleLoadMore() {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    setPage((p) => p + 1);
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await api.del(`/api/admin/users?id=${deleteId}`);
      useAppStore.getState().pushToast("Utilisateur supprimé", "success");
      setDeleteId(null);
      void loadUsers();
    } catch (err) {
      useAppStore.getState().pushToast(
        err instanceof Error ? err.message : "Erreur",
        "error"
      );
    }
  }

  async function confirmToggleRole() {
    if (!roleTarget) return;
    const { user, role } = roleTarget;
    setRoleTarget(null);
    try {
      await api.put(`/api/admin/users?id=${user.id}`, { role });
      useAppStore.getState().pushToast(`Rôle modifié pour ${user.name}`, "success");
      setShowRoleMenu(null);
      void loadUsers();
    } catch (err) {
      useAppStore.getState().pushToast(
        err instanceof Error ? err.message : "Erreur",
        "error"
      );
    }
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Utilisateurs" />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Search + filter */}
        <div className="flex gap-2 pt-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="h-10 pl-9 text-sm"
            />
          </div>
        </div>

        {/* Role tabs */}
        <div className="flex gap-1 mb-3 overflow-x-auto no-scrollbar">
          {[
            { value: "", label: "Tous", count: total },
            { value: "PATIENT", label: "Patients", count: roleCounts.PATIENT },
            { value: "PHARMACIST", label: "Pharmaciens", count: roleCounts.PHARMACIST },
            { value: "ADMIN", label: "Admins", count: roleCounts.ADMIN },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setRoleFilter(tab.value); setPage(1); }}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                roleFilter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <User className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <>
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="rounded-xl border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{u.name}</p>
                      <Badge className={cn("text-[10px] px-1.5 py-0", ROLE_COLORS[u.role])}>
                        {ROLE_LABELS[u.role]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    {u.phone && (
                      <p className="text-xs text-muted-foreground">{u.phone}</p>
                    )}
                    {u.pharmacy && (
                      <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" />
                        {u.pharmacy.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="relative">
                      <button
                        onClick={() => setShowRoleMenu(showRoleMenu === u.id ? null : u.id)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted"
                        title="Changer le rôle"
                      >
                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      {showRoleMenu === u.id && (
                        <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                          {["PATIENT", "PHARMACIST", "ADMIN"].map((role) => (
                            <button
                              key={role}
                              onClick={() => { if (u.role !== role) setRoleTarget({ user: u, role }); setShowRoleMenu(null); }}
                              className={cn(
                                "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted/50",
                                u.role === role && "bg-primary/10 text-primary font-medium"
                              )}
                            >
                              {ROLE_LABELS[role]}
                              {u.role === role && " ✓"}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => { setDeleteId(u.id); setDeleteTarget(u); }}
                      className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{u._count.orders} commandes</span>
                  <span>{u._count.reviews} avis</span>
                  {u.city && <span>{u.city}</span>}
                </div>
              </div>
            ))}
          </div>
          {page < totalPages && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 active:bg-muted/50 mt-3"
            >
              {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Voir plus"}
            </button>
          )}
        </>
        )}
      </div>

      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) { setDeleteId(null); setDeleteTarget(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer cet utilisateur ?</DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-semibold text-foreground">{deleteTarget.name}</p>
              <p className="text-xs text-muted-foreground">{deleteTarget.email}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[deleteTarget.role]}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => void handleDelete()}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!roleTarget} onOpenChange={(v) => { if (!v) setRoleTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Changer le rôle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le rôle de <strong>{roleTarget?.user.name}</strong> sera changé de{" "}
              <strong>{ROLE_LABELS[roleTarget?.user.role || ""]}</strong> vers{" "}
              <strong>{ROLE_LABELS[roleTarget?.role || ""]}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmToggleRole()}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
