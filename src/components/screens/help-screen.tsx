"use client";

import { useState } from "react";
import { ChevronDown, FileText, Mail, Phone } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { AppHeader } from "@/components/app/app-header";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Comment passer une commande ?",
    a: "Recherchez un médicament, choisissez une pharmacie, définissez la quantité et ajoutez au panier. Quand vous avez terminé, allez dans le panier et cliquez sur « Commander ». Présentez le code de vérification à la pharmacie pour récupérer vos articles.",
  },
  {
    q: "Puis-je annuler une commande ?",
    a: "Oui, tant que la commande est en statut « En attente » ou « Confirmée ». Rendez-vous dans le détail de la commande et cliquez sur « Annuler la commande ».",
  },
  {
    q: "Comment savoir si une pharmacie est de garde ?",
    a: "Les pharmacies de garde sont signalées par un badge orange « DE GARDE » sur la carte, dans les résultats de recherche, et sur leur fiche détaillée.",
  },
  {
    q: "Les médicaments sur ordonnance sont-ils disponibles ?",
    a: "Oui, vous pouvez les ajouter au panier et commander. Vous devrez présenter votre ordonnance originale lors du retrait en pharmacie.",
  },
  {
    q: "Comment contacter une pharmacie ?",
    a: "Sur la fiche détaillée d'une pharmacie, cliquez sur le bouton « Appeler » pour la joindre directement par téléphone.",
  },
  {
    q: "Comment voir l'itinéraire vers une pharmacie ?",
    a: "Sur la fiche pharmacie, cliquez sur « Itinéraire » pour être redirigé vers Google Maps avec la destination déjà saisie.",
  },
  {
    q: "Mes données sont-elles protégées ?",
    a: "Oui, toutes vos données personnelles sont cryptées et stockées en toute sécurité. Nous ne partageons jamais vos informations sans votre consentement.",
  },
  {
    q: "Comment modifier mon profil ?",
    a: "Allez dans l'onglet Profil, cliquez sur « Modifier » ou sur l'icône en forme de rouage pour changer vos informations personnelles.",
  },
];

export function HelpScreen() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col">
      <AppHeader title="Aide & support" showBack showCart />
      <div className="flex-1 space-y-3 px-4 pt-3 pb-6">
        {faqs.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex w-full items-center gap-3 p-3 text-left"
              >
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1 text-sm font-medium text-foreground">
                  {faq.q}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              {isOpen && (
                <div className="border-t border-border/60 px-3 py-3 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
          <h3 className="flex items-center justify-center gap-1.5 text-sm font-bold text-primary">
            <Mail className="h-4 w-4" />
            Vous avez d'autres questions ?
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Écrivez-nous à support@pharmaci.ci ou appelez le
          </p>
          <a
            href="tel:+2250102030405"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            <Phone className="h-4 w-4" />
            +225 01 02 03 04 05
          </a>
        </div>
      </div>
    </div>
  );
}
