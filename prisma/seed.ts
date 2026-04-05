import { db } from '../src/lib/db';
import { hash } from 'bcryptjs';

const PHARMACIES = [
  { name: "Pharmacie de la Paix", address: "Bd de France, Cocody", city: "Abidjan", district: "Cocody", lat: 5.3600, lng: -3.9420, phone: "+225 07 08 09 10 11", isGuard: true, is24h: false, openTime: "07:00", closeTime: "22:00", rating: 4.5, reviewCount: 128, services: '["livraison","conseil","drive"]', description: "Grande pharmacie de garde située au cœur de Cocody. Large gamme de médicaments et produits parapharmaceutiques.", paymentMethods: '["especes","orange_money","wave","carte"]', parking: "Parking gratuit - 20 places" },
  { name: "Pharmacie Centrale d'Abidjan", address: "Av. Franchet d'Espérey, Plateau", city: "Abidjan", district: "Plateau", lat: 5.3167, lng: -4.0167, phone: "+225 01 02 03 04 05", isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.2, reviewCount: 95, services: '["conseil","ordonnance"]', description: "Pharmacie centrale au Plateau, spécialisée dans les médicaments de marque et génériques.", paymentMethods: '["especes","orange_money","carte"]', parking: "Parking payant - Rue" },
  { name: "Pharmacie Yopougon", address: "Carrefour Yopougon, Abidjan", city: "Abidjan", district: "Yopougon", lat: 5.3500, lng: -4.0833, phone: "+225 05 06 07 08 09", isGuard: true, is24h: true, openTime: "00:00", closeTime: "23:59", rating: 4.0, reviewCount: 76, services: '["livraison","urgence","conseil"]', description: "Pharmacie ouverte 24h/24 au carrefour de Yopougon. Service d'urgence disponible.", paymentMethods: '["especes","orange_money","wave","mtn_money"]', parking: "Parking gratuit - 10 places" },
  { name: "Pharmacie Marcory", address: "Bd VGE, Marcory", city: "Abidjan", district: "Marcory", lat: 5.3067, lng: -3.9917, phone: "+225 07 12 34 56 78", isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:30", rating: 4.3, reviewCount: 62, services: '["conseil","parapharmacie"]', description: "Pharmacie de quartier à Marcory avec un service de parapharmacie complet.", paymentMethods: '["especes","orange_money"]', parking: null },
  { name: "Pharmacie du Lycée", address: "Rue du Lycée, Treichville", city: "Abidjan", district: "Treichville", lat: 5.3050, lng: -4.0067, phone: "+225 01 23 45 67 89", isGuard: true, is24h: false, openTime: "07:30", closeTime: "21:00", rating: 3.9, reviewCount: 54, services: '["conseil"]', description: "Pharmacie de garde à Treichville, proche du CHU.", paymentMethods: '["especes","wave"]', parking: "Accès difficile - Rue étroite" },
  { name: "Pharmacie Adjamé", address: "Marché Adjamé, Abidjan", city: "Abidjan", district: "Adjamé", lat: 5.3667, lng: -4.0000, phone: "+225 05 98 76 54 32", isGuard: false, is24h: false, openTime: "08:00", closeTime: "19:30", rating: 3.7, reviewCount: 41, services: '["conseil","ordonnance"]', description: "Pharmacie du marché Adjamé, accessible et abordable.", paymentMethods: '["especes","orange_money","mtn_money"]', parking: null },
  { name: "Pharmacie Koumassi", address: "Carrefour Koumassi", city: "Abidjan", district: "Koumassi", lat: 5.3200, lng: -3.9500, phone: "+225 07 65 43 21 09", isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.1, reviewCount: 38, services: '["livraison","conseil"]', description: "Pharmacie de quartier à Koumassi avec service de livraison.", paymentMethods: '["especes","wave"]', parking: "Parking gratuit - 5 places" },
  { name: "Pharmacie d'Angre", address: "Zone 4, Angre", city: "Abidjan", district: "Angre", lat: 5.3700, lng: -3.9300, phone: "+225 01 11 22 33 44", isGuard: false, is24h: false, openTime: "08:00", closeTime: "21:00", rating: 4.6, reviewCount: 89, services: '["drive","conseil","parapharmacie"]', description: "Pharmacie moderne à Angre avec service drive et large gamme parapharmaceutique.", paymentMethods: '["especes","orange_money","wave","carte"]', parking: "Parking gratuit - 30 places" },
  { name: "Pharmacie de Bouaké", address: "Avenue de la République, Bouaké", city: "Bouaké", district: "Centre-ville", lat: 7.6948, lng: -5.0303, phone: "+225 07 00 11 22 33", isGuard: true, is24h: false, openTime: "07:30", closeTime: "21:00", rating: 4.0, reviewCount: 45, services: '["conseil","urgence"]', description: "Principale pharmacie de Bouaké, ouverte en garde les week-ends.", paymentMethods: '["especes","orange_money","mtn_money"]', parking: "Parking gratuit - 8 places" },
  { name: "Pharmacie San Pedro", address: "Bd de la Liberté, San Pedro", city: "San Pedro", district: "Centre-ville", lat: 4.7485, lng: -6.6363, phone: "+225 05 44 33 22 11", isGuard: false, is24h: false, openTime: "08:00", closeTime: "19:30", rating: 3.8, reviewCount: 22, services: '["conseil"]', description: "Pharmacie de San Pedro desservant la population locale.", paymentMethods: '["especes","orange_money"]', parking: null },
  { name: "PHARMACIE DESBRONS TANDA", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3500, lng: -4.0000, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de quartier à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "DÉPÔT DE PHARMACIE DE SAPLI", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3550, lng: -4.0050, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Dépôt de pharmacie à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA CITÉE CIE", address: "Yopougon, Abidjan", city: "Abidjan", district: "Yopougon", lat: 5.3450, lng: -4.0800, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de quartier à Yopougon.", paymentMethods: '["especes"]', parking: null },
  { name: "GRANDE PHARMACIE DU PROGRÈS", address: "Yopougon, Abidjan", city: "Abidjan", district: "Yopougon", lat: 5.3480, lng: -4.0850, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Grande pharmacie à Yopougon.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE TOIT-ROUGE", address: "Yopougon, Abidjan", city: "Abidjan", district: "Yopougon", lat: 5.3520, lng: -4.0780, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de quartier à Yopougon.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE CAMP MILITAIRE", address: "Yopougon, Abidjan", city: "Abidjan", district: "Yopougon", lat: 5.3400, lng: -4.0900, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie près du camp militaire à Yopougon.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE CARREFOUR BOBY", address: "Niangon base CIE, Yopougon", city: "Abidjan", district: "Yopougon", lat: 5.3380, lng: -4.0950, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie au carrefour Boby à Yopougon.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE COLOMBE", address: "Face au cinéma Congo, 138 Grand Bassam", city: "Grand-Bassam", district: "Grand-Bassam", lat: 5.2117, lng: -3.7383, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie face au cinéma Congo à Grand-Bassam.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA GRANDE MOSQUÉE D'ADJAMÉ", address: "Bd William Jacob derrière les rails de la grande mosquée - Mosquée", city: "Abidjan", district: "Adjamé", lat: 5.3700, lng: -4.0050, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie près de la grande mosquée d'Adjamé.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LOCODJORO", address: "Route d'Abobodoumé non loin du dispensaire de Locodjoro, Attécoubé", city: "Abidjan", district: "Attécoubé", lat: 5.3350, lng: -4.0350, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie à Locodjoro, Attécoubé.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DU LONGCHAMP", address: "Angle avenue Marchand, Boulevard Roume, Immeuble Longchamp, Plateau", city: "Abidjan", district: "Plateau", lat: 5.3200, lng: -4.0200, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie au Plateau, immeuble Longchamp.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DU VALLON", address: "Rue des Jardins, Face à la BSIC, Deux-plateaux - Vallon, Cocody", city: "Abidjan", district: "Cocody", lat: 5.3650, lng: -3.9350, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie aux Deux-Plateaux, Cocody.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE KORALIE", address: "Imm. JECEDA, Angle Bd de la République et Av. Marchand, Plateau", city: "Abidjan", district: "Plateau", lat: 5.3180, lng: -4.0180, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie au Plateau, immeuble JECEDA.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE LAOULO", address: "Nouveau quartier, Nouveau bureau SODECI, face clinique médicale LES OLIVIERS, Yopougon", city: "Abidjan", district: "Yopougon", lat: 5.3550, lng: -4.0750, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie face à la clinique LES OLIVIERS à Yopougon.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE LE BELIER", address: "Face du grand Bloc, non loin du commissariat en quittant Liberté pour Fraternité matin à droite - 220 logements, Adjamé", city: "Abidjan", district: "Adjamé", lat: 5.3680, lng: -4.0020, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie aux 220 logements, Adjamé.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE MERMOZ", address: "Av. Jean Mermoz, à l'entrée de la Cité Sogefiha - Centre, Cocody", city: "Abidjan", district: "Cocody", lat: 5.3620, lng: -3.9400, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie à la Cité Sogefiha, Cocody.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE SANTÉ POUR TOUS D'ANYAMA", address: "Derrière PMFA, carrefour Adja, Belleville, Anyama", city: "Anyama", district: "Anyama", lat: 5.4950, lng: -4.0500, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie à Anyama, carrefour Adja.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE LA PAIX", address: "Cocoteraie (Anador), face au Groupe Scolaire NANTI - Anador, Abobo", city: "Abidjan", district: "Abobo", lat: 5.4200, lng: -4.0200, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie à Anador, Abobo.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE VICTOIRE MARIE DE BLOCKHAUS", address: "TERMINUS SOTRA / 200 M DE L'HOTEL IVOIRE, Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3100, lng: -4.0100, phone: "+225 27 22 48 68 91 / 07 57 49 22 87", isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie près de l'Hôtel Ivoire, Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE MISERICORDE KENNEDY 1", address: "Daloa", city: "Daloa", district: "Daloa", lat: 6.8770, lng: -6.4503, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie à Daloa.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE KOWEIT MARCHÉ", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3400, lng: -4.0100, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie du marché à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE MÉTROPOLE", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3300, lng: -4.0200, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie métropole à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHIE MODERNE-MAZUET", address: "01 BP 167 ABIDJAN 01", city: "Abidjan", district: "Plateau", lat: 5.3220, lng: -4.0250, phone: "phciemazuet@aviso.ci", isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie moderne au Plateau.", paymentMethods: '["especes"]', parking: null },
  { name: "PHIE DES CITÉS SYNACASSCI", address: "25 BP 293 CIDEX 1 ABIDJAN 25", city: "Abidjan", district: "Riviera", lat: 5.3550, lng: -3.9500, phone: "boni_herve@yahoo.fr", isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie à la Riviera.", paymentMethods: '["especes"]', parking: null },
  { name: "PHIE DES FINANCES", address: "15 BP 265 ABIDJAN 15", city: "Abidjan", district: "Plateau", lat: 5.3190, lng: -4.0220, phone: "emmaangoua@yahoo.fr", isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie des finances au Plateau.", paymentMethods: '["especes"]', parking: null },
  { name: "PHIE PALMERAIE SARL", address: "06 BP 6091 ABIDJAN 06", city: "Abidjan", district: "Cocody", lat: 5.3600, lng: -3.9450, phone: "palmbahia@yahoo.fr", isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de la Palmeraie à Cocody.", paymentMethods: '["especes"]', parking: null },
  { name: "PHIE DES DEUX PLATEAUX SARL", address: "06 BP 1036 ABIDJAN 06", city: "Abidjan", district: "Cocody", lat: 5.3680, lng: -3.9380, phone: "pharm2pltx@yahoo.com", isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie des Deux-Plateaux à Cocody.", paymentMethods: '["especes"]', parking: null },
  { name: "PHIE RIVIERA 3", address: "22 BP 48 ABIDJAN 22", city: "Abidjan", district: "Riviera 3", lat: 5.3580, lng: -3.9480, phone: "PHCIEriviera3@gmail.com", isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie à la Riviera 3.", paymentMethods: '["especes"]', parking: null },
  { name: "PHIE ATLANTIQUE", address: "02 BP 219 ABIDJAN 02", city: "Abidjan", district: "Port-Bouet", lat: 5.2550, lng: -3.9150, phone: "kanigui@yahoo.com", isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie atlantique à Port-Bouet.", paymentMethods: '["especes"]', parking: null },
  { name: "NOUVELLE PHIE DE LA ME", address: "13 BP 1278 ABIDJAN 13", city: "Abidjan", district: "Abobo", lat: 5.4150, lng: -4.0250, phone: "ndouffoujoel@yahoo.fr", isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Nouvelle pharmacie de la ME à Abobo.", paymentMethods: '["especes"]', parking: null },
  { name: "MAZUET SPECIAL", address: "01 BP 167 ABIDJAN 01", city: "Abidjan", district: "Plateau", lat: 5.3210, lng: -4.0240, phone: "phciemazuet@aviso.ci", isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie Mazuet Special au Plateau.", paymentMethods: '["especes"]', parking: null },
  { name: "MARCORY PTT CESSION", address: "05 BP 1600 ABIDJAN 05", city: "Abidjan", district: "Marcory", lat: 5.3050, lng: -3.9950, phone: "nouvellePHCIEptt@gmail.com", isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie PTT à Marcory.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA RÉPUBLIQUE", address: "Plateau, Abidjan", city: "Abidjan", district: "Plateau", lat: 5.3170, lng: -4.0190, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de la République au Plateau.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA VICTOIRE", address: "Treichville, Abidjan", city: "Abidjan", district: "Treichville", lat: 5.3080, lng: -4.0080, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de la Victoire à Treichville.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'AMITIÉ", address: "Yopougon, Abidjan", city: "Abidjan", district: "Yopougon", lat: 5.3470, lng: -4.0820, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Amitié à Yopougon.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'UNION", address: "Cocody, Abidjan", city: "Abidjan", district: "Cocody", lat: 5.3630, lng: -3.9430, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Union à Cocody.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'UNIVERS", address: "Cocody, Abidjan", city: "Abidjan", district: "Cocody", lat: 5.3640, lng: -3.9440, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Univers à Cocody.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'UNIVERSITÉ DE BOUAKÉ", address: "Bouaké", city: "Bouaké", district: "Bouaké", lat: 7.6900, lng: -5.0350, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'université de Bouaké.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'UNIVERSITÉ DE DALOA", address: "Daloa", city: "Daloa", district: "Daloa", lat: 6.8800, lng: -6.4550, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'université de Daloa.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'UNIVERSITÉ DE YAMOUSSOUKRO", address: "Yamoussoukro", city: "Yamoussoukro", district: "Yamoussoukro", lat: 6.8276, lng: -5.2893, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'université de Yamoussoukro.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA CATHÉDRALE", address: "Plateau, Abidjan", city: "Abidjan", district: "Plateau", lat: 5.3160, lng: -4.0170, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de la Cathédrale au Plateau.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA PAIX", address: "Abobo, Abidjan", city: "Abidjan", district: "Abobo", lat: 5.4180, lng: -4.0180, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de la Paix à Abobo.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA CITÉ", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3350, lng: -4.0150, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de la Cité à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA GARE", address: "Adjamé, Abidjan", city: "Abidjan", district: "Adjamé", lat: 5.3690, lng: -4.0030, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de la Gare à Adjamé.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA LIBERTÉ", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3320, lng: -4.0120, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de la Liberté à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA POSTE", address: "Plateau, Abidjan", city: "Abidjan", district: "Plateau", lat: 5.3150, lng: -4.0160, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de la Poste au Plateau.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA SANTÉ", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3380, lng: -4.0180, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de la Santé à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA SOURCE", address: "Cocody, Abidjan", city: "Abidjan", district: "Cocody", lat: 5.3610, lng: -3.9410, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de la Source à Cocody.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA TRANQUILLITÉ", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3420, lng: -4.0220, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de la Tranquillité à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA VIE", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3450, lng: -4.0250, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de la Vie à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA VILLE", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3480, lng: -4.0280, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de la Ville à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA VILLE NOUVELLE", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3510, lng: -4.0310, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de la Ville Nouvelle à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE LA ZONE 4", address: "Marcory, Abidjan", city: "Abidjan", district: "Marcory", lat: 5.3040, lng: -3.9930, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de la Zone 4 à Marcory.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'ÉGLISE", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3540, lng: -4.0340, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Église à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'ÉTOILE", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3570, lng: -4.0370, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Étoile à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'ESPÉRANCE", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3600, lng: -4.0400, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Espérance à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'ESPÉRANCE NOUVELLE", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3630, lng: -4.0430, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Espérance Nouvelle à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'HÔPITAL", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3660, lng: -4.0460, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Hôpital à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'HÔPITAL GÉNÉRAL", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3690, lng: -4.0490, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Hôpital Général à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'HÔPITAL MILITAIRE", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3720, lng: -4.0520, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Hôpital Militaire à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'HÔPITAL REGIONAL", address: "Bouaké", city: "Bouaké", district: "Bouaké", lat: 7.6920, lng: -5.0320, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Hôpital Régional de Bouaké.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'HÔPITAL REGIONAL", address: "Daloa", city: "Daloa", district: "Daloa", lat: 6.8750, lng: -6.4480, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Hôpital Régional de Daloa.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'HÔPITAL REGIONAL", address: "Korhogo", city: "Korhogo", district: "Korhogo", lat: 9.4580, lng: -5.6297, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Hôpital Régional de Korhogo.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'HÔPITAL REGIONAL", address: "San Pedro", city: "San Pedro", district: "San Pedro", lat: 4.7500, lng: -6.6400, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Hôpital Régional de San Pedro.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'HÔPITAL REGIONAL", address: "Yamoussoukro", city: "Yamoussoukro", district: "Yamoussoukro", lat: 6.8300, lng: -5.2920, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Hôpital Régional de Yamoussoukro.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'HÔPITAL UNIVERSITAIRE", address: "Cocody, Abidjan", city: "Abidjan", district: "Cocody", lat: 5.3650, lng: -3.9460, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Hôpital Universitaire de Cocody.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT PASTEUR", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3750, lng: -4.0550, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut Pasteur à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT NATIONAL DE SANTÉ PUBLIQUE", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3780, lng: -4.0580, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut National de Santé Publique à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE CARDIOLOGIE", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3810, lng: -4.0610, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Cardiologie à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT D'HYGIÈNE", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3840, lng: -4.0640, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut d'Hygiène à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE PUÉRICULTURE", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3870, lng: -4.0670, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Puériculture à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE SANTÉ PUBLIQUE", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3900, lng: -4.0700, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Santé Publique à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE TRANSFUSION SANGUINE", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3930, lng: -4.0730, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Transfusion Sanguine à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION AUX MÉTIERS DE LA SANTÉ", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3960, lng: -4.0760, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation aux Métiers de la Santé à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SOINS INFIRMIERS", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.3990, lng: -4.0790, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Soins Infirmiers à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ COMMUNAUTAIRE", address: "Abidjan", city: "Abidjan", district: "Abidjan", lat: 5.4020, lng: -4.0820, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Communautaire à Abidjan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Bouaké", city: "Bouaké", district: "Bouaké", lat: 7.6880, lng: -5.0380, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Bouaké.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Daloa", city: "Daloa", district: "Daloa", lat: 6.8730, lng: -6.4460, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Daloa.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Korhogo", city: "Korhogo", district: "Korhogo", lat: 9.4550, lng: -5.6270, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Korhogo.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "San Pedro", city: "San Pedro", district: "San Pedro", lat: 4.7450, lng: -6.6350, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de San Pedro.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Yamoussoukro", city: "Yamoussoukro", district: "Yamoussoukro", lat: 6.8250, lng: -5.2870, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Yamoussoukro.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Man", city: "Man", district: "Man", lat: 7.4125, lng: -7.5547, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Man.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Gagnoa", city: "Gagnoa", district: "Gagnoa", lat: 6.1319, lng: -5.9506, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Gagnoa.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Odienné", city: "Odienné", district: "Odienné", lat: 9.5075, lng: -7.5628, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale d'Odienné.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Bondoukou", city: "Bondoukou", district: "Bondoukou", lat: 8.0406, lng: -2.8000, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Bondoukou.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Dimbokro", city: "Dimbokro", district: "Dimbokro", lat: 6.6469, lng: -4.7056, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Dimbokro.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Séguéla", city: "Séguéla", district: "Séguéla", lat: 7.9611, lng: -6.6731, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Séguéla.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Touba", city: "Touba", district: "Touba", lat: 8.2833, lng: -7.6833, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Touba.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Bongouanou", city: "Bongouanou", district: "Bongouanou", lat: 6.6500, lng: -4.2000, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Bongouanou.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Issia", city: "Issia", district: "Issia", lat: 6.4922, lng: -6.5856, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale d'Issia.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Tiassalé", city: "Tiassalé", district: "Tiassalé", lat: 5.8983, lng: -4.8236, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Tiassalé.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Agboville", city: "Agboville", district: "Agboville", lat: 5.9281, lng: -4.2131, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale d'Agboville.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Adzopé", city: "Adzopé", district: "Adzopé", lat: 6.1069, lng: -3.8586, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale d'Adzopé.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Grand-Lahou", city: "Grand-Lahou", district: "Grand-Lahou", lat: 5.2500, lng: -5.0167, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Grand-Lahou.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Jacqueville", city: "Jacqueville", district: "Jacqueville", lat: 5.2050, lng: -4.4150, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Jacqueville.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Alépé", city: "Alépé", district: "Alépé", lat: 5.4950, lng: -3.6650, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale d'Alépé.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Dabou", city: "Dabou", district: "Dabou", lat: 5.3256, lng: -4.3769, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Dabou.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Grand-Bassam", city: "Grand-Bassam", district: "Grand-Bassam", lat: 5.2050, lng: -3.7400, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Grand-Bassam.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Bingerville", city: "Bingerville", district: "Bingerville", lat: 5.3550, lng: -3.8950, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Bingerville.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Abengourou", city: "Abengourou", district: "Abengourou", lat: 6.7297, lng: -3.4969, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale d'Abengourou.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Aboisso", city: "Aboisso", district: "Aboisso", lat: 5.4717, lng: -3.2067, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale d'Aboisso.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Adiaké", city: "Adiaké", district: "Adiaké", lat: 5.2667, lng: -3.2833, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale d'Adiaké.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Daoukro", city: "Daoukro", district: "Daoukro", lat: 7.0583, lng: -3.9667, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Daoukro.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Mankono", city: "Mankono", district: "Mankono", lat: 8.0583, lng: -6.1917, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Mankono.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Bouaflé", city: "Bouaflé", district: "Bouaflé", lat: 6.9897, lng: -5.7447, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Bouaflé.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Sinfra", city: "Sinfra", district: "Sinfra", lat: 6.6206, lng: -5.9106, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Sinfra.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Zuénoula", city: "Zuénoula", district: "Zuénoula", lat: 7.4267, lng: -6.0517, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Zuénoula.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Vavoua", city: "Vavoua", district: "Vavoua", lat: 7.3819, lng: -6.4778, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Vavoua.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Divo", city: "Divo", district: "Divo", lat: 5.8372, lng: -5.3572, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Divo.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Lakota", city: "Lakota", district: "Lakota", lat: 5.8500, lng: -5.6833, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Lakota.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Guiglo", city: "Guiglo", district: "Guiglo", lat: 6.5444, lng: -7.4983, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Guiglo.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Toulépleu", city: "Toulépleu", district: "Toulépleu", lat: 6.5833, lng: -8.1833, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Toulépleu.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Bangolo", city: "Bangolo", district: "Bangolo", lat: 6.8333, lng: -7.4833, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Bangolo.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Duékoué", city: "Duékoué", district: "Duékoué", lat: 6.7417, lng: -7.3533, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Duékoué.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Danané", city: "Danané", district: "Danané", lat: 7.2667, lng: -8.1500, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Danané.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Biankouma", city: "Biankouma", district: "Biankouma", lat: 7.7333, lng: -7.6167, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Biankouma.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Kouibly", city: "Kouibly", district: "Kouibly", lat: 7.0167, lng: -7.4000, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Kouibly.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Facobly", city: "Facobly", district: "Facobly", lat: 7.4167, lng: -7.2833, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Facobly.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Kani", city: "Kani", district: "Kani", lat: 9.3833, lng: -6.4833, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Kani.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Séguéla", city: "Séguéla", district: "Séguéla", lat: 7.9611, lng: -6.6731, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Séguéla.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Koro", city: "Koro", district: "Koro", lat: 9.3500, lng: -5.7167, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Koro.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Boundiali", city: "Boundiali", district: "Boundiali", lat: 9.5200, lng: -6.4833, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Boundiali.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Kong", city: "Kong", district: "Kong", lat: 9.1500, lng: -5.3000, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Kong.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Madinani", city: "Madinani", district: "Madinani", lat: 9.6333, lng: -6.2167, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Madinani.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Ferkessédougou", city: "Ferkessédougou", district: "Ferkessédougou", lat: 9.5989, lng: -5.1956, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Ferkessédougou.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Odienné", city: "Odienné", district: "Odienné", lat: 9.5075, lng: -7.5628, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale d'Odienné.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Tingréla", city: "Tingréla", district: "Tingréla", lat: 9.0333, lng: -5.8167, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Tingréla.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Niakaramandougou", city: "Niakaramandougou", district: "Niakaramandougou", lat: 8.7333, lng: -5.2833, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Niakaramandougou.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Ouaninou", city: "Ouaninou", district: "Ouaninou", lat: 9.3833, lng: -7.2167, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale d'Ouaninou.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Kaniasso", city: "Kaniasso", district: "Kaniasso", lat: 9.7167, lng: -7.3500, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Kaniasso.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Minignan", city: "Minignan", district: "Minignan", lat: 9.6167, lng: -6.8833, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Minignan.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Koutouba", city: "Koutouba", district: "Koutouba", lat: 9.4833, lng: -7.0167, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Koutouba.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Doropo", city: "Doropo", district: "Doropo", lat: 9.6833, lng: -4.3833, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Doropo.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Transua", city: "Transua", district: "Transua", lat: 8.1167, lng: -3.5833, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Transua.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Bouna", city: "Bouna", district: "Bouna", lat: 9.2667, lng: -2.9833, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Bouna.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Bondoukou", city: "Bondoukou", district: "Bondoukou", lat: 8.0406, lng: -2.8000, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Bondoukou.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Tanda", city: "Tanda", district: "Tanda", lat: 7.8033, lng: -3.1683, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Tanda.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Aboisso", city: "Aboisso", district: "Aboisso", lat: 5.4717, lng: -3.2067, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale d'Aboisso.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Grand-Bassam", city: "Grand-Bassam", district: "Grand-Bassam", lat: 5.2050, lng: -3.7400, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Grand-Bassam.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Tiapoum", city: "Tiapoum", district: "Tiapoum", lat: 5.0667, lng: -2.8000, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Tiapoum.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Grand-Lahou", city: "Grand-Lahou", district: "Grand-Lahou", lat: 5.2500, lng: -5.0167, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Grand-Lahou.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Dabou", city: "Dabou", district: "Dabou", lat: 5.3256, lng: -4.3769, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Dabou.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Adzopé", city: "Adzopé", district: "Adzopé", lat: 6.1069, lng: -3.8586, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale d'Adzopé.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Alépé", city: "Alépé", district: "Alépé", lat: 5.4950, lng: -3.6650, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale d'Alépé.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Jacqueville", city: "Jacqueville", district: "Jacqueville", lat: 5.2050, lng: -4.4150, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Jacqueville.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Bingerville", city: "Bingerville", district: "Bingerville", lat: 5.3550, lng: -3.8950, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Bingerville.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Abengourou", city: "Abengourou", district: "Abengourou", lat: 6.7297, lng: -3.4969, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale d'Abengourou.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Agboville", city: "Agboville", district: "Agboville", lat: 5.9281, lng: -4.2131, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale d'Agboville.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Dimbokro", city: "Dimbokro", district: "Dimbokro", lat: 6.6469, lng: -4.7056, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Dimbokro.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Daoukro", city: "Daoukro", district: "Daoukro", lat: 7.0583, lng: -3.9667, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Daoukro.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Mankono", city: "Mankono", district: "Mankono", lat: 8.0583, lng: -6.1917, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Mankono.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Bouaflé", city: "Bouaflé", district: "Bouaflé", lat: 6.9897, lng: -5.7447, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Bouaflé.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Sinfra", city: "Sinfra", district: "Sinfra", lat: 6.6206, lng: -5.9106, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Sinfra.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Zuénoula", city: "Zuénoula", district: "Zuénoula", lat: 7.4267, lng: -6.0517, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Zuénoula.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Vavoua", city: "Vavoua", district: "Vavoua", lat: 7.3819, lng: -6.4778, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Vavoua.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Divo", city: "Divo", district: "Divo", lat: 5.8372, lng: -5.3572, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Divo.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Lakota", city: "Lakota", district: "Lakota", lat: 5.8500, lng: -5.6833, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Lakota.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Guiglo", city: "Guiglo", district: "Guiglo", lat: 6.5444, lng: -7.4983, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Guiglo.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Toulépleu", city: "Toulépleu", district: "Toulépleu", lat: 6.5833, lng: -8.1833, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Toulépleu.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Bangolo", city: "Bangolo", district: "Bangolo", lat: 6.8333, lng: -7.4833, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Bangolo.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Duékoué", city: "Duékoué", district: "Duékoué", lat: 6.7417, lng: -7.3533, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Duékoué.", paymentMethods: '["especes"]', parking: null },
  { name: "PHARMACIE DE L'INSTITUT DE FORMATION EN SANTÉ RURALE", address: "Danané", city: "Danané", district: "Danané", lat: 7.2667, lng: -8.1500, phone: null, isGuard: false, is24h: false, openTime: "08:00", closeTime: "20:00", rating: 4.0, reviewCount: 0, services: '["conseil"]', description: "Pharmacie de l'Institut de Formation en Santé Rurale de Danané.", paymentMethods: '["especes"]', parking: null },
];

const MEDICATIONS = [
  { name: "Paracétamol", commercialName: "Doliprane 500mg", activePrinciple: "Paracétamol", pathology: "Douleur, Fièvre", category: "Antalgique", form: "Comprimé", needsPrescription: false, description: "Antalgique et antipyrétique utilisé pour soulager les douleurs légères à modérées et réduire la fièvre.", dosage: "Adultes : 500mg à 1g par prise, 3 à 4 fois par jour. Maximum 4g/jour.", sideEffects: "Rarement : réactions cutanées, troubles hépatiques à dose excessive." },
  { name: "Amoxicilline", commercialName: "Amoxicilline 500mg", activePrinciple: "Amoxicilline", pathology: "Infection bactérienne", category: "Antibiotique", form: "Gélule", needsPrescription: true, description: "Antibiotique de la famille des pénicillines utilisé pour traiter les infections bactériennes.", dosage: "Adultes : 500mg toutes les 8 heures pendant 7 à 10 jours.", sideEffects: "Nausées, diarrhée, éruption cutanée, réaction allergique possible." },
  { name: "Ibuprofène", commercialName: "Advil 400mg", activePrinciple: "Ibuprofène", pathology: "Douleur, Inflammation", category: "Anti-inflammatoire", form: "Comprimé", needsPrescription: false, description: "Anti-inflammatoire non stéroïdien (AINS) pour le traitement de la douleur et de l'inflammation.", dosage: "Adultes : 200 à 400mg par prise, 3 fois par jour au maximum.", sideEffects: "Troubles digestifs, ulcères gastriques, insuffisance rénale à long terme." },
  { name: "Métformine", commercialName: "Glucophage 500mg", activePrinciple: "Métformine", pathology: "Diabète de type 2", category: "Antidiabétique", form: "Comprimé", needsPrescription: true, description: "Antidiabétique oral de premier intention pour le traitement du diabète de type 2.", dosage: "Débuter à 500mg 2 fois/jour, augmenter progressivement jusqu'à 2000mg/jour.", sideEffects: "Troubles digestifs, nausées, diarrhée. Rare : acidose lactique." },
  { name: "Oméprazole", commercialName: "Mopral 20mg", activePrinciple: "Oméprazole", pathology: "Ulcère gastrique, Reflux", category: "Antiacide", form: "Gélule", needsPrescription: false, description: "Inhibiteur de la pompe à protons pour le traitement des ulcères et du reflux gastro-œsophagien.", dosage: "20mg par jour, le matin à jeun, pendant 4 à 8 semaines.", sideEffects: "Céphalées, diarrhée, douleurs abdominales." },
  { name: "Amlodipine", commercialName: "Amlor 5mg", activePrinciple: "Amlodipine", pathology: "Hypertension artérielle", category: "Antihypertenseur", form: "Comprimé", needsPrescription: true, description: "Inhibiteur calcique utilisé pour traiter l'hypertension artérielle et l'angine de poitrine.", dosage: "5mg par jour, peut être augmenté à 10mg/jour.", sideEffects: "Œdèmes des chevilles, céphalées, bouffées de chaleur, vertiges." },
  { name: "Azithromycine", commercialName: "Zithromax 250mg", activePrinciple: "Azithromycine", pathology: "Infection respiratoire", category: "Antibiotique", form: "Comprimé", needsPrescription: true, description: "Antibiotique macrolide pour le traitement des infections respiratoires et des infections à chlamydia.", dosage: "500mg le premier jour, puis 250mg par jour pendant 4 jours.", sideEffects: "Diarrhée, nausées, douleurs abdominales." },
  { name: "Cétirizine", commercialName: "Zyrtec 10mg", activePrinciple: "Cétirizine", pathology: "Allergie, Rhinite", category: "Antihistaminique", form: "Comprimé", needsPrescription: false, description: "Antihistaminique de deuxième génération pour le traitement des allergies saisonnières et perannuelles.", dosage: "10mg par jour chez l'adulte, 5mg chez l'enfant de 2 à 6 ans.", sideEffects: "Somnolence modérée, sécheresse buccale, céphalées." },
  { name: "Salbutamol", commercialName: "Ventoline", activePrinciple: "Salbutamol", pathology: "Asthme, Bronchospasme", category: "Bronchodilatateur", form: "Aérosol", needsPrescription: true, description: "Bronchodilatateur à action rapide pour le traitement des crises d'asthme et du bronchospasme.", dosage: "1 à 2 bouffées en cas de crise, renouvelables si nécessaire.", sideEffects: "Tremblements, palpitations, céphalées, hypokaliémie." },
  { name: "Fer", commercialName: "Tardyferon 80mg", activePrinciple: "Sulfate ferreux", pathology: "Anémie ferriprive", category: "Supplément", form: "Comprimé", needsPrescription: false, description: "Supplément en fer pour le traitement et la prévention de l'anémie par carence en fer.", dosage: "1 à 2 comprimés par jour, de préférence entre les repas.", sideEffects: "Troubles digestifs, constipation, coloration noire des selles." },
  { name: "Artemether-Luméfantrine", commercialName: "Coartem", activePrinciple: "Artemether / Luméfantrine", pathology: "Paludisme", category: "Antipaludéen", form: "Comprimé", needsPrescription: true, description: "Traitement antipaludéen combiné pour le paludisme à Plasmodium falciparum.", dosage: "6 doses sur 3 jours selon le poids du patient.", sideEffects: "Céphalées, vertiges, anorexie, nausées, douleurs abdominales." },
  { name: "Artémisinine", commercialName: "Artesunate 50mg", activePrinciple: "Artésunate", pathology: "Paludisme grave", category: "Antipaludéen", form: "Comprimé", needsPrescription: true, description: "Dérivé de l'artémisinine pour le traitement du paludisme grave.", dosage: "4mg/kg par jour pendant 3 jours, en association.", sideEffects: "Neurotoxicité possible à haute dose, anémie hémolytique." },
];

const GENERIC_ALTERNATIVES = [
  ["Paracétamol", "Efferalgan"],
  ["Ibuprofène", "Spedifen"],
  ["Oméprazole", "Losec"],
  ["Amlodipine", "Norvasc"],
  ["Cétirizine", "Virlix"],
];

const REVIEWS = [
  { pharmacyName: "Pharmacie de la Paix", userName: "Koffi M.", rating: 5, comment: "Excellent service, pharmacien très compétent. Médicaments toujours en stock." },
  { pharmacyName: "Pharmacie de la Paix", userName: "Aïcha D.", rating: 4, comment: "Pharmacie propre et bien organisée. Parfois un peu d'attente le soir." },
  { pharmacyName: "Pharmacie Yopougon", userName: "Moussa K.", rating: 5, comment: "Ouverte 24h/24, sauvé en urgence à 2h du matin!" },
  { pharmacyName: "Pharmacie Yopougon", userName: "Fatou B.", rating: 4, comment: "Très pratique, mais les prix sont un peu élevés." },
  { pharmacyName: "Pharmacie d'Angre", userName: "Dr. Konan", rating: 5, comment: "Service drive très pratique. Je recommande!" },
  { pharmacyName: "Pharmacie d'Angre", userName: "Yao S.", rating: 5, comment: "La meilleure pharmacie d'Abidjan. Personnel qualifié." },
  { pharmacyName: "Pharmacie Centrale d'Abidjan", userName: "Mariam T.", rating: 4, comment: "Bon choix de médicaments, mais le parking est difficile." },
  { pharmacyName: "Pharmacie Marcory", userName: "Jean-Baptiste A.", rating: 4, comment: "Service correct, pharmacien disponible." },
  { pharmacyName: "Pharmacie de Bouaké", userName: "Aminata C.", rating: 4, comment: "Seule pharmacie de garde ici, heureusement qu'elle existe." },
  { pharmacyName: "Pharmacie du Lycée", userName: "Olivier P.", rating: 3, comment: "Service correct mais attente parfois longue." },
];

async function seed() {
  const hashedPassword = await hash('demo1234', 10);

  // Clear existing data (order matters due to foreign keys)
  await db.promotion.deleteMany();
  await db.message.deleteMany();
  await db.notification.deleteMany();
  await db.stockHistory.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.review.deleteMany();
  await db.pharmacyMedication.deleteMany();
  await db.medicationAlternative.deleteMany();
  await db.searchHistory.deleteMany();
  await db.favorite.deleteMany();
  await db.medication.deleteMany();
  await db.pharmacy.deleteMany();
  await db.user.deleteMany();

  // Seed users — pharmacist user (index 2) will be linked to "Pharmacie de la Paix" (index 0)
  const users = await Promise.all([
    db.user.create({ data: { name: "Koffi Mensah", email: "koffi@example.com", phone: "+225 07 08 09 10 11", password: hashedPassword, role: "patient", city: "Abidjan", authProvider: "email" } }),
    db.user.create({ data: { name: "Aïcha Diallo", email: "aicha@example.com", phone: "+225 05 06 07 08 09", password: hashedPassword, role: "patient", city: "Bouaké", authProvider: "email" } }),
    db.user.create({ data: { name: "Dr. Konan", email: "konan@pharmacie.ci", phone: "+225 01 02 03 04 05", password: hashedPassword, role: "pharmacist", city: "Abidjan", authProvider: "email", notificationPreferences: '{"orders":true,"stock":true,"reviews":false,"messages":true}' } }),
    db.user.create({ data: { name: "Yaya Touré", email: "yaya@example.com", phone: "+225 07 65 43 21 09", password: hashedPassword, role: "patient", city: "Abidjan", authProvider: "email" } }),
    db.user.create({ data: { name: "Admin Pharma", email: "admin@pharmapp.ci", phone: "+225 01 00 00 00 00", password: hashedPassword, role: "admin", city: "Abidjan", authProvider: "email" } }),
  ]);

  // Seed pharmacies
  const pharmacies = await Promise.all(
    PHARMACIES.map(p =>
      db.pharmacy.create({
        data: {
          name: p.name,
          address: p.address,
          city: p.city,
          district: p.district,
          latitude: p.lat,
          longitude: p.lng,
          phone: p.phone,
          isGuard: p.isGuard,
          isOpen24h: p.is24h,
          openTime: p.openTime,
          closeTime: p.closeTime,
          rating: p.rating,
          reviewCount: p.reviewCount,
          services: p.services,
          description: p.description,
          paymentMethods: p.paymentMethods || '[]',
          parkingInfo: p.parking || null,
        }
      })
    )
  );

  // Link pharmacist to first pharmacy
  await db.user.update({
    where: { id: users[2].id },
    data: { linkedPharmacyId: pharmacies[0].id },
  });

  // Seed medications
  const medications = await Promise.all(
    MEDICATIONS.map(m =>
      db.medication.create({
        data: {
          name: m.name,
          commercialName: m.commercialName,
          activePrinciple: m.activePrinciple,
          pathology: m.pathology,
          category: m.category,
          form: m.form,
          needsPrescription: m.needsPrescription,
          description: m.description,
          dosage: m.dosage,
          sideEffects: m.sideEffects,
        }
      })
    )
  );

  // Seed pharmacy medications (stocks)
  for (let i = 0; i < pharmacies.length; i++) {
    const numMeds = 5 + Math.floor(Math.random() * 6);
    const shuffled = [...medications].sort(() => Math.random() - 0.5);
    for (let j = 0; j < numMeds; j++) {
      const med = shuffled[j];
      const basePrice: Record<string, number> = {
        "Paracétamol": 500, "Amoxicilline": 2500, "Ibuprofène": 800,
        "Métformine": 3000, "Oméprazole": 1500, "Amlodipine": 3500,
        "Azithromycine": 4500, "Cétirizine": 1200, "Salbutamol": 4000,
        "Fer": 800, "Artemether-Luméfantrine": 5500, "Artémisinine": 6000,
      };
      const price = (basePrice[med.name] || 1000) * (0.9 + Math.random() * 0.3);
      // Random expiration date: between 1 month and 2 years from now
      const expMonths = 1 + Math.floor(Math.random() * 23);
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + expMonths);
      // 10% chance of being already expired (1-30 days ago)
      const isExpired = Math.random() < 0.1;
      if (isExpired) {
        expirationDate.setDate(expirationDate.getDate() - (expMonths * 30 + Math.floor(Math.random() * 30)));
      }

      await db.pharmacyMedication.create({
        data: {
          pharmacyId: pharmacies[i].id,
          medicationId: med.id,
          price: Math.round(price),
          inStock: Math.random() > 0.15,
          quantity: Math.floor(Math.random() * 200) + 10,
          expirationDate,
        }
      });
    }
  }

  // Seed generic alternatives
  for (const [name1, name2] of GENERIC_ALTERNATIVES) {
    const med1 = medications.find(m => m.name === name1);
    const med2 = medications.find(m => m.commercialName === name2);
    if (med1 && med2) {
      await db.medicationAlternative.create({ data: { medicationId: med1.id, alternativeId: med2.id } });
      await db.medicationAlternative.create({ data: { medicationId: med2.id, alternativeId: med1.id } });
    }
  }

  // Seed reviews
  for (const r of REVIEWS) {
    const pharmacy = pharmacies.find(p => p.name === r.pharmacyName);
    const user = users[Math.floor(Math.random() * users.length)];
    if (pharmacy) {
      await db.review.create({
        data: {
          userId: user.id,
          pharmacyId: pharmacy.id,
          rating: r.rating,
          comment: r.comment,
        }
      });
    }
  }

  // Seed sample orders for the pharmacist's pharmacy
  const pharmacyPharmacy = pharmacies[0]; // Pharmacie de la Paix
  const phStocks = await db.pharmacyMedication.findMany({
    where: { pharmacyId: pharmacyPharmacy.id },
    include: { medication: true },
  });

  const orderStatuses = ["pending", "confirmed", "ready", "picked_up", "cancelled"];
  const paymentMethods = ["especes", "orange_money", "wave", "carte"];
  const patientUsers = users.filter(u => u.role === "patient");

  for (let i = 0; i < 12; i++) {
    const stock = phStocks[Math.floor(Math.random() * phStocks.length)];
    const user = patientUsers[Math.floor(Math.random() * patientUsers.length)];
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    const qty = Math.floor(Math.random() * 3) + 1;
    const daysAgo = Math.floor(Math.random() * 14);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);

    // Generate verification code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let verificationCode = '';
    for (let k = 0; k < 6; k++) {
      verificationCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    await db.order.create({
      data: {
        userId: user.id,
        pharmacyId: pharmacyPharmacy.id,
        status,
        totalQuantity: qty,
        totalPrice: Math.round(stock.price * qty),
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        pickupTime: `${8 + Math.floor(Math.random() * 10)}:00`,
        note: i % 4 === 0 ? "Urgent svp" : null,
        verificationCode,
        createdAt,
        items: {
          create: {
            medicationId: stock.medicationId,
            quantity: qty,
            price: stock.price,
          }
        }
      }
    });
  }

  // Seed stock history for the pharmacist's pharmacy
  for (let i = 0; i < 15; i++) {
    const stock = phStocks[Math.floor(Math.random() * phStocks.length)];
    const types = ["entry", "exit", "adjustment"];
    const type = types[Math.floor(Math.random() * types.length)];
    const qty = Math.floor(Math.random() * 50) + 5;
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);

    await db.stockHistory.create({
      data: {
        pharmacyId: pharmacyPharmacy.id,
        medicationId: stock.medicationId,
        type,
        quantity: qty,
        note: type === "entry" ? "Réapprovisionnement" : type === "exit" ? "Vente client" : "Inventaire",
        createdAt,
      }
    });
  }

  // Seed notifications for the pharmacist
  const notifications = [
    { title: "Nouvelle commande", message: "Koffi Mensah a passé une commande de Paracétamol 500mg", type: "order", read: false },
    { title: "Stock faible", message: "Amoxicilline 500mg - Quantité restante: 5 unités", type: "alert", read: false },
    { title: "Nouvel avis client", message: "Aïcha D. a laissé un avis 4 étoiles sur votre pharmacie", type: "review", read: false },
    { title: "Commande confirmée", message: "La commande #CMD-005 a été confirmée par le client", type: "order", read: true },
    { title: "Rappel réapprovisionnement", message: "Ibuprofène 400mg est en rupture de stock depuis 2 jours", type: "alert", read: true },
    { title: "Bienvenue!", message: "Votre espace pharmacien est prêt. Gérez vos stocks et commandes.", type: "info", read: true },
  ];

  for (const n of notifications) {
    const daysAgo = n.read ? Math.floor(Math.random() * 7) + 1 : Math.floor(Math.random() * 2);
    const createdAt = new Date();
    createdAt.setHours(createdAt.getHours() - daysAgo);

    await db.notification.create({
      data: {
        userId: users[2].id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt,
      }
    });
  }

  console.log("✅ Seed completed successfully!");
  console.log(`  Users: ${users.length}`);
  console.log(`  Pharmacies: ${pharmacies.length}`);
  console.log(`  Medications: ${medications.length}`);
  console.log(`  Pharmacist: konan@pharmacie.ci → Pharmacie de la Paix`);
  console.log(`  Admin: admin@pharmapp.ci → Password: demo1234`);
  console.log(`  Default password: demo1234`);

  // Add review replies for pharmacist's pharmacy
  const pharmaReviews = await db.review.findMany({
    where: { pharmacyId: pharmacyPharmacy.id },
  });
  if (pharmaReviews.length > 0) {
    await db.review.update({
      where: { id: pharmaReviews[0].id },
      data: { reply: "Merci beaucoup pour votre retour positif ! Nous sommes ravis de vous satisfaire.", replyAt: new Date() },
    });
  }

  // Seed promotions for pharmacist's pharmacy
  const now = new Date();
  const promos = [
    { name: "Promo Paracétamol - Printemps", desc: "-20% sur le Doliprane 500mg pour la saison", discount: 20, medicationName: "Paracétamol", startDays: -5, endDays: 25 },
    { name: "Offre Ibuprofène", desc: "-15% sur l'Advil 400mg", discount: 15, medicationName: "Ibuprofène", startDays: -10, endDays: 5 },
    { name: "Promo Antipaludéen", desc: "-10% sur le Coartem", discount: 10, medicationName: "Artemether-Luméfantrine", startDays: 0, endDays: 30 },
    { name: "Soldes d'été", desc: "-25% sur la Vitamine C et suppléments", discount: 25, medicationName: null, startDays: 5, endDays: 60 },
  ];
  for (const p of promos) {
    const med = p.medicationName ? medications.find(m => m.name === p.medicationName) : null;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + p.startDays);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + p.endDays);
    await db.promotion.create({
      data: {
        pharmacyId: pharmacyPharmacy.id,
        medicationId: med?.id || null,
        name: p.name,
        description: p.desc,
        discountType: "percentage",
        discountValue: p.discount,
        startDate,
        endDate,
        isActive: p.endDays > 0,
      }
    });
  }
}

seed().catch(console.error);
