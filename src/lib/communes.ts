/**
 * Données des communes et quartiers de Côte d'Ivoire
 * Utilisé pour la recherche et le filtrage des pharmacies
 */

export interface Commune {
  name: string;
  city: string;
  districts?: string[];
}

export interface CityWithCommunes {
  name: string;
  communes: string[];
}

/**
 * Liste des communes par ville
 */
export const COMMUNES_BY_CITY: Record<string, string[]> = {
  'Abidjan': [
    'Cocody',
    'Yopougon',
    'Plateau',
    'Treichville',
    'Marcory',
    'Adjamé',
    'Attecoubé',
    'Abobo',
    'Bingerville',
    'Songon',
    'Riviera',
    'M'pouto',
    'Zone 4',
    'Zone 3',
  ],
  'Bouaké': [
    'Centre ville',
    'Zone industrielle',
    'Kennedy',
    'Jean Gonal',
    'Ahougnansou',
    'Broukro',
  ],
  'San Pedro': [
    'Centre ville',
    'Zone industrielle',
    'Cité Sicogi',
    'Grand-Béréby',
  ],
  'Korhogo': [
    'Centre ville',
    'Kombolokoura',
    'Sirimandjougou',
  ],
  'Yamoussoukro': [
    'Centre ville',
    'Cité administrative',
    'Zone industrielle',
  ],
  'Daloa': [
    'Centre ville',
    'Lobou',
    'Gapia',
  ],
  'Man': [
    'Centre ville',
    'Yatou',
    'Gbapleu',
  ],
};

/**
 * Liste complète des villes avec leurs communes
 */
export const CITIES_WITH_COMMUNES: CityWithCommunes[] = Object.entries(COMMUNES_BY_CITY).map(([name, communes]) => ({
  name,
  communes,
}));

/**
 * Liste des communes uniques (pour autocomplete)
 */
export const ALL_COMMUNES = CITIES_WITH_COMMUNES.flatMap(city =>
  city.communes.map(commune => `${commune}, ${city.name}`)
);

/**
 * Récupérer les communes d'une ville
 */
export function getCommunesByCity(city: string): string[] {
  return COMMUNES_BY_CITY[city] || [];
}

/**
 * Extraire le nom de la ville d'une commune
 */
export function extractCityFromCommune(communeString: string): string {
  const parts = communeString.split(',').map(s => s.trim());
  return parts.length > 1 ? parts[1] : parts[0];
}

/**
 * Extraire le nom de la commune (sans la ville)
 */
export function extractCommuneName(communeString: string): string {
  const parts = communeString.split(',').map(s => s.trim());
  return parts[0];
}
