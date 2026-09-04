// Rafraîchit la session Supabase à chaque requête (le token d'accès expire
// vite — sans ça, un Server Component pourrait lire un cookie de session
// périmé). Appelé depuis middleware.ts à la racine du projet.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Pendant la migration : tant qu'aucun projet Supabase n'est lié, ces
  // variables sont absentes — on laisse passer la requête sans y toucher
  // plutôt que d'échouer une requête réseau vouée à l'échec sur chaque page.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Ne PAS retirer cet appel : c'est lui qui déclenche le rafraîchissement
  // du token quand nécessaire (getUser() vérifie côté serveur, contrairement
  // à getSession() qui fait confiance au cookie sans le revalider).
  await supabase.auth.getUser();

  return supabaseResponse;
}
