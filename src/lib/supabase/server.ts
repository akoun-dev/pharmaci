// Client Supabase pour le contexte serveur (Server Components, Route
// Handlers). Lit/écrit la session via les cookies Next.js — remplace
// src/lib/auth.ts (JWT + cookie httpOnly maison).

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Appelé depuis un Server Component : les cookies ne peuvent pas
            // être modifiés ici. Sans effet tant que le middleware (voir
            // middleware.ts) rafraîchit la session à chaque requête.
          }
        },
      },
    }
  );
}

// Client "admin" (clé service_role) — réservé aux Route Handlers qui doivent
// contourner RLS pour des opérations privilégiées ponctuelles côté Next.js
// (le gros des opérations privilégiées vit plutôt dans les fonctions Edge,
// voir supabase/functions/). Ne jamais importer ce module dans un composant
// client : NEXT_PUBLIC_* n'est pas défini ici, et SUPABASE_SERVICE_ROLE_KEY
// ne doit jamais atteindre le navigateur.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
