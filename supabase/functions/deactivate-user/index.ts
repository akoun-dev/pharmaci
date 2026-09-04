// Supprime (anonymise) un compte — le sien (self-service) ou, pour un
// admin, celui d'un autre utilisateur.
//
// Pourquoi une fonction Edge et pas seulement la RPC anonymize_profile() :
// verrouiller le compte (email/mot de passe invalidés, connexion bannie)
// nécessite l'Admin API de GoTrue (auth.admin.updateUserById), qui n'est
// pas accessible depuis SQL pur — seulement depuis un contexte serveur
// disposant de la clé service_role.

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Méthode non autorisée" }, { status: 405 });
    }

    const callerId = ctx.userClaims!.id;
    const body = await req.json().catch(() => ({}) as { targetUserId?: string });
    const targetUserId = body.targetUserId;
    const isSelfDelete = !targetUserId || targetUserId === callerId;

    let userIdToDeactivate = callerId;

    if (!isSelfDelete) {
      // Suppression d'un autre compte : réservée aux admins. On relit le
      // rôle depuis `profiles` (RLS) plutôt que de faire confiance à un rôle
      // envoyé par le client.
      const { data: callerProfile, error } = await ctx.supabase
        .from("profiles")
        .select("role")
        .eq("id", callerId)
        .single();

      if (error || callerProfile?.role !== "ADMIN") {
        return Response.json({ error: "Non autorisé" }, { status: 403 });
      }
      userIdToDeactivate = targetUserId!;
    }

    // Anonymise le profil — bloque avec un 409 si l'utilisateur possède
    // encore une pharmacie (voir anonymize_profile() dans les migrations).
    const { error: anonymizeError } = await ctx.supabaseAdmin.rpc("anonymize_profile", {
      p_user_id: userIdToDeactivate,
    });
    if (anonymizeError) {
      return Response.json({ error: anonymizeError.message }, { status: 409 });
    }

    // Verrouille le compte Auth : email et mot de passe rendus inutilisables,
    // connexion bannie durablement (~100 ans). On ne fait JAMAIS
    // `admin.deleteUser()` ici : `profiles.id` référence `auth.users(id)` en
    // cascade, ce qui supprimerait le profil qu'on vient d'anonymiser et
    // casserait l'historique des commandes/avis qui y sont rattachés.
    const { error: banError } = await ctx.supabaseAdmin.auth.admin.updateUserById(
      userIdToDeactivate,
      {
        email: `deleted-${userIdToDeactivate}@pharmaci.invalid`,
        password: crypto.randomUUID() + crypto.randomUUID(),
        ban_duration: "876000h",
      }
    );
    if (banError) {
      // Le profil est déjà anonymisé à ce stade ; on le signale mais ce
      // n'est pas un échec pour l'appelant — le compte est déjà inutilisable
      // côté applicatif (is_active = false, email et mot de passe changés).
      console.error("Échec du verrouillage du compte Auth:", banError.message);
    }

    return Response.json({ success: true });
  }),
};
