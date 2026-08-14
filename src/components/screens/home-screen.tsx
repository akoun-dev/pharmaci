"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, Building2, ShoppingCart, Bell } from "lucide-react";
import Link from "next/link";

export function HomeScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bienvenue sur PharmaGO</h1>
        <p className="text-gray-500">Trouvez vos médicaments en toute simplicité</p>
      </div>

      {/* Actions rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pharmacies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/pharmacies">
              <Button className="w-full">Rechercher</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/orders">
              <Button variant="outline" className="w-full">Voir mes commandes</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/cart">
              <Button variant="outline" className="w-full">Mon panier</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/notifications">
              <Button variant="outline" className="w-full">Voir tout</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Section promotions */}
      <Card>
        <CardHeader>
          <CardTitle>Promotions du moment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Découvrez nos offres spéciales sur une sélection de produits.</p>
        </CardContent>
      </Card>

      {/* Section pharmacies proches */}
      <Card>
        <CardHeader>
          <CardTitle>Pharmacies à proximité</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Trouvez les pharmacies ouvertes près de chez vous.</p>
          <Link href="/pharmacies">
            <Button className="mt-4">Voir toutes les pharmacies</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
