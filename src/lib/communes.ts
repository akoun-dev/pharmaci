/**
 * Données des communes et quartiers de Côte d'Ivoire
 * Basé sur les districts des pharmacies dans la base de données
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
 * Liste des communes par ville (districts tels que définis dans les seeds)
 */
export const COMMUNES_BY_CITY: Record<string, string[]> = {
  'Abidjan': [
    'Abobo',
    'Adjamé',
    'Angre',
    'Attécoubé',
    'Bingerville',
    'Cocody',
    'Koumassi',
    'Macoria',
    'Marcory',
    'Plateau',
    'Port-Bouet',
    'Riviera',
    'Riviera 3',
    'Songon',
    'Treichville',
    'Yopougon',
  ],
  'Bouaké': [
    'Centre-ville',
    'Kennedy',
    'Jean Gonal',
    'Ahougnansou',
  ],
  'San Pedro': [
    'Centre-ville',
  ],
  'Korhogo': [
    'Korhogo',
  ],
  'Yamoussoukro': [
    'Yamoussoukro',
  ],
  'Daloa': [
    'Daloa',
  ],
  'Man': [
    'Man',
  ],
  'Abengourou': [
    'Abengourou',
  ],
  'Bondoukou': [
    'Bondoukou',
  ],
  'Dimbokro': [
    'Dimbokro',
  ],
  'Séguéla': [
    'Séguéla',
  ],
  'Touba': [
    'Touba',
  ],
  'Ferkessedougou': [
    'Ferkessedougou',
  ],
  'Grand-Bassam': [
    'Grand-Bassam',
  ],
  'Sinématiali': [
    'Sinématiali',
  ],
  'Katiola': [
    'Katiola',
  ],
  'Béoumi': [
    'Béoumi',
  ],
  'Sakassou': [
    'Sakassou',
  ],
  'Daoukro': [
    'Daoukro',
  ],
  'Bongouanou': [
    'Bongouanou',
  ],
  'M\'bahiakro': [
    'M\'bahiakro',
  ],
  'Koun-Fao': [
    'Koun-Fao',
  ],
  'Tiapoum': [
    'Tiapoum',
  ],
  'Alépé': [
    'Alépé',
  ],
  'Adzopé': [
    'Adzopé',
  ],
  'Yakassé-Feyassé': [
    'Yakassé-Feyassé',
  ],
  'Mafféré': [
    'Mafféré',
  ],
  'Agboville': [
    'Agboville',
  ],
  'Tiassalé': [
    'Tiassalé',
  ],
  'Taabo': [
    'Taabo',
  ],
  'Sinfra': [
    'Sinfra',
  ],
  'Issia': [
    'Issia',
  ],
  'Divo': [
    'Divo',
  ],
  'Lakota': [
    'Lakota',
  ],
  'Gagnoa': [
    'Gagnoa',
  ],
  'Oumé': [
    'Oumé',
  ],
  'Vavoua': [
    'Vavoua',
  ],
  'Danané': [
    'Danané',
  ],
  'Zouan-Hounien': [
    'Zouan-Hounien',
  ],
  'Binhoué': [
    'Binhoué',
  ],
  'Toulépleu': [
    'Toulépleu',
  ],
  'Grain-Blé': [
    'Grain-Blé',
  ],
  'Guiglo': [
    'Guiglo',
  ],
  'Taï': [
    'Taï',
  ],
  'Zuénoula': [
    'Zuénoula',
  ],
  'Kong': [
    'Kong',
  ],
  'Boundiali': [
    'Boundiali',
  ],
  'Tengréla': [
    'Tengréla',
  ],
  'Kaniasso': [
    'Kaniasso',
  ],
  'Madinani': [
    'Madinani',
  ],
  'Minignan': [
    'Minignan',
  ],
  'Odienné': [
    'Odienné',
  ],
  'Biankouman': [
    'Biankouman',
  ],
  'Kouibly': [
    'Kouably',
  ],
  'Folon': [
    'Folon',
  ],
  'Koro': [
    'Koro',
  ],
  'Bougouba': [
    'Bougouba',
  ],
  'Koutouba': [
    'Koutouba',
  ],
  'Dabakala': [
    'Dabakala',
  ],
  'Mankono': [
    'Mankono',
  ],
  'Bouaflé': [
    'Bouaflé',
  ],
  'Bocanda': [
    'Bocanda',
  ],
  'Tiébissou': [
    'Tiébissou',
  ],
  'N\'Zérékoré': [
    'N\'Zérékoré',
  ],
  // Villes supplémentaires pour couvrir tous les districts dans les seeds
  'Aboisso': ['Aboisso'],
  'Adiaké': ['Adiaké'],
  'Adiatté': ['Adiatté'],
  'Anyama': ['Anyama'],
  'Assinie': ['Assinie'],
  'Bangolo': ['Bangolo'],
  'Bongouanou': ['Bongouanou'],
  'Bouna': ['Bouna'],
  'Dabou': ['Dabou'],
  'Doropo': ['Doropo'],
  'Duékoué': ['Duékoué'],
  'Facobly': ['Facobly'],
  'Ferkessédougou': ['Ferkessédougou'],
  'Jacqueville': ['Jacqueville'],
  'Kani': ['Kani'],
  'Lakota': ['Lakota'],
  'Niakaramandougou': ['Niakaramandougou'],
  'Odienne': ['Odienne'],
  'Ouaninou': ['Ouaninou'],
  'Sinématiali': ['Sinématiali'],
  'Tanda': ['Tanda'],
  'Tingréla': ['Tingréla'],
  'Transua': ['Transua'],
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

/**
 * Liste des villes uniques
 */
export const ALL_CITIES = Object.keys(COMMUNES_BY_CITY).sort();
