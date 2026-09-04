// Client Supabase pour les composants navigateur ("use client").
// Remplace les appels fetch() vers /api/* pour tout ce qui passe désormais
// par RLS directement (favoris, avis, profil, recherche, messages...).

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
