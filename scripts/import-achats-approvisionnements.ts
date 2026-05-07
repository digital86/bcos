/**
 * Direct import script for "Gestion des Achats et Approvisionnements"
 * Run: npx tsx scripts/import-achats-approvisionnements.ts
 */

import { SupabaseService } from '../src/lib/supabase';

async function importCourse() {
  try {
    console.log('🚀 Starting import...');

    const title = 'Gestion des Achats et Approvisionnements';
    const slug = 'gestion-des-achats-et-approvisionnements';
    const imageUrl = 'https://bcos-dz.com/wp-content/uploads/2025/10/vehicles-laptop-supply-chain-representation.jpg';
    const reference = 'ACHATS-APPROS-FR-2025';
    const duration = '03 jrs';
    const priceHT = 30000;
    const priceTTC = 32700;

    const objectives = [
      "Optimiser les dépenses liées aux achats et améliorer le niveau de satisfaction des clients des petites et moyennes entreprises.",
      "Améliorer la gestion des approvisionnements (commandes et des contrats).",
      "Déterminer avec précision le niveau de stocks dont on a besoin."
    ];

    const program = `
      <h3>I. Déterminer les missions des Achats et Appros en fonction des besoins des clients</h3>
      <ul>
        <li>L'importance de la fonction Achats-Appros dans la Supply Chain.</li>
        <li>Le rôle des acheteurs et des approvisionneurs dans le processus d'achat.</li>
      </ul>
      <h3>II. Présenter les différents éléments d'une politique d'achats</h3>
      <ul>
        <li>Le processus Achats. Les interlocuteurs.</li>
        <li>Les règles de procédure.</li>
      </ul>
      <h3>III. Acquérir les compétences nécessaires pour mener des négociations</h3>
      <ul>
        <li>Un guide complet pour comprendre les familles d'achats.</li>
        <li>Les outils d'évaluation d'un prix.</li>
        <li>La création du cahier des charges fonctionnel.</li>
        <li>Les demandes d'informations sur les fournisseurs.</li>
        <li>Les grilles de comparaison des offres.</li>
      </ul>
      <h3>IV. Sélectionner les méthodes d'approvisionnement et de stockage les plus appropriées</h3>
      <ul>
        <li>Le contrat cadre et les commandes ouvertes.</li>
        <li>La détermination des besoins et le point de commande.</li>
        <li>La prévision des aléas clients et des retards fournisseurs.</li>
        <li>La détermination du stock de sécurité.</li>
      </ul>
      <h3>V. Assurer la gestion de la relation avec les fournisseurs</h3>
      <ul>
        <li>Le document de spécifications logistiques.</li>
        <li>Évaluer les prestataires en utilisant des indicateurs simples.</li>
      </ul>
    `;

    const targetAudience = [
      'Acheteur',
      'Approvisionneur',
      'Logisticien',
      'Responsable achats',
      'Responsable Approvisionnements',
      'Chargé des moyens généraux',
      'Responsable des Moyens Généraux',
      'Cadres d\'entreprise'
    ];

    const description = objectives[0] || title;

    // Get categories to find Supply Chain category
    console.log('📂 Loading categories...');
    const categories = await SupabaseService.getCategories();
    const supplyChainCategory = categories.find(cat => 
      cat.slug === 'supply-chain' || 
      cat.name.toLowerCase().includes('supply') ||
      cat.name.toLowerCase().includes('logistique') ||
      cat.name_fr?.toLowerCase().includes('supply') ||
      cat.name_fr?.toLowerCase().includes('logistique')
    );

    if (supplyChainCategory) {
      console.log('✅ Found category:', supplyChainCategory.name_fr || supplyChainCategory.name);
    } else {
      console.log('⚠️  No matching category found, will create without category');
    }

    // HTML content (full)
    const htmlContent = `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Formation : ${title}</title>
</head>
<body>
  <div id="webcrumbs">
    <div class="w-full max-w-5xl bg-white font-sans mx-auto shadow-sm">
      <header class="py-10 sm:py-12 px-6 sm:px-12 text-center border-b border-gray-100">
        <div class="text-2xl font-bold text-gray-500 mb-2">Formation</div>
        <h1 class="text-4xl md:text-5xl font-bold text-green-600 mb-2">${title}</h1>
      </header>
      <section class="px-6 sm:px-12 py-12 sm:py-16">
        <h2 class="text-3xl font-semibold text-gray-800 mb-10">Objectifs</h2>
        <div class="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
          <div class="w-full md:w-2/5">
            <img src="${imageUrl}" alt="${title}" class="w-full h-auto rounded-xl shadow-md" />
          </div>
          <div class="w-full md:w-3/5">
            <ul class="space-y-4">
              ${objectives.map(obj => `<li>${obj}</li>`).join('')}
            </ul>
          </div>
        </div>
      </section>
      <section class="px-6 sm:px-12 py-12 sm:py-16 bg-blue-50">
        <h2 class="text-3xl font-semibold text-gray-800 mb-10">Programme de la Formation</h2>
        <div class="flex flex-col md:flex-row gap-12">
          <div class="w-full md:w-1/3">
            <div class="bg-white p-8 rounded-lg shadow-md">
              <h3 class="text-xl font-semibold text-gray-800 mb-5">Détails de la Formation</h3>
              <ul class="space-y-5">
                <li><strong>Référence:</strong> ${reference}</li>
                <li><strong>Durée:</strong> ${duration}</li>
                <li><strong>Tarif HT:</strong> ${priceHT.toLocaleString('fr-FR')} DA</li>
                <li><strong>Tarif TTC:</strong> ${priceTTC.toLocaleString('fr-FR')} DA</li>
              </ul>
            </div>
          </div>
          <div class="w-full md:w-2/3">
            ${program}
          </div>
        </div>
      </section>
      <section class="px-6 sm:px-12 py-12 sm:py-16 bg-green-50">
        <h2 class="text-3xl font-semibold text-gray-800 mb-10">Public Concerné</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          ${targetAudience.map(aud => `<div class="bg-white p-6 rounded-lg shadow-md"><h3>${aud}</h3></div>`).join('')}
        </div>
      </section>
    </div>
  </div>
</body>
</html>`;

    // Create formation
    const formationData: any = {
      title,
      title_fr: title,
      slug,
      description,
      description_fr: description,
      content: htmlContent,
      content_fr: htmlContent,
      image_url: imageUrl,
      cover_image_url: imageUrl,
      price: priceTTC,
      price_ht: priceHT,
      price_ttc: priceTTC,
      currency: 'DZD',
      duration,
      reference,
      level: 'Tous niveaux',
      max_participants: 20,
      current_participants: 0,
      rating: 0,
      is_active: true,
      is_popular: false,
      is_online: false,
      is_published: true,
      location: 'À définir',
      objectives,
      objectives_fr: objectives,
      program_fr: program,
      target_audience_fr: targetAudience,
      category_id: supplyChainCategory?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('💾 Creating formation in Supabase...');
    const result = await SupabaseService.createFormation(formationData);

    console.log('✅ Course imported successfully!');
    console.log('📋 Details:');
    console.log('  - ID:', result.id);
    console.log('  - Slug:', result.slug);
    console.log('  - Title:', result.title);
    console.log('  - Price TTC:', result.price_ttc, 'DZD');
    console.log('  - Duration:', result.duration);
    console.log('  - Reference:', result.reference);
    console.log('🌐 View at: /fr/formation/' + result.slug);

    return result;
  } catch (error: any) {
    console.error('❌ Error importing course:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  importCourse()
    .then(() => {
      console.log('✨ Import completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Import failed:', error);
      process.exit(1);
    });
}

export { importCourse };


