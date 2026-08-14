"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CheckCircle, XCircle } from "lucide-react";

export function OrdersScreen() {
  const orders = [
    { id: "CMD001", date: "2024-01-15", status: "Livré", total: "45.90€", items: 3 },
    { id: "CMD002", date: "2024-01-18", status: "En préparation", total: "23.50€", items: 2 },
    { id: "CMD003", date: "2024-01-20", status: "Annulé", total: "67.20€", items: 5 },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Livré":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "En préparation":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "Annulé":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes Commandes</h1>
        <p className="text-gray-500">Historique de vos commandes</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{order.id}</CardTitle>
                  <p className="text-sm text-gray-500">{order.date}</p>
                </div>
                <Badge variant={order.status === "Livré" ? "default" : order.status === "Annulé" ? "destructive" : "secondary"}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{order.status}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {order.items} article{order.items > 1 ? "s" : ""}
                </div>
                <div className="font-semibold">{order.total}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
