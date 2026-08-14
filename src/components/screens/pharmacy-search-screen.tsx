"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, MapPin, Phone, Clock, Star } from "lucide-react";

export function PharmacySearchScreen() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pharmacies</h1>
        <p className="text-gray-500">Trouvez une pharmacie près de chez vous</p>
      </div>

      {/* Barre de recherche */}
      <div className="flex gap-2">
        <Input
          placeholder="Rechercher par nom ou ville..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button>Rechercher</Button>
      </div>

      {/* Liste des pharmacies */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">Pharmacie Centrale {i}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="h-3 w-3" />
                      Avenue Principale, Ville {i}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                  <Clock className="h-3 w-3" />
                  Ouvert
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>+33 1 23 45 67 {String(i).padStart(2, "0")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">4.{i}</span>
                <span className="text-gray-500 text-sm">({i * 12} avis)</span>
              </div>
              <Button className="w-full">Voir les produits</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
