'use client';

import { useState, useMemo } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ALL_COMMUNES, CITIES_WITH_COMMUNES, extractCityFromCommune, extractCommuneName } from '@/lib/communes';

interface CommuneSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CommuneSelector({ value, onChange, placeholder = 'Sélectionner une commune', className }: CommuneSelectorProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  // Filtrer les communes par recherche
  const filteredCommunes = useMemo(() => {
    if (!search) return ALL_COMMUNES;
    const searchLower = search.toLowerCase();
    return ALL_COMMUNES.filter(commune =>
      commune.toLowerCase().includes(searchLower)
    );
  }, [search]);

  // Grouper par ville pour l'affichage
  const groupedCommunes = useMemo(() => {
    const groups: Record<string, string[]> = {};
    filteredCommunes.forEach(commune => {
      const city = extractCityFromCommune(commune);
      if (!groups[city]) groups[city] = [];
      groups[city].push(commune);
    });
    return groups;
  }, [filteredCommunes]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setSearch('');
  };

  const clearSelection = () => {
    onChange('');
    setSearch('');
  };

  return (
    <div className={className}>
      <Select
        value={value}
        onValueChange={handleSelect}
        open={open}
        onOpenChange={setOpen}
      >
        <SelectTrigger className="w-full h-10 text-sm border-amber-200 focus:border-amber-400">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MapPin className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[300px] p-0">
          {/* Barre de recherche */}
          <div className="p-2 border-b border-amber-100 sticky top-0 bg-white">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une commune..."
              className="h-9 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Liste des communes groupées par ville */}
          <div className="max-h-[250px] overflow-y-auto">
            {Object.entries(groupedCommunes).map(([city, communes]) => (
              <div key={city}>
                {/* Nom de la ville */}
                <div className="px-2 py-1.5 bg-amber-50 text-xs font-semibold text-amber-800 sticky top-0">
                  {city}
                </div>

                {/* Communes de la ville */}
                {communes.map((commune) => {
                  const communeName = extractCommuneName(commune);
                  return (
                    <SelectItem
                      key={commune}
                      value={commune}
                      className="pl-6 text-sm cursor-pointer"
                    >
                      {communeName}
                    </SelectItem>
                  );
                })}
              </div>
            ))}

            {filteredCommunes.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucune commune trouvée
              </div>
            )}
          </div>

          {/* Option pour effacer */}
          {value && (
            <div className="p-2 border-t border-amber-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Effacer la sélection
              </Button>
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Composant simplifié pour le filtre rapide par ville uniquement
 */
interface CityFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CityFilter({ value, onChange, className }: CityFilterProps) {
  return (
    <div className={className}>
      <Select value={value || '__all__'} onValueChange={(v) => onChange(v === '__all__' ? '' : v)}>
        <SelectTrigger className="h-10 text-sm border-amber-200 focus:border-amber-400">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MapPin className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <SelectValue placeholder="Toutes les villes" />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[250px]">
          <SelectItem value="__all__">Toutes les villes</SelectItem>
          {CITIES_WITH_COMMUNES.map((city) => (
            <SelectItem key={city.name} value={city.name} className="text-sm cursor-pointer">
              {city.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
