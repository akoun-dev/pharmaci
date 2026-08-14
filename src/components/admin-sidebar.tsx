"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Users,
  Building2,
  ShoppingCart,
  Package,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Pill,
  FileText,
  HelpCircle,
  Bell,
  User,
  Home,
  Stethoscope,
} from "lucide-react";

// Définition des menus par rôle
const ADMIN_MENU = [
  { title: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { title: "Utilisateurs", href: "/admin/users", icon: Users },
  { title: "Pharmacies", href: "/admin/pharmacies", icon: Building2 },
  { title: "Commandes", href: "/admin/orders", icon: ShoppingCart },
  { title: "Statistiques", href: "/admin/stats", icon: FileText },
  { title: "Paramètres", href: "/admin/settings", icon: Settings },
];

const PHARMACIST_MENU = [
  { title: "Tableau de bord", href: "/pharmacist", icon: LayoutDashboard },
  { title: "Stock", href: "/pharmacist/stock", icon: Package },
  { title: "Commandes", href: "/pharmacist/orders", icon: ShoppingCart },
  { title: "Ma pharmacie", href: "/pharmacist/pharmacy", icon: Building2 },
  { title: "Messages", href: "/pharmacist/messages", icon: MessageSquare },
  { title: "Paramètres", href: "/pharmacist/settings", icon: Settings },
];

const PATIENT_MENU = [
  { title: "Accueil", href: "/home", icon: Home },
  { title: "Pharmacies", href: "/pharmacies", icon: Building2 },
  { title: "Commandes", href: "/orders", icon: ShoppingCart },
  { title: "Panier", href: "/cart", icon: Package },
  { title: "Messages", href: "/messages", icon: MessageSquare },
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Profil", href: "/profile", icon: User },
  { title: "Aide", href: "/help", icon: HelpCircle },
];

interface SidebarProps {
  role?: "ADMIN" | "PHARMACIST" | "PATIENT";
}

export function AdminSidebar({ role = "PATIENT" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Sélectionner le menu selon le rôle
  const getMenuItems = () => {
    switch (role) {
      case "ADMIN":
        return ADMIN_MENU;
      case "PHARMACIST":
        return PHARMACIST_MENU;
      default:
        return PATIENT_MENU;
    }
  };

  const menuItems = getMenuItems();

  // Obtenir le nom du rôle pour l'affichage
  const getRoleName = () => {
    switch (role) {
      case "ADMIN":
        return "Administrateur";
      case "PHARMACIST":
        return "Pharmacien";
      default:
        return "Patient";
    }
  };

  // Obtenir l'icône du rôle
  const getRoleIcon = () => {
    switch (role) {
      case "ADMIN":
        return Settings;
      case "PHARMACIST":
        return Stethoscope;
      default:
        return User;
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Bouton toggle mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-white border-r transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header avec logo et bouton collapse */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Pill className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg">PharmaGO</span>
            </div>
          )}
          {collapsed && (
            <Pill className="h-6 w-6 text-blue-600 mx-auto" />
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100",
                    collapsed && "justify-center"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className="h-5 w-5" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer avec infos utilisateur */}
        <div className="absolute bottom-0 left-0 right-0 h-16 border-t bg-gray-50 p-4">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {getRoleName().charAt(0)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{getRoleName()}</p>
                <p className="text-xs text-gray-500 truncate">utilisateur@exemple.com</p>
              </div>
            )}
            {!collapsed && (
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

// Alias pour PatientSidebar
export const PatientSidebar = AdminSidebar;
export const PharmacistSidebar = AdminSidebar;
