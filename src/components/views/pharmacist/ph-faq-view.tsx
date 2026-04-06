'use client';

import { logger } from '@/lib/logger';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { ViewHeader } from '@/components/view-header';
import { PharmacistPageHeader } from '@/components/views/pharmacist/ph-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  HelpCircle,
  Search,
  Phone,
  Mail,
  MessageCircle,
  Package,
  ClipboardList,
  User,
  Tag,
  Send,
  Wallet,
  AlertTriangle,
  DollarSign,
  Truck,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  FAQ Data                                                           */
/* ------------------------------------------------------------------ */

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: FaqItem[];
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    id: 'stocks',
    title: 'Gestion des stocks',
    icon: <Package className="h-4 w-4 text-orange-600" />,
    items: [
      {
        question: 'Comment ajouter un nouveau médicament au stock ?',
        answer: "Allez dans l'onglet Stocks, puis appuyez sur le bouton + en bas à droite. Sélectionnez le médicament dans la liste, renseignez le prix, la quantité et la date de péremption. Appuyez sur « Ajouter » pour confirmer.",
      },
      {
        question: 'Comment modifier le prix d\'un médicament ?',
        answer: "Appuyez sur le médicament dans la liste des stocks, puis modifiez le champ Prix dans le formulaire d'édition. Les modifications sont enregistrées automatiquement lorsque vous appuyez sur « Enregistrer ».",
      },
      {
        question: 'Que faire lorsqu\'un médicament est en rupture de stock ?',
        answer: 'Le système vous alerte automatiquement lorsqu\'un médicament est en rupture ou en stock faible. Vous pouvez désactiver le médicament temporairement ou créer une alerte de réapprovisionnement depuis la section Alertes.',
      },
      {
        question: 'Comment suivre l\'historique des mouvements de stock ?',
        answer: 'Ouvrez la fiche d\'un médicament en appuyant dessus dans la liste des stocks, puis consultez l\'onglet Historique. Vous y trouverez tous les mouvements (entrées, sorties, ajustements) avec les dates et quantités.',
      },
    ],
  },
  {
    id: 'orders',
    title: 'Commandes',
    icon: <ClipboardList className="h-4 w-4 text-orange-600" />,
    items: [
      {
        question: 'Comment confirmer une commande ?',
        answer: "Ouvrez la commande depuis l'onglet Commandes, puis appuyez sur le bouton « Confirmer ». Le client sera notifié que sa commande est confirmée et en cours de préparation.",
      },
      {
        question: 'Que signifie chaque statut de commande ?',
        answer: 'En attente → la commande vient d\'être passée. Confirmée → vous avez accepté la commande. Prêtée → le médicament est prêt à être récupéré. Récupérée → le client a récupéré sa commande. Annulée → la commande a été annulée.',
      },
      {
        question: 'Comment gérer une livraison ?',
        answer: 'Marquez la commande comme prête une fois le médicament préparé. Le client sera notifié automatiquement. Pour les commandes avec livraison, vous pouvez contacter le client directement via la messagerie.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Mon compte',
    icon: <User className="h-4 w-4 text-orange-600" />,
    items: [
      {
        question: 'Comment modifier les informations de ma pharmacie ?',
        answer: "Allez dans l'onglet Profil et modifiez les champs souhaités (nom, adresse, horaires, etc.). Appuyez sur « Enregistrer » pour sauvegarder les modifications.",
      },
      {
        question: 'Comment changer mon mot de passe ?',
        answer: "Allez dans Paramètres, puis « Changer le mot de passe ». Entrez votre mot de passe actuel et le nouveau mot de passe. Confirmez en appuyant sur « Enregistrer ».",
      },
      {
        question: 'Comment configurer les notifications ?',
        answer: 'Allez dans Paramètres et activez/désactivez les notifications souhaitées (nouvelles commandes, alertes stock, avis clients, messages). Vous pouvez aussi configurer les préférences par type.',
      },
    ],
  },
  {
    id: 'promotions',
    title: 'Promotions',
    icon: <Tag className="h-4 w-4 text-orange-600" />,
    items: [
      {
        question: 'Comment créer une promotion ?',
        answer: "Allez dans l'onglet Profil, section Promotions, puis « Créer ». Sélectionnez le médicament, le pourcentage de réduction et les dates de début et de fin de la promotion.",
      },
      {
        question: 'Les promotions sont-elles automatiques ?',
        answer: 'Non, vous devez les créer manuellement. N\'oubliez pas de définir les dates de début et fin pour que la promotion soit active uniquement pendant la période souhaitée. Les promotions expirées sont automatiquement désactivées.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Paiements mobile money',
    icon: <Wallet className="h-4 w-4 text-orange-600" />,
    items: [
      {
        question: 'Quels moyens de paiement mobile money sont acceptés ?',
        answer: 'Pharma CI prend en charge MTN Mobile Money, Orange Money et Wave. Les paiements sont traités de manière sécurisée et la confirmation est instantanée. Vous pouvez aussi accepter les paiements en espèces et par carte.',
      },
      {
        question: 'Comment fonctionne le paiement mobile money ?',
        answer: 'Le patient sélectionne son moyen de paiement préféré lors de la commande (MTN, Orange Money ou Wave). Il reçoit une notification de paiement sur son téléphone et valide le paiement. La pharmacie est notifiée automatiquement dès la confirmation du paiement.',
      },
    ],
  },
  {
    id: 'urgent',
    title: 'Commandes urgentes',
    icon: <AlertTriangle className="h-4 w-4 text-orange-600" />,
    items: [
      {
        question: 'Comment gérer les commandes urgentes ?',
        answer: 'Les commandes urgentes sont signalées par un badge rouge dans votre liste de commandes. Nous vous recommandons de les traiter en priorité. Vous pouvez contacter directement le patient via la messagerie intégrée pour confirmer la disponibilité et le délai de préparation.',
      },
      {
        question: 'Que faire si un médicament commandé en urgence est en rupture ?',
        answer: 'Signalez immédiatement la rupture au patient via la messagerie. Vous pouvez lui proposer un générique équivalent ou annuler la commande. Le stock sera automatiquement restauré si la commande est annulée.',
      },
    ],
  },
  {
    id: 'pricing',
    title: 'Tarification',
    icon: <DollarSign className="h-4 w-4 text-orange-600" />,
    items: [
      {
        question: 'Comment mettre à jour les prix des médicaments ?',
        answer: 'Accédez à la fiche du médicament depuis la liste des stocks, puis modifiez le champ Prix. Les modifications sont enregistrées automatiquement. Vous pouvez aussi effectuer des ajustements en masse depuis le tableau de bord.',
      },
      {
        question: 'Comment fonctionnent les promotions sur les prix ?',
        answer: "Créez une promotion depuis l'onglet Promotions en sélectionnant le médicament, le pourcentage de réduction et la période. Le prix remisé s'affichera automatiquement pour les patients pendant la durée de la promotion.",
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Livraison & Suivi',
    icon: <Truck className="h-4 w-4 text-orange-600" />,
    items: [
      {
        question: 'Comment fonctionne le suivi de livraison ?',
        answer: 'Chaque commande passe par des statuts clairs : En attente → Confirmée → Prêtée → Récupérée. Le patient peut suivre l\'avancement en temps réel depuis son application. Vous pouvez aussi envoyer des mises à jour via la messagerie.',
      },
      {
        question: 'Comment les promotions attirent-elles plus de clients ?',
        answer: 'Les promotions actives sont visibles par tous les patients lors de la recherche de médicaments. Un badge de réduction s\'affiche sur les médicaments en promotion, ce qui augmente la visibilité de votre pharmacie et attire davantage de clients.',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PharmacistFaqView() {
  const { setCurrentView, currentUser } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Contact form state
  const [contactName, setContactName] = useState(currentUser?.name || '');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const handleContactSubmit = async () => {
    if (!contactName || !contactEmail || !contactSubject || !contactMessage) return;
    setContactSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Message envoyé avec succès');
      setContactMessage('');
      setContactSubject('');
    } catch {
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setContactSubmitting(false);
    }
  };

  // Filter FAQ items by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_SECTIONS;

    const query = searchQuery.toLowerCase().trim();
    return FAQ_SECTIONS
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [searchQuery]);

  const totalResults = filteredSections.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <div className="w-full px-4 sm:px-6 pb-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* ─── HEADER ─── */}
        <motion.div variants={itemVariants}>
          <PharmacistPageHeader
            title="Aide & Support"
            description="Retrouvez les réponses utiles, les questions fréquentes et les contacts d’assistance pour votre espace pharmacien."
            icon={<HelpCircle className="h-5 w-5" />}
          />
        </motion.div>

        {/* ─── SEARCH BAR ─── */}
        <motion.div variants={itemVariants}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher dans l'aide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 bg-orange-50 border-orange-100 focus-visible:ring-orange-200 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                Effacer
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-muted-foreground mt-2 px-1">
              {totalResults} résultat{totalResults !== 1 ? 's' : ''} trouvé{totalResults !== 1 ? 's' : ''}
            </p>
          )}
        </motion.div>

        {/* ─── FAQ ACCORDION ─── */}
        <motion.div variants={itemVariants}>
          {filteredSections.length === 0 ? (
            <Card className="border-orange-100">
              <CardContent className="flex flex-col items-center gap-3 py-10">
                <HelpCircle className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground text-center px-4">
                  Aucun résultat pour &laquo;{searchQuery}&raquo;
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  onClick={() => setSearchQuery('')}
                >
                  Effacer la recherche
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-3">
              {filteredSections.map((section) => (
                <AccordionItem
                  key={section.id}
                  value={section.id}
                  className="border border-orange-100 rounded-xl px-4 bg-white data-[state=open]:shadow-sm"
                >
                  <AccordionTrigger className="py-3.5 hover:no-underline">
                    <div className="flex items-center gap-2">
                      {section.icon}
                      <span className="text-sm font-semibold text-foreground">{section.title}</span>
                      <span className="text-[11px] text-muted-foreground bg-orange-50 px-1.5 py-0.5 rounded-full">
                        {section.items.length}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-0.5 pb-1">
                      {section.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg hover:bg-orange-50 transition-colors"
                        >
                          <div className="px-3 py-2.5 border-b border-orange-50 last:border-b-0">
                            <p className="text-sm font-medium text-foreground">
                              {item.question}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </motion.div>

        {/* ─── CONTACT SUPPORT ─── */}
        <motion.div variants={itemVariants}>
          <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-orange-600" />
                Contacter le support
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex items-center gap-3 py-2">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100 shrink-0">
                  <Phone className="h-4 w-4 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <a
                    href="tel:+2250102030405"
                    className="text-sm font-medium text-orange-700 hover:text-orange-800"
                  >
                    +225 01 02 03 04 05
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100 shrink-0">
                  <Mail className="h-4 w-4 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <a
                    href="mailto:support@pharmapp.ci"
                    className="text-sm font-medium text-orange-700 hover:text-orange-800"
                  >
                    support@pharmapp.ci
                  </a>
                </div>
              </div>

              <Button
                className="w-full mt-2"
                onClick={() => setCurrentView('ph-messages')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Envoyer un message
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── CONTACT FORM ─── */}
        <motion.div variants={itemVariants}>
          <Card className="border-orange-100">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                <Send className="h-4 w-4 text-orange-600" />
                Envoyer un message au support
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nom complet</Label>
                <Input
                  placeholder="Votre nom"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sujet</Label>
                <Select value={contactSubject} onValueChange={setContactSubject}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Sélectionnez un sujet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="probleme_technique">Problème technique</SelectItem>
                    <SelectItem value="commande">Question sur une commande</SelectItem>
                    <SelectItem value="stock">Problème de stock</SelectItem>
                    <SelectItem value="paiement">Problème de paiement</SelectItem>
                    <SelectItem value="compte">Gestion de compte</SelectItem>
                    <SelectItem value="suggestion">Suggestion d&apos;amélioration</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Message</Label>
                <Textarea
                  placeholder="Décrivez votre problème ou votre question..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={4}
                  className="text-sm resize-none"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleContactSubmit}
                disabled={contactSubmitting || !contactName || !contactEmail || !contactSubject || !contactMessage}
              >
                {contactSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Envoyer le message
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
