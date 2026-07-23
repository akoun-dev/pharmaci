"use client";

import {
  Search,
  Map,
  ClipboardList,
  User,
  LayoutDashboard,
  Package,
  Users,
  Building2,
  MessageSquare,
  ShoppingCart,
} from "lucide-react";
import { useAppStore, type MainTab } from "@/lib/store";
import { cn } from "@/lib/utils";

type TabConfig = { id: string; label: string; icon: typeof Search };

const patientTabs: TabConfig[] = [
  { id: "home", label: "Accueil", icon: Search },
  { id: "map", label: "Carte", icon: Map },
  { id: "orders", label: "Commandes", icon: ClipboardList },
  { id: "profile", label: "Profil", icon: User },
];

const pharmacistTabs: TabConfig[] = [
  { id: "pharmacist", label: "Aperçu", icon: LayoutDashboard },
  { id: "orders", label: "Commandes", icon: ClipboardList },
  { id: "pharmacist-stock", label: "Stock", icon: Package },
  { id: "pharmacist-messages", label: "Messages", icon: MessageSquare },
  { id: "profile", label: "Profil", icon: User },
];

const adminTabs: TabConfig[] = [
  { id: "admin", label: "Aperçu", icon: LayoutDashboard },
  { id: "admin-users", label: "Utilisateurs", icon: Users },
  { id: "admin-pharmacies", label: "Pharmacies", icon: Building2 },
  { id: "admin-orders", label: "Commandes", icon: ShoppingCart },
  { id: "profile", label: "Profil", icon: User },
];

const VIEW_TO_TAB: Record<string, string> = {
  "pharmacist-stock": "pharmacist-stock",
  "pharmacist-pharmacy": "pharmacist",
  "pharmacist-order-detail": "orders",
  "messages": "pharmacist-messages",
  "chat": "pharmacist-messages",
  "admin-users": "admin-users",
  "admin-pharmacies": "admin-pharmacies",
  "admin-orders": "admin-orders",
};

export function BottomNav() {
  const tab = useAppStore((s) => s.nav.tab);
  const view = useAppStore((s) => s.nav.view);
  const setTab = useAppStore((s) => s.setTab);
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const notificationCount = useAppStore((s) => s.notificationCount);

  const role = user?.role;
  const tabs =
    role === "PHARMACIST"
      ? pharmacistTabs
      : role === "ADMIN"
        ? adminTabs
        : patientTabs;

  const gridCols = tabs.length === 5 ? "grid-cols-5" : "grid-cols-4";

  function handleTabClick(id: string) {
    if (id === "pharmacist-stock") {
      navigate("pharmacist-stock");
    } else if (id === "pharmacist-messages") {
      navigate("messages");
    } else if (id === "admin-users") {
      navigate("admin-users");
    } else if (id === "admin-pharmacies") {
      navigate("admin-pharmacies");
    } else if (id === "admin-orders") {
      navigate("admin-orders");
    } else {
      setTab(id as MainTab);
    }
    if (id === "orders") useAppStore.getState().setNotificationCount(0);
  }

  function isActive(id: string) {
    if (id === tab) return true;
    const mappedView = VIEW_TO_TAB[view];
    if (mappedView === id) return true;
    return false;
  }

  const showBadge = tab === "orders" && notificationCount > 0;

  return (
    <nav className="sticky bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className={cn("grid", gridCols)}>
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = isActive(id);
          return (
            <button
              key={id}
              onClick={() => handleTabClick(id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2.5 transition-colors relative",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-12 items-center justify-center rounded-full transition-all relative",
                  active && "bg-primary/10"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {id === "orders" && showBadge && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm animate-cart-pop">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </div>
              <span className={cn("text-[11px] font-medium", active && "font-semibold")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
