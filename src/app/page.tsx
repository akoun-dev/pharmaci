"use client";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (token) {
    try {
      const payload = await verifyToken(token);
      
      // Rediriger selon le rôle
      if (payload.role === "ADMIN") {
        redirect("/admin");
      } else if (payload.role === "PHARMACIST") {
        redirect("/pharmacist");
      } else {
        redirect("/home");
      }
    } catch (error) {
      // Token invalide, rediriger vers login
      redirect("/login");
    }
  }

  // Pas de token, rediriger vers login
  redirect("/login");
}
