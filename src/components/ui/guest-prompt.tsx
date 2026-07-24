import { LogIn } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface GuestPromptProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function GuestPrompt({ icon: Icon, title, description }: GuestPromptProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-8 w-8" />
      </div>
      <div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Button
        onClick={() => useAppStore.getState().setGuestMode(false)}
        className="mt-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground"
      >
        <LogIn className="mr-2 h-4 w-4" />
        Se connecter
      </Button>
    </div>
  );
}
