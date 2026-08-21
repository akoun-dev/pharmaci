"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Building2,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  ShoppingCart,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/pharmacist", label: "Apercu", icon: LayoutDashboard },
  { href: "/pharmacist/stock", label: "Stock", icon: Package },
  { href: "/pharmacist/commandes", label: "Commandes", icon: ClipboardList },
  { href: "/pharmacist/pharmacie", label: "Ma Pharmacie", icon: Building2 },
  { href: "/pharmacist/messages", label: "Messages", icon: MessageSquare },
  { href: "/pharmacist/rapports", label: "Rapports", icon: BarChart3 },
  { href: "/pharmacist/parametres", label: "Parametres", icon: Settings },
];

export default function PharmacistLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const pushToast = useAppStore((s) => s.pushToast);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "PHARMACIST") {
      router.push("/");
    }
  }, [user, router]);

  if (!user || user.role !== "PHARMACIST") return null;

  function handleLogout() {
    logout();
    router.push("/");
    pushToast("Deconnecte.", "success");
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-border px-3">
          {sidebarOpen ? (
            <Link href="/pharmacist" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Pharma CI" width={28} height={28} className="h-7 w-7 rounded-lg" />
              <span className="text-sm font-bold text-primary">Pharma CI</span>
            </Link>
          ) : (
            <Link href="/pharmacist">
              <Image src="/logo.svg" alt="Pharma CI" width={28} height={28} className="h-7 w-7 rounded-lg" />
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", sidebarOpen && "rotate-180")} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-2">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/pharmacist" ? pathname === "/pharmacist" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border p-2">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            title={!sidebarOpen ? "Retour app" : undefined}
          >
            <ShoppingCart className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Retour app</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10"
            title={!sidebarOpen ? "Deconnexion" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Deconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-card">
            <div className="flex h-14 items-center gap-2 border-b border-border px-3">
              <Image src="/logo.svg" alt="Pharma CI" width={28} height={28} className="h-7 w-7 rounded-lg" />
              <span className="text-sm font-bold text-primary">Pharma CI</span>
              <button onClick={() => setMobileOpen(false)} className="ml-auto">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-2">
              {NAV_ITEMS.map((item) => {
                const active = item.href === "/pharmacist" ? pathname === "/pharmacist" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border p-2">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span>Deconnexion</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar mobile */}
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>
          <Image src="/logo.svg" alt="Pharma CI" width={24} height={24} className="h-6 w-6 rounded-md" />
          <span className="text-sm font-bold text-primary">Pharma CI</span>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">{user.name}</span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
