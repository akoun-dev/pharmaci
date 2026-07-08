"use client";

import { useState } from "react";
import { Pill, MapPin, ShoppingCart, Mic, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    icon: Pill,
    title: "Trouvez vos médicaments",
    description:
      "Recherchez par nom, principe actif ou vocalement 🎤. Filtrez par pharmacie, comparez les prix, et retrouvez vos derniers médicaments consultés.",
  },
  {
    icon: MapPin,
    title: "Repérez vos pharmacies",
    description:
      "Pharmacies de garde, notes, favoris ❤️, appel direct et itinéraire. Tout pour trouver la pharmacie idéale près de chez vous.",
  },
  {
    icon: ShoppingCart,
    title: "Commandez sans compte",
    description:
      "Naviguez librement sans inscription. Ajoutez au panier, reprenez-le plus tard, commandez et récupérez avec votre code de vérification.",
  },
];

interface OnboardingScreenProps {
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const [slide, setSlide] = useState(0);
  const current = slides[slide];
  const Icon = current.icon;
  const isLast = slide === slides.length - 1;

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-primary/5 via-background to-background px-6">
      {/* Skip */}
      <button
        onClick={onDone}
        className="self-end pt-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Passer
      </button>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Icon className="h-14 w-14" />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">{current.title}</h1>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
            {current.description}
          </p>
        </div>
      </div>

      {/* Dots + button */}
      <div className="pb-10">
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 rounded-full transition-all",
                i === slide ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
        <button
          onClick={() => (isLast ? onDone() : setSlide(slide + 1))}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
        >
          {isLast ? "C'est parti !" : "Suivant"}
        </button>
      </div>
    </div>
  );
}
