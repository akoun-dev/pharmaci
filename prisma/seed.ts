import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PHARMACI database...");

  // ---------- USERS ----------
  const patientPassword = await bcrypt.hash("patient123", 10);
  const pharmacistPassword = await bcrypt.hash("pharma123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  const patient = await prisma.user.upsert({
    where: { email: "patient@pharmaci.ci" },
    update: {},
    create: {
      email: "patient@pharmaci.ci",
      password: patientPassword,
      name: "Aïcha Koné",
      role: "PATIENT",
      phone: "+225 07 00 11 22 33",
      address: "Riviera Palmeraie",
      city: "Abidjan",
      district: "Cocody",
    },
  });

  const pharmacist = await prisma.user.upsert({
    where: { email: "pharmacien@pharmaci.ci" },
    update: {},
    create: {
      email: "pharmacien@pharmaci.ci",
      password: pharmacistPassword,
      name: "Koffi Yao",
      role: "PHARMACIST",
      phone: "+225 07 11 22 33 44",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@pharmaci.ci" },
    update: {},
    create: {
      email: "admin@pharmaci.ci",
      password: adminPassword,
      name: "Admin Plateforme",
      role: "ADMIN",
      phone: "+225 07 99 88 77 66",
    },
  });

  // ---------- PHARMACIES ----------
  const pharmacies = [
    {
      name: "Pharmacie de la Paix",
      address: "Bd de France, Cocody",
      city: "Abidjan",
      district: "Cocody",
      latitude: 5.3601,
      longitude: -4.0086,
      phone: "+225 27 22 44 11 22",
      email: "contact@pharmaciedelapaix.ci",
      isOpen24h: true,
      isOnGuard: true,
      services: "vaccination,conseil,livraison,tiers_payant",
      payments: "mobile_money,cash,card",
      imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400",
    },
    {
      name: "Pharmacie Sainte Marie",
      address: "Rue des Jardins, II Plateaux",
      city: "Abidjan",
      district: "Cocody",
      latitude: 5.3731,
      longitude: -3.9976,
      phone: "+225 27 22 45 33 44",
      email: "contact@pharmaciestemarie.ci",
      isOpen24h: false,
      isOnGuard: false,
      services: "conseil,tiers_payant",
      payments: "mobile_money,cash",
      imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400",
    },
    {
      name: "Pharmacie du Plateau",
      address: "Avenue Chardy, Plateau",
      city: "Abidjan",
      district: "Plateau",
      latitude: 5.3164,
      longitude: -4.0083,
      phone: "+225 27 20 22 33 44",
      email: "contact@pharmacieduplateau.ci",
      isOpen24h: true,
      isOnGuard: true,
      services: "vaccination,conseil,livraison",
      payments: "mobile_money,cash,card",
      imageUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400",
    },
    {
      name: "Pharmacie de la Riviera",
      address: "Bd Latrille, Riviera",
      city: "Abidjan",
      district: "Cocody",
      latitude: 5.3856,
      longitude: -3.9889,
      phone: "+225 27 22 48 55 66",
      email: "contact@pharmacieriviera.ci",
      isOpen24h: false,
      isOnGuard: false,
      services: "vaccination,conseil",
      payments: "mobile_money,cash",
      imageUrl: "https://images.unsplash.com/photo-1591561582306-3d0d3c4e3e3e?w=400",
    },
    {
      name: "Pharmacie de Yopougon",
      address: "Market Street, Yopougon",
      city: "Abidjan",
      district: "Yopougon",
      latitude: 5.3401,
      longitude: -4.0886,
      phone: "+225 27 22 50 66 77",
      email: "contact@pharmacieyopougon.ci",
      isOpen24h: true,
      isOnGuard: true,
      services: "vaccination,conseil,livraison,tiers_payant",
      payments: "mobile_money,cash,card",
      imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400",
    },
    {
      name: "Pharmacie Centrale de Marcory",
      address: "Bd Valery Giscard, Marcory",
      city: "Abidjan",
      district: "Marcory",
      latitude: 5.2944,
      longitude: -4.0019,
      phone: "+225 27 21 25 77 88",
      email: "contact@pharmaciemarcory.ci",
      isOpen24h: false,
      isOnGuard: false,
      services: "conseil,livraison",
      payments: "mobile_money,cash",
      imageUrl: "https://images.unsplash.com/photo-1577153977851-7b7b3e1d3e3e?w=400",
    },
    {
      name: "Pharmacie de Treichville",
      address: "Av 10, Treichville",
      city: "Abidjan",
      district: "Treichville",
      latitude: 5.2894,
      longitude: -4.0094,
      phone: "+225 27 21 30 88 99",
      email: "contact@pharmacietreichville.ci",
      isOpen24h: true,
      isOnGuard: true,
      services: "vaccination,conseil,livraison,tiers_payant",
      payments: "mobile_money,cash,card",
      imageUrl: "https://images.unsplash.com/photo-1588776814546-1f2d9cb1c8b1?w=400",
    },
    {
      name: "Pharmacie d'Abobo",
      address: "Centre Ville, Abobo",
      city: "Abidjan",
      district: "Abobo",
      latitude: 5.4244,
      longitude: -4.0186,
      phone: "+225 27 22 60 99 00",
      email: "contact@pharmacieabobo.ci",
      isOpen24h: false,
      isOnGuard: false,
      services: "conseil",
      payments: "cash",
      imageUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400",
    },
  ];

  const createdPharmacies = [];
  for (let i = 0; i < pharmacies.length; i++) {
    const p = pharmacies[i];
    // First pharmacy owned by our pharmacist, others owned by admin for demo
    const ownerId = i === 0 ? pharmacist.id : admin.id;
    const pharmacy = await prisma.pharmacy.upsert({
      where: { ownerId },
      update: {},
      create: { ...p, ownerId },
    });
    createdPharmacies.push(pharmacy);
  }

  // ---------- MEDICATIONS ----------
  const medications = [
    {
      name: "Paracétamol 500mg",
      activeIngredient: "Paracétamol",
      category: "Antalgiques",
      dosage: "500mg",
      form: "Comprimé",
      description: "Analgésique et antipyrétique. Soulage les douleurs légères à modérées et fait baisser la fièvre.",
      prescriptionRequired: false,
      sideEffects: "Nausées, allergies rares, atteinte hépatique en cas de surdosage",
      contraindications: "Insuffisance hépatique sévère, allergie au paracétamol",
    },
    {
      name: "Ibuprofène 400mg",
      activeIngredient: "Ibuprofène",
      category: "Antalgiques",
      dosage: "400mg",
      form: "Comprimé",
      description: "Anti-inflammatoire non stéroïdien. Soulage douleurs, fièvre et inflammations.",
      prescriptionRequired: false,
      sideEffects: "Troubles digestifs, brûlures d'estomac",
      contraindications: "Ulcère gastrique, insuffisance rénale sévère, grossesse 3e trimestre",
    },
    {
      name: "Amoxicilline 500mg",
      activeIngredient: "Amoxicilline",
      category: "Antibiotiques",
      dosage: "500mg",
      form: "Gélule",
      description: "Antibiotique de la famille des pénicillines. Traite les infections bactériennes.",
      prescriptionRequired: true,
      sideEffects: "Nausées, diarrhée, réactions allergiques",
      contraindications: "Allergie aux pénicillines",
    },
    {
      name: "Co-artem (Artéméther+Luméfantrine)",
      activeIngredient: "Artéméther + Luméfantrine",
      category: "Antipaludéens",
      dosage: "20mg/120mg",
      form: "Comprimé",
      description: "Traitement du paludisme non compliqué à Plasmodium falciparum.",
      prescriptionRequired: true,
      sideEffects: "Maux de tête, vertiges, troubles digestifs",
      contraindications: "Hypersensibilité connue, premier trimestre de grossesse",
    },
    {
      name: "Aspirine 500mg (ASA)",
      activeIngredient: "Acide acétylsalicylique",
      category: "Antalgiques",
      dosage: "500mg",
      form: "Comprimé",
      description: "Analgésique, antipyrétique et anti-inflammatoire. Prévention cardiovasculaire à faible dose.",
      prescriptionRequired: false,
      sideEffects: "Saignements, troubles digestifs",
      contraindications: "Enfant < 16 ans (syndrome de Reye), ulcère, troubles de la coagulation",
    },
    {
      name: "Métronidazole 500mg",
      activeIngredient: "Métronidazole",
      category: "Antibiotiques",
      dosage: "500mg",
      form: "Comprimé",
      description: "Antibiotique et antiparasitaire. Traite les infections anaérobies et parasitaires.",
      prescriptionRequired: true,
      sideEffects: "Goût métallique, nausées, prise d'alcool déconseillée",
      contraindications: "Premier trimestre de grossesse, prise d'alcool",
    },
    {
      name: "Coton hydrophile 100g",
      activeIngredient: "Coton naturel",
      category: "Pansements",
      dosage: "100g",
      form: "Pansement",
      description: "Coton hydrophile stérile pour soins et pansements.",
      prescriptionRequired: false,
      sideEffects: "",
      contraindications: "",
    },
    {
      name: "Vitamine C 1000mg",
      activeIngredient: "Acide ascorbique",
      category: "Vitamines",
      dosage: "1000mg",
      form: "Comprimé effervescent",
      description: "Complément alimentaire. Soutient le système immunitaire et réduit la fatigue.",
      prescriptionRequired: false,
      sideEffects: "Troubles digestifs à haute dose",
      contraindications: "Lithiase rénale oxalique",
    },
    {
      name: "Sérum physiologique 500ml",
      activeIngredient: "Chlorure de sodium 0.9%",
      category: "Pansements",
      dosage: "500ml",
      form: "Solution",
      description: "Solution saline pour nettoyage des plaies, yeux et nez.",
      prescriptionRequired: false,
      sideEffects: "",
      contraindications: "",
    },
    {
      name: "Cétirizine 10mg",
      activeIngredient: "Cétirizine",
      category: "Antihistaminiques",
      dosage: "10mg",
      form: "Comprimé",
      description: "Antihistaminique. Traite les allergies (rhinite, urticaire).",
      prescriptionRequired: false,
      sideEffects: "Somnolence, sécheresse buccale",
      contraindications: "Insuffisance rénale sévère",
    },
    {
      name: "Oméprazole 20mg",
      activeIngredient: "Oméprazole",
      category: "Gastro-entérologie",
      dosage: "20mg",
      form: "Gélule",
      description: "Inhibiteur de la pompe à protons. Réduit l'acidité gastrique.",
      prescriptionRequired: true,
      sideEffects: "Maux de tête, troubles digestifs",
      contraindications: "Hypersensibilité",
    },
    {
      name: "Doliprane Sirop 2.4%",
      activeIngredient: "Paracétamol",
      category: "Antalgiques",
      dosage: "2.4%",
      form: "Sirop",
      description: "Sirop antalgique et antipyrétique pour enfants.",
      prescriptionRequired: false,
      sideEffects: "Allergies rares",
      contraindications: "Insuffisance hépatique",
    },
  ];

  const createdMedications = [];
  for (const m of medications) {
    const med = await prisma.medication.upsert({
      where: { id: m.name }, // Will be created with new ID since upsert uses where
      update: {},
      create: m,
    });
    createdMedications.push(med);
  }

  // ---------- PHARMACY MEDICATIONS (STOCKS) ----------
  // Assign medications to pharmacies with prices and stock
  const priceRanges: Record<string, [number, number]> = {
    "Paracétamol 500mg": [500, 1500],
    "Ibuprofène 400mg": [800, 2000],
    "Amoxicilline 500mg": [2500, 5000],
    "Co-artem (Artéméther+Luméfantrine)": [3500, 6500],
    "Aspirine 500mg (ASA)": [600, 1500],
    "Métronidazole 500mg": [1800, 3500],
    "Coton hydrophile 100g": [800, 1800],
    "Vitamine C 1000mg": [1200, 2800],
    "Sérum physiologique 500ml": [900, 2000],
    "Cétirizine 10mg": [1000, 2500],
    "Oméprazole 20mg": [2200, 4500],
    "Doliprane Sirop 2.4%": [1500, 3200],
  };

  for (const pharmacy of createdPharmacies) {
    // Assign all medications to each pharmacy with varying stock/price
    for (const med of createdMedications) {
      const [minP, maxP] = priceRanges[med.name] || [500, 2000];
      const price = Math.floor(Math.random() * (maxP - minP) + minP);
      // Round to nearest 50
      const roundedPrice = Math.round(price / 50) * 50;
      const stock = Math.floor(Math.random() * 80) + 5; // 5-85 units
      const threshold = 10;

      // Expiry date in 1-3 years
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + Math.floor(Math.random() * 2) + 1);

      await prisma.pharmacyMedication.upsert({
        where: {
          pharmacyId_medicationId: {
            pharmacyId: pharmacy.id,
            medicationId: med.id,
          },
        },
        update: {},
        create: {
          pharmacyId: pharmacy.id,
          medicationId: med.id,
          price: roundedPrice,
          stock,
          lowStockThreshold: threshold,
          expiryDate,
        },
      });
    }
  }

  // ---------- ADDITIONAL PATIENTS (for reviews) ----------
  const extraPatients = [];
  const firstNames = ["Awa", "Mamadou", "Fatou", "Ibrahim", "Aminata", "Sékou", "Aya", "Boubacar", "Mariam", "Adama"];
  const lastNames = ["Traoré", "Diallo", "Coulibaly", "Bamba", "Touré", "Diabaté", "Sangaré", "Cissé", "Konaté", "Fofana"];
  for (let i = 0; i < 10; i++) {
    const name = `${firstNames[i]} ${lastNames[i]}`;
    const pwd = await bcrypt.hash("patient123", 10);
    const u = await prisma.user.upsert({
      where: { email: `patient${i + 1}@pharmaci.ci` },
      update: {},
      create: {
        email: `patient${i + 1}@pharmaci.ci`,
        password: pwd,
        name,
        role: "PATIENT",
        phone: `+225 07 0${i} ${10 + i} ${20 + i} ${30 + i}`,
        city: "Abidjan",
      },
    });
    extraPatients.push(u);
  }

  // ---------- REVIEWS ----------
  const reviews = [
    { rating: 5, comment: "Service excellent, personnel très accueillant. Médicaments toujours disponibles." },
    { rating: 4, comment: "Bonne pharmacie, mais attente parfois longue le soir." },
    { rating: 5, comment: "Pharmacie de garde très pratique, ouverte 24h/24." },
    { rating: 4, comment: "Pharmaciens compétents, bons conseils." },
    { rating: 3, comment: "Correct mais prix un peu élevés." },
    { rating: 5, comment: "Je recommande, surtout pour le service de livraison." },
    { rating: 4, comment: "Bon accueil, prix raisonnables." },
    { rating: 5, comment: "Pharmacie propre et bien organisée." },
  ];
  const allReviewers = [patient, ...extraPatients];

  for (const pharmacy of createdPharmacies) {
    const numReviews = Math.floor(Math.random() * 4) + 3; // 3-6 reviews
    // pick random distinct reviewers
    const shuffled = [...allReviewers].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numReviews && i < shuffled.length; i++) {
      const review = reviews[Math.floor(Math.random() * reviews.length)];
      await prisma.review.create({
        data: {
          userId: shuffled[i].id,
          pharmacyId: pharmacy.id,
          rating: review.rating,
          comment: review.comment,
        },
      }).catch(() => {});
    }
    // Update pharmacy rating
    const allReviews = await prisma.review.findMany({ where: { pharmacyId: pharmacy.id } });
    if (allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await prisma.pharmacy.update({
        where: { id: pharmacy.id },
        data: {
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: allReviews.length,
        },
      });
    }
  }

  // ---------- FAVORITES ----------
  await prisma.favorite.create({
    data: {
      userId: patient.id,
      pharmacyId: createdPharmacies[0].id,
    },
  }).catch(() => {});

  // ---------- ORDERS ----------
  const sampleOrders = [
    {
      code: "PHARMACI-AB7K2P",
      status: "READY",
      pharmacy: createdPharmacies[0],
      meds: [createdMedications[0], createdMedications[7]],
      quantities: [2, 1],
      notes: "Récupération en fin de journée",
    },
    {
      code: "PHARMACI-XY9M3Q",
      status: "CONFIRMED",
      pharmacy: createdPharmacies[2],
      meds: [createdMedications[2]],
      quantities: [1],
      notes: "Ordonnance fournie",
    },
    {
      code: "PHARMACI-LM4N8R",
      status: "PICKED_UP",
      pharmacy: createdPharmacies[0],
      meds: [createdMedications[10], createdMedications[9]],
      quantities: [1, 2],
      notes: "",
    },
  ];

  for (const order of sampleOrders) {
    const items = order.meds.map((med, idx) => {
      const qty = order.quantities[idx];
      // Find the stock price for this pharmacy+medication
      return { med, qty };
    });

    // Get prices from PharmacyMedication
    let total = 0;
    const orderItems = [];
    for (const item of items) {
      const pm = await prisma.pharmacyMedication.findUnique({
        where: {
          pharmacyId_medicationId: {
            pharmacyId: order.pharmacy.id,
            medicationId: item.med.id,
          },
        },
      });
      const unitPrice = pm?.price || 1000;
      total += unitPrice * item.qty;
      orderItems.push({ med: item.med, qty: item.qty, unitPrice });
    }

    const created = await prisma.order.create({
      data: {
        code: order.code,
        userId: patient.id,
        pharmacyId: order.pharmacy.id,
        status: order.status,
        totalAmount: total,
        notes: order.notes,
        items: {
          create: orderItems.map((it) => ({
            medicationId: it.med.id,
            quantity: it.qty,
            unitPrice: it.unitPrice,
            totalPrice: it.unitPrice * it.qty,
          })),
        },
      },
    });
    console.log(`   ✓ Order ${created.code} created`);
  }

  console.log("✅ Seed completed!");
  console.log("   Patient:  patient@pharmaci.ci / patient123");
  console.log("   Pharmacist: pharmacien@pharmaci.ci / pharma123");
  console.log("   Admin:    admin@pharmaci.ci / admin123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
