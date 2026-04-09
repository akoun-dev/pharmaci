"use client"

import React from "react"
import { logger } from "@/lib/logger"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pill, FileText, MapPin } from "lucide-react"
import { motion } from "framer-motion"

interface MedicationCardProps {
    medication: {
        id: string
        name: string
        commercialName: string
        category?: string
        form?: string
        needsPrescription: boolean
        availablePharmacyCount?: number
        stockQuantity?: number
    }
    onClick: (id: string) => void
}

export const MedicationCard = React.memo(function MedicationCard({
    medication,
    onClick,
}: MedicationCardProps) {
    return (
        <motion.div whileTap={{ scale: 0.98 }}>
            <Card
                className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 border-orange-100 hover:border-orange-300"
                onClick={() => onClick(medication.id)}
            >
                <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <Pill className="h-5 w-5 text-orange-600" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-sm text-foreground truncate">
                                        {medication.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {medication.commercialName}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 sm:mt-3 flex-wrap">
                        {medication.category && (
                            <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700"
                            >
                                {medication.category}
                            </Badge>
                        )}
                        {medication.form && (
                            <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 border-green-200 text-green-700"
                            >
                                {medication.form}
                            </Badge>
                        )}
                        {medication.needsPrescription && (
                            <Badge className="text-[10px] px-2 py-1 bg-amber-600 text-white border-2 border-amber-800 font-bold shadow-md shadow-amber-600/30">
                                <FileText className="h-3.5 w-3.5 mr-1" />
                                Ordonnance
                            </Badge>
                        )}
                        {/* Badge stock limité - montré si moins de 10 unités */}
                        {medication.stockQuantity !== undefined &&
                            medication.stockQuantity > 0 &&
                            medication.stockQuantity < 10 && (
                                <Badge className="text-[10px] px-2 py-1 bg-red-100 text-red-700 border border-red-200 font-medium">
                                    Plus que {medication.stockQuantity} !
                                </Badge>
                            )}
                    </div>

                    {medication.availablePharmacyCount !== undefined && (
                        <div className="flex items-center gap-1 mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>
                                {medication.availablePharmacyCount} pharmacie
                                {medication.availablePharmacyCount > 1
                                    ? "s"
                                    : ""}{" "}
                                en stock
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
})
