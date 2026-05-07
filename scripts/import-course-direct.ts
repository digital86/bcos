/**
 * Direct import script - Paste HTML here and run
 */

import { SupabaseService } from '../src/lib/supabase';

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Formation : Gestion des Achats et Approvisionnements</title>
  <style>
    @import url(https://fonts.googleapis.com/css2?family=Lato&display=swap);
    @import url(https://fonts.googleapis.com/css2?family=Open+Sans&display=swap);
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
    @import url(https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200);
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Open Sans', 'Cairo', sans-serif;
      background-color: #f8fafc;
    }
    .program-sublist { list-style-type: disc; margin-left: 1.5rem; }
    .program-sublist-nested { list-style-type: circle; margin-left: 1.5rem; }
  </style>
</head>
<body data-rsssl=1 data-rsssl="1">
  <div id="webcrumbs">
    <div class="w-full max-w-5xl bg-white font-sans mx-auto shadow-sm">
      <header class="py-10 sm:py-12 px-6 sm:px-12 text-center border-b border-gray-100">
        <div class="text-2xl font-bold text-gray-500 mb-2">Formation</div>
        <h1 class="text-4xl md:text-5xl font-bold text-green-600 mb-2 transition-all duration-300 hover:text-green-700">
          Gestion des Achats et Approvisionnements
        </h1>
      </header>
      <section class="px-6 sm:px-12 py-12 sm:py-16">
        <h2 class="text-3xl font-semibold text-gray-800 mb-10 flex items-center gap-3 justify-start">
          <span class="material-symbols-outlined text-blue-600">task_alt</span>
          <span>Objectifs</span>
        </h2>
        <div class="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
          <div class="w-full md:w-2/5 md:order-1">
            <img src="https://bcos-dz.com/wp-content/uploads/2025/10/vehicles-laptop-supply-chain-representation.jpg" alt="Formation Achats et Approvisionnements" class="w-full h-auto rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300" />
          </div>
          <div class="w-full md:w-3/5 md:order-2">
            <ul class="space-y-4">
              <li class="flex items-start"><span class="material-symbols-outlined text-green-500 mr-3 mt-1">check_circle</span><span class="text-gray-700">Optimiser les dépenses liées aux achats et améliorer le niveau de satisfaction des clients des petites et moyennes entreprises.</span></li>
              <li class="flex items-start"><span class="material-symbols-outlined text-green-500 mr-3 mt-1">check_circle</span><span class="text-gray-700">Améliorer la gestion des approvisionnements (commandes et des contrats).</span></li>
              <li class="flex items-start"><span class="material-symbols-outlined text-green-500 mr-3 mt-1">check_circle</span><span class="text-gray-700">Déterminer avec précision le niveau de stocks dont on a besoin.</span></li>
            </ul>
          </div>
        </div>
      </section>
      <section class="px-6 sm:px-12 py-12 sm:py-16 bg-blue-50">
        <h2 class="text-3xl font-semibold text-gray-800 mb-10 flex items-center gap-3 justify-start">
          <span class="material-symbols-outlined text-blue-600">list_alt</span>
          <span>Programme de la Formation</span>
        </h2>
        <div class="flex flex-col md:flex-row gap-12">
          <div class="w-full md:w-1/3 order-2 md:order-1 mb-6 md:mb-0">
            <div class="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
              <h3 class="text-xl font-semibold text-gray-800 mb-5">Détails de la Formation</h3>
              <ul class="space-y-5">
                <li class="flex items-center"><span class="material-symbols-outlined text-blue-600 mr-4">tag</span><div><span class="text-gray-500 block text-sm">Référence:</span><span class="font-medium text-gray-800">ACHATS-APPROS-FR-2025</span></div></li>
                <li class="flex items-center"><span class="material-symbols-outlined text-blue-600 mr-4">schedule</span><div><span class="text-gray-500 block text-sm">Durée:</span><span class="font-medium text-gray-800">03 jrs</span></div></li>
                <li class="flex items-center"><span class="material-symbols-outlined text-blue-600 mr-4">calendar_month</span><div><span class="text-gray-500 block text-sm">Horaires:</span><span class="font-medium text-gray-800">08:30h - 16:00h</span></div></li>
                <li class="flex items-center"><span class="material-symbols-outlined text-blue-600 mr-4">payments</span><div><span class="text-gray-500 block text-sm">Tarif:</span><span class="font-medium text-gray-800 block" dir="ltr">30 000,00 DA / HT</span><span class="font-medium text-gray-800 block mt-1" dir="ltr">32 700,00 DA / TTC</span></div></li>
              </ul>
              <a href="#" class="mt-8 w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center active:scale-[0.98] font-semibold">
                <span class="material-symbols-outlined mr-3">how_to_reg</span>
                <span>S'inscrire maintenant</span>
              </a>
            </div>
          </div>
          <div class="w-full md:w-2/3 order-1 md:order-2">
            <div class="space-y-10">
              <div class="border-l-4 border-blue-500 pl-6"><h4 class="text-2xl font-bold text-green-700 mb-4">I. Déterminer les missions des Achats et Appros en fonction des besoins des clients</h4><ul class="space-y-1 text-gray-700 leading-relaxed program-sublist"><li>L'importance de la fonction Achats-Appros dans la Supply Chain.</li><li>Le rôle des acheteurs et des approvisionneurs dans le processus d'achat.</li></ul></div>
              <div class="border-l-4 border-blue-500 pl-6"><h4 class="text-2xl font-bold text-green-700 mb-4">II. Présenter les différents éléments d'une politique d'achats</h4><ul class="space-y-1 text-gray-700 leading-relaxed program-sublist"><li>Le processus Achats. Les interlocuteurs.</li><li>Les règles de procédure.</li></ul></div>
              <div class="border-l-4 border-blue-500 pl-6"><h4 class="text-2xl font-bold text-green-700 mb-4">III. Acquérir les compétences nécessaires pour mener des négociations</h4><ul class="space-y-1 text-gray-700 leading-relaxed program-sublist"><li>Un guide complet pour comprendre les familles d'achats.</li><li>Les outils d'évaluation d'un prix.</li><li>La création du cahier des charges fonctionnel.</li><li>Les demandes d'informations sur les fournisseurs.</li><li>Les grilles de comparaison des offres.</li></ul></div>
              <div class="border-l-4 border-blue-500 pl-6"><h4 class="text-2xl font-bold text-green-700 mb-4">IV. Sélectionner les méthodes d'approvisionnement et de stockage les plus appropriées</h4><ul class="space-y-1 text-gray-700 leading-relaxed program-sublist"><li>Le contrat cadre et les commandes ouvertes.</li><li>La détermination des besoins et le point de commande.</li><li>La prévision des aléas clients et des retards fournisseurs.</li><li>La détermination du stock de sécurité.</li></ul></div>
              <div class="border-l-4 border-blue-500 pl-6"><h4 class="text-2xl font-bold text-green-700 mb-4">V. Assurer la gestion de la relation avec les fournisseurs</h4><ul class="space-y-1 text-gray-700 leading-relaxed program-sublist"><li>Le document de spécifications logistiques.</li><li>Évaluer les prestataires en utilisant des indicateurs simples.</li></ul></div>
            </div>
          </div>
        </div>
      </section>
      <section class="px-6 sm:px-12 py-12 sm:py-16 bg-green-50">
        <h2 class="text-3xl font-semibold text-gray-800 mb-10 flex items-center gap-3 justify-start">
          <span class="material-symbols-outlined text-blue-600">groups</span>
          <span>Public Concerné</span>
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex items-start cursor-pointer active:scale-[0.98]"><span class="material-symbols-outlined text-blue-500 mr-3 text-2xl pt-1">arrow_forward</span><div><h3 class="font-semibold text-lg text-gray-800 mb-1">Acheteur.</h3></div></div>
          <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex items-start cursor-pointer active:scale-[0.98]"><span class="material-symbols-outlined text-blue-500 mr-3 text-2xl pt-1">arrow_forward</span><div><h3 class="font-semibold text-lg text-gray-800 mb-1">Approvisionneur.</h3></div></div>
          <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex items-start cursor-pointer active:scale-[0.98]"><span class="material-symbols-outlined text-blue-500 mr-3 text-2xl pt-1">arrow_forward</span><div><h3 class="font-semibold text-lg text-gray-800 mb-1">Logisticien.</h3></div></div>
          <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex items-start cursor-pointer active:scale-[0.98]"><span class="material-symbols-outlined text-blue-500 mr-3 text-2xl pt-1">arrow_forward</span><div><h3 class="font-semibold text-lg text-gray-800 mb-1">Responsable achats.</h3></div></div>
          <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex items-start cursor-pointer active:scale-[0.98]"><span class="material-symbols-outlined text-blue-500 mr-3 text-2xl pt-1">arrow_forward</span><div><h3 class="font-semibold text-lg text-gray-800 mb-1">Responsable Approvisionnements.</h3></div></div>
          <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex items-start cursor-pointer active:scale-[0.98]"><span class="material-symbols-outlined text-blue-500 mr-3 text-2xl pt-1">arrow_forward</span><div><h3 class="font-semibold text-lg text-gray-800 mb-1">Chargé des moyens généraux.</h3></div></div>
          <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex items-start cursor-pointer active:scale-[0.98]"><span class="material-symbols-outlined text-blue-500 mr-3 text-2xl pt-1">arrow_forward</span><div><h3 class="font-semibold text-lg text-gray-800 mb-1">Responsable des Moyens Généraux.</h3></div></div>
          <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex items-start cursor-pointer active:scale-[0.98]"><span class="material-symbols-outlined text-blue-500 mr-3 text-2xl pt-1">arrow_forward</span><div><h3 class="font-semibold text-lg text-lg text-gray-800 mb-1">Cadres d'entreprise.</h3></div></div>
        </div>
      </section>
    </div>
  </div>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = { content: ["./*.php", "./**/*.php", "./*.html"], theme: { extend: { fontFamily: {} } }, plugins: [], important: "#webcrumbs" };
  </script>
</body>
</html>`;

async function importCourse() {
  try {
    // Parse HTML
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
    const categories = await SupabaseService.getCategories();
    const supplyChainCategory = categories.find(cat => 
      cat.slug === 'supply-chain' || 
      cat.name.toLowerCase().includes('supply') ||
      cat.name.toLowerCase().includes('logistique')
    );

    // Create formation
    const formationData: any = {
      title,
      title_fr: title,
      slug,
      description,
      description_fr: description,
      content: HTML_CONTENT,
      content_fr: HTML_CONTENT,
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

    console.log('Creating formation in Supabase...');
    const result = await SupabaseService.createFormation(formationData);

    console.log('✅ Course imported successfully!');
    console.log('Formation ID:', result.id);
    console.log('Slug:', result.slug);
    console.log('View at:', `/fr/formation/${result.slug}`);

    return result;
  } catch (error: any) {
    console.error('❌ Error importing course:', error);
    throw error;
  }
}

// Run if executed directly
if (typeof window === 'undefined') {
  importCourse()
    .then(() => {
      console.log('Import completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

export { importCourse };


