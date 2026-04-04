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

    await db.order.create({
      data: {
        userId: user.id,
        pharmacyId: pharmacyPharmacy.id,
        medicationId: stock.medicationId,
        status,
        quantity: qty,
        totalPrice: Math.round(stock.price * qty),
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        pickupTime: `${8 + Math.floor(Math.random() * 10)}:00`,
        note: i % 4 === 0 ? "Urgent svp" : null,
        createdAt,
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
