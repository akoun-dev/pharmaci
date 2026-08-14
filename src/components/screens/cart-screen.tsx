"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, Trash2, Plus, Minus } from "lucide-react";

export function CartScreen() {
  const cartItems = [
    { id: 1, name: "Paracétamol 500mg", quantity: 2, price: "5.90€" },
    { id: 2, name: "Ibuprofène 400mg", quantity: 1, price: "7.50€" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mon Panier</h1>
        <p className="text-gray-500">Gérez vos articles</p>
      </div>

      {cartItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Pill className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Votre panier est vide</p>
            <Button className="mt-4">Commencer vos achats</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Pill className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sous-total</span>
                <span>19.30€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Livraison</span>
                <span>3.90€</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Total</span>
                <span>23.20€</span>
              </div>
              <Button className="w-full mt-4">Passer la commande</Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
