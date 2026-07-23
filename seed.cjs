// seed.cjs — Pure CommonJS seed script (no tsx needed)
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding PHARMACI database...");

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
    where: { email: "pharma@pharmaci.ci" },
    update: {},
    create: {
      email: "pharma@pharmaci.ci",
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

  console.log("  Users created");

  const pharmacies = [
    { name: "Pharmacie de la Paix", address: "Bd de France, Cocody", city: "Abidjan", district: "Cocody", latitude: 5.3601, longitude: -4.0086, phone: "+225 27 22 44 11 22", email: "contact@pharmaciedelapaix.ci", isOpen24h: true, isOnGuard: true, services: "vaccination,conseil,livraison,tiers_payant", payments: "mobile_money,cash,card" },
    { name: "Pharmacie Sainte Marie", address: "Rue des Jardins, II Plateaux", city: "Abidjan", district: "Cocody", latitude: 5.3731, longitude: -3.9976, phone: "+225 27 22 45 33 44", email: "contact@pharmaciestemarie.ci", isOpen24h: false, isOnGuard: false, services: "conseil,tiers_payant", payments: "mobile_money,cash" },
    { name: "Pharmacie du Plateau", address: "Avenue Chardy, Plateau", city: "Abidjan", district: "Plateau", latitude: 5.3164, longitude: -4.0083, phone: "+225 27 20 22 33 44", email: "contact@pharmacieduplateau.ci", isOpen24h: true, isOnGuard: true, services: "vaccination,conseil,livraison", payments: "mobile_money,cash,card" },
    { name: "Pharmacie de la Riviera", address: "Bd Latrille, Riviera", city: "Abidjan", district: "Cocody", latitude: 5.3856, longitude: -3.9889, phone: "+225 27 22 48 55 66", email: "contact@pharmacieriviera.ci", isOpen24h: false, isOnGuard: false, services: "vaccination,conseil", payments: "mobile_money,cash" },
    { name: "Pharmacie de Yopougon", address: "Market Street, Yopougon", city: "Abidjan", district: "Yopougon", latitude: 5.3401, longitude: -4.0886, phone: "+225 27 22 50 66 77", email: "contact@pharmacieyopougon.ci", isOpen24h: true, isOnGuard: true, services: "vaccination,conseil,livraison,tiers_payant", payments: "mobile_money,cash,card" },
    { name: "Pharmacie Centrale de Marcory", address: "Bd Valery Giscard, Marcory", city: "Abidjan", district: "Marcory", latitude: 5.2944, longitude: -4.0019, phone: "+225 27 21 25 77 88", email: "contact@pharmaciemarcory.ci", isOpen24h: false, isOnGuard: false, services: "conseil,livraison", payments: "mobile_money,cash" },
    { name: "Pharmacie de Treichville", address: "Av 10, Treichville", city: "Abidjan", district: "Treichville", latitude: 5.2894, longitude: -4.0094, phone: "+225 27 21 30 88 99", email: "contact@pharmacietreichville.ci", isOpen24h: true, isOnGuard: true, services: "vaccination,conseil,livraison,tiers_payant", payments: "mobile_money,cash,card" },
    { name: "Pharmacie d'Abobo", address: "Centre Ville, Abobo", city: "Abidjan", district: "Abobo", latitude: 5.4244, longitude: -4.0186, phone: "+225 27 22 60 99 00", email: "contact@pharmacieabobo.ci", isOpen24h: false, isOnGuard: false, services: "conseil", payments: "cash" },
  ];

  const pharmacistNames = ["Dr. Aya Traoré", "Dr. Mamadou Diallo", "Dr. Fatou Coulibaly", "Dr. Ibrahim Bamba", "Dr. Aminata Touré", "Dr. Sékou Diabaté", "Dr. Boubacar Sangaré"];
  const extraPharmacists = [];
  for (let i = 0; i < pharmacistNames.length; i++) {
    const email = `pharma${i + 1}@pharmaci.ci`;
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, password: pharmacistPassword, name: pharmacistNames[i], role: "PHARMACIST", phone: `+225 07 1${i} ${20 + i} ${30 + i} ${40 + i}`, city: "Abidjan" },
    });
    extraPharmacists.push(u);
  }

  const createdPharmacies = [];
  for (let i = 0; i < pharmacies.length; i++) {
    const p = pharmacies[i];
    const ownerId = i === 0 ? pharmacist.id : extraPharmacists[i - 1].id;
    const existing = await prisma.pharmacy.findFirst({ where: { name: p.name } });
    if (existing) { createdPharmacies.push(existing); }
    else { const ph = await prisma.pharmacy.create({ data: { ...p, ownerId } }); createdPharmacies.push(ph); }
  }
  console.log("  Pharmacies created:", createdPharmacies.length);

  const medications = [
    { name: "Paracétamol 500mg", activeIngredient: "Paracétamol", category: "Antalgiques", dosage: "500mg", form: "Comprimé", description: "Analgésique et antipyrétique.", prescriptionRequired: false, sideEffects: "Nausées, allergies rares", contraindications: "Insuffisance hépatique sévère" },
    { name: "Ibuprofène 400mg", activeIngredient: "Ibuprofène", category: "Antalgiques", dosage: "400mg", form: "Comprimé", description: "Anti-inflammatoire non stéroïdien.", prescriptionRequired: false, sideEffects: "Troubles digestifs", contraindications: "Ulcère gastrique" },
    { name: "Amoxicilline 500mg", activeIngredient: "Amoxicilline", category: "Antibiotiques", dosage: "500mg", form: "Gélule", description: "Antibiotique pénicilline.", prescriptionRequired: true, sideEffects: "Nausées, diarrhée", contraindications: "Allergie pénicillines" },
    { name: "Co-artem", activeIngredient: "Artéméther + Luméfantrine", category: "Antipaludéens", dosage: "20mg/120mg", form: "Comprimé", description: "Traitement paludisme.", prescriptionRequired: true, sideEffects: "Maux de tête", contraindications: "Hypersensibilité" },
    { name: "Aspirine 500mg", activeIngredient: "Acide acétylsalicylique", category: "Antalgiques", dosage: "500mg", form: "Comprimé", description: "Analgésique et anti-inflammatoire.", prescriptionRequired: false, sideEffects: "Saignements", contraindications: "Enfant < 16 ans" },
    { name: "Métronidazole 500mg", activeIngredient: "Métronidazole", category: "Antibiotiques", dosage: "500mg", form: "Comprimé", description: "Antibiotique antiparasitaire.", prescriptionRequired: true, sideEffects: "Goût métallique", contraindications: "Alcool" },
    { name: "Coton hydrophile 100g", activeIngredient: "Coton naturel", category: "Pansements", dosage: "100g", form: "Pansement", description: "Coton stérile.", prescriptionRequired: false, sideEffects: "", contraindications: "" },
    { name: "Vitamine C 1000mg", activeIngredient: "Acide ascorbique", category: "Vitamines", dosage: "1000mg", form: "Comprimé effervescent", description: "Complément alimentaire.", prescriptionRequired: false, sideEffects: "Troubles digestifs", contraindications: "Lithiase rénale" },
    { name: "Sérum physiologique 500ml", activeIngredient: "Chlorure de sodium 0.9%", category: "Pansements", dosage: "500ml", form: "Solution", description: "Solution saline.", prescriptionRequired: false, sideEffects: "", contraindications: "" },
    { name: "Cétirizine 10mg", activeIngredient: "Cétirizine", category: "Antihistaminiques", dosage: "10mg", form: "Comprimé", description: "Antihistaminique.", prescriptionRequired: false, sideEffects: "Somnolence", contraindications: "Insuffisance rénale sévère" },
    { name: "Oméprazole 20mg", activeIngredient: "Oméprazole", category: "Gastro-entérologie", dosage: "20mg", form: "Gélule", description: "IPP.", prescriptionRequired: true, sideEffects: "Maux de tête", contraindications: "Hypersensibilité" },
    { name: "Doliprane Sirop 2.4%", activeIngredient: "Paracétamol", category: "Antalgiques", dosage: "2.4%", form: "Sirop", description: "Sirop enfant.", prescriptionRequired: false, sideEffects: "Allergies rares", contraindications: "Insuffisance hépatique" },
  ];

  const createdMedications = [];
  for (const m of medications) {
    const med = await prisma.medication.findFirst({ where: { name: m.name } });
    if (med) { createdMedications.push(med); }
    else { const created = await prisma.medication.create({ data: m }); createdMedications.push(created); }
  }
  console.log("  Medications created:", createdMedications.length);

  const priceRanges = {
    "Paracétamol 500mg": [500, 1500], "Ibuprofène 400mg": [800, 2000], "Amoxicilline 500mg": [2500, 5000],
    "Co-artem": [3500, 6500], "Aspirine 500mg": [600, 1500], "Métronidazole 500mg": [1800, 3500],
    "Coton hydrophile 100g": [800, 1800], "Vitamine C 1000mg": [1200, 2800],
    "Sérum physiologique 500ml": [900, 2000], "Cétirizine 10mg": [1000, 2500],
    "Oméprazole 20mg": [2200, 4500], "Doliprane Sirop 2.4%": [1500, 3200],
  };

  let stockCount = 0;
  for (const pharmacy of createdPharmacies) {
    for (const med of createdMedications) {
      const [minP, maxP] = priceRanges[med.name] || [500, 2000];
      const price = Math.round((Math.random() * (maxP - minP) + minP) / 50) * 50;
      const stock = Math.floor(Math.random() * 80) + 5;
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + Math.floor(Math.random() * 2) + 1);
      await prisma.pharmacyMedication.upsert({
        where: { pharmacyId_medicationId: { pharmacyId: pharmacy.id, medicationId: med.id } },
        update: {},
        create: { pharmacyId: pharmacy.id, medicationId: med.id, price, stock, lowStockThreshold: 10, expiryDate },
      }).catch(() => {});
      stockCount++;
    }
  }
  console.log("  Stocks created:", stockCount);

  const allPatients = [patient];
  const pNames = ["Awa", "Mamadou", "Fatou", "Ibrahim", "Aminata", "Sékou", "Aya", "Boubacar", "Mariam", "Adama"];
  const lNames = ["Traoré", "Diallo", "Coulibaly", "Bamba", "Touré", "Diabaté", "Sangaré", "Cissé", "Konaté", "Fofana"];
  for (let i = 0; i < 10; i++) {
    const u = await prisma.user.upsert({
      where: { email: `patient${i + 1}@pharmaci.ci` },
      update: {},
      create: { email: `patient${i + 1}@pharmaci.ci`, password: patientPassword, name: `${pNames[i]} ${lNames[i]}`, role: "PATIENT", phone: `+225 07 0${i} ${10 + i} ${20 + i} ${30 + i}`, city: "Abidjan" },
    });
    allPatients.push(u);
  }

  const reviewTexts = [
    { rating: 5, comment: "Service excellent, personnel très accueillant." },
    { rating: 4, comment: "Bonne pharmacie, mais attente parfois longue." },
    { rating: 5, comment: "Pharmacie de garde très pratique." },
    { rating: 4, comment: "Pharmaciens compétents, bons conseils." },
    { rating: 3, comment: "Correct mais prix un peu élevés." },
    { rating: 5, comment: "Je recommande, surtout pour le service de livraison." },
    { rating: 4, comment: "Bon accueil, prix raisonnables." },
    { rating: 5, comment: "Pharmacie propre et bien organisée." },
  ];

  for (const pharmacy of createdPharmacies) {
    const numReviews = Math.floor(Math.random() * 4) + 3;
    const shuffled = [...allPatients].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numReviews && i < shuffled.length; i++) {
      const rv = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
      await prisma.review.create({
        data: { userId: shuffled[i].id, pharmacyId: pharmacy.id, rating: rv.rating, comment: rv.comment },
      }).catch(() => {});
    }
    const allReviews = await prisma.review.findMany({ where: { pharmacyId: pharmacy.id } });
    if (allReviews.length > 0) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      await prisma.pharmacy.update({ where: { id: pharmacy.id }, data: { rating: Math.round(avg * 10) / 10, reviewCount: allReviews.length } });
    }
  }
  console.log("  Reviews created");

  await prisma.favorite.create({ data: { userId: patient.id, pharmacyId: createdPharmacies[0].id } }).catch(() => {});

  // Sample orders
  const orderData = [
    { code: "PHARMACI-AB7K2P", status: "READY", pharmacyIdx: 0, medIdxs: [0, 7], qtys: [2, 1] },
    { code: "PHARMACI-XY9M3Q", status: "CONFIRMED", pharmacyIdx: 2, medIdxs: [2], qtys: [1] },
    { code: "PHARMACI-LM4N8R", status: "PICKED_UP", pharmacyIdx: 0, medIdxs: [10, 9], qtys: [1, 2] },
  ];

  for (const o of orderData) {
    let total = 0;
    const items = [];
    for (let j = 0; j < o.medIdxs.length; j++) {
      const pm = await prisma.pharmacyMedication.findUnique({
        where: { pharmacyId_medicationId: { pharmacyId: createdPharmacies[o.pharmacyIdx].id, medicationId: createdMedications[o.medIdxs[j]].id } },
      });
      const unitPrice = pm?.price || 1000;
      total += unitPrice * o.qtys[j];
      items.push({ medicationId: createdMedications[o.medIdxs[j]].id, quantity: o.qtys[j], unitPrice, totalPrice: unitPrice * o.qtys[j] });
    }
    await prisma.order.create({
      data: { code: o.code, userId: patient.id, pharmacyId: createdPharmacies[o.pharmacyIdx].id, status: o.status, totalAmount: total, items: { create: items } },
    }).catch(() => {});
  }
  console.log("  Orders created");

  console.log("Seed completed!");
  console.log("  Patient:    patient@pharmaci.ci / patient123");
  console.log("  Pharmacist: pharma@pharmaci.ci / pharma123");
  console.log("  Admin:      admin@pharmaci.ci / admin123");
}

main().catch((e) => { console.error("Seed failed:", e); process.exit(1); }).finally(() => prisma.$disconnect());
