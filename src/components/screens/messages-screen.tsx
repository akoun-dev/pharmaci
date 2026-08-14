"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export function MessagesScreen() {
  const messages = [
    { id: 1, from: "Pharmacie Centrale", content: "Votre commande est prête", date: "Il y a 2h" },
    { id: 2, from: "Dr. Martin", content: "N'oubliez pas votre renouvellement", date: "Hier" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-gray-500">Vos conversations</p>
      </div>

      <div className="space-y-4">
        {messages.map((msg) => (
          <Card key={msg.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">{msg.from}</CardTitle>
                <span className="text-xs text-gray-500 ml-auto">{msg.date}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{msg.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
