"use client";

import { Search, Map, ClipboardList, User } from "lucide-react";
import { useAppStore, type MainTab } from "@/lib/store";
import { cn } from "@/lib/utils";

const tabs: { id: MainTab; label: string; icon: typeof Search }[] = [
  { id: "home", label: "Accueil", icon: Search },
  { id: "map", label: "Carte", icon: Map },
  { id: "orders", label: "Commandes", icon: ClipboardList },
  { id: "profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const tab = useAppStore((s) => s.nav.tab);
  const setTab = useAppStore((s) => s.setTab);

  return (
    <nav className="sticky bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="grid grid-cols-4">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2.5 transition-colors relative",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-12 items-center justify-center rounded-full transition-all",
                  active && "bg-primary/10"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
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
