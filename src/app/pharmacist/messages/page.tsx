"use client";

import { MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PharmacistMessagesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquare className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold">Messagerie</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Communiquez directement avec vos patients via l&apos;application mobile.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
