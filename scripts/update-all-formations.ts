import { SupabaseService } from '../src/lib/supabase';

// Category mapping based on course titles
const categoryMapping: { [key: string]: string[] } = {
  // Finance
  'Finance pour non financiers': ['gestion-des-entreprises'],
  "L'Essentiel de La Fiscalité": ['gestion-des-entreprises'],
  'L\'Essentiel de La Fiscalité': ['gestion-des-entreprises'],
  "Comment recouvrer ses créances": ['gestion-des-entreprises'],
  
  // Management & Project
  'Les fondamentaux du management de projet': ['gestion-des-entreprises', 'outils-de-gestion'],
  'Management d\'une Équipe de Vente & Fixation des Objectifs': ['marketing-et-commercial', 'gestion-des-entreprises'],
  'Leadership & Développement de compétences': ['rh-et-org', 'gestion-des-entreprises'],
  'GPS Managérial : Créez votre Tableau de Bord': ['outils-de-gestion', 'gestion-des-entreprises'],
  'COMMENT PILOTER SA FORCE DE VENTE': ['marketing-et-commercial', 'gestion-des-entreprises'],
  'Clés du Management d\'un distributeur': ['marketing-et-commercial', 'gestion-des-entreprises'],
  'Réussir le Management RH': ['rh-et-org'],
  'Formation des Gérants': ['gestion-des-entreprises', 'rh-et-org'],
  
  // Marketing & Commercial
  'les Pratiques du Merchandising': ['marketing-et-commercial'],
  'Stratégies De Distribution En Algérie': ['marketing-et-commercial', 'supply-chain'],
  "L'essentiel du marketing": ['marketing-et-commercial'],
  'L\'essentiel du marketing': ['marketing-et-commercial'],
  'META ADS': ['marketing-et-commercial'],
  'LES TECHNIQUES DE VENTE': ['marketing-et-commercial'],
  'Road to Market': ['marketing-et-commercial'],
  'Réussir votre Packaging': ['marketing-et-commercial'],
  'Techniques de Prospection Commerciale': ['marketing-et-commercial'],
  'Clés du Management d\'un distributeur': ['marketing-et-commercial', 'gestion-des-entreprises'],
  'Boostez Votre Productivité: Stratégies Efficaces de Fixation d\'Objectifs': ['gestion-des-entreprises', 'outils-de-gestion'],
  
  // Supply Chain
  'Module 01: Cycle de formation Supply chain': ['supply-chain'],
  'Gestion des Achats et Approvisionnements': ['supply-chain', 'gestion-des-entreprises'],
  'GESTION DES STOCKS ET ENTREPOSAGE': ['supply-chain'],
  'Planification de la Production': ['supply-chain', 'gestion-des-entreprises'],
  'Techniques d\'inventaires physiques de fin d\'année': ['supply-chain', 'gestion-des-entreprises'],
  'Cycle de formations en Production Industrielle': ['supply-chain'],
  
  // Import/Export
  "Pratiquer les opérations d'import de A à Z": ['supply-chain', 'reglementaire-et-juridique'],
  "Pratiquer les opération d'export du A à Z": ['supply-chain', 'reglementaire-et-juridique'],
  
  // Legal & Regulatory
  'Protection des Données à Caractère Personnel (loi 07-18)': ['reglementaire-et-juridique'],
  'Le Droit de Travail pour Managers': ['reglementaire-et-juridique', 'rh-et-org'],
  'Réalisation de contrats d\'investissement industriel': ['reglementaire-et-juridique'],
  'Procédures de Passation des Marchés Publics': ['reglementaire-et-juridique'],
  
  // Tools & Management
  'Excel pour Entreprise - Niveau 01': ['outils-de-gestion'],
  'Management par processus selon la Norme ISO 9001': ['outils-de-gestion', 'gestion-des-entreprises'],
};

// Image mapping for courses without images
const imageMapping: { [key: string]: string } = {
  "L'essentiel du marketing": 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
  'L\'essentiel du marketing': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
  'Boostez Votre Productivité: Stratégies Efficaces de Fixation d\'Objectifs': 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
  'COMMENT PILOTER SA FORCE DE VENTE': 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
  'Réalisation de contrats d\'investissement industriel': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
  'Techniques de Prospection Commerciale': 'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
  'GESTION DES STOCKS ET ENTREPOSAGE': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
  'Management par processus selon la Norme ISO 9001': 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
  'Excel pour Entreprise - Niveau 01': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
  'GPS Managérial : Créez votre Tableau de Bord': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
  'Planification de la Production': 'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
  'Réussir le Management RH': 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
  'Cycle de formations en Production Industrielle': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
};

// Get category IDs from slugs
async function getCategoryIds(slugs: string[]) {
  const categories = await SupabaseService.getCategories();
  const categoryMap: { [slug: string]: string } = {};
  categories.forEach(cat => {
    categoryMap[cat.slug] = cat.id;
  });
  return slugs.map(slug => categoryMap[slug]).filter(Boolean);
}

// Calculate duration from price
function calculateDuration(priceTtc: number): string {
  if (priceTtc === 0) return ''; // Special courses without fixed price
  if (priceTtc >= 39240) return '3 jours';
  if (priceTtc >= 26160) return '2 jours';
  return '1 jour';
}

async function updateAllFormations() {
  try {
    console.log('Fetching all formations...');
    const formations = await SupabaseService.getAllFormationsForAdmin();
    console.log(`Found ${formations.length} formations to update`);

    for (const formation of formations) {
      const updates: any = {};
      let needsUpdate = false;

      // 1. Calculate and update duration from price
      const priceTtc = parseFloat(formation.price_ttc || '0');
      const calculatedDuration = calculateDuration(priceTtc);
      if (!formation.duration || formation.duration === '') {
        updates.duration = calculatedDuration;
        needsUpdate = true;
        console.log(`  ${formation.title}: Setting duration to "${calculatedDuration}" (price: ${priceTtc})`);
      }

      // 2. Add missing image
      if (!formation.image_url || formation.image_url === '') {
        const imageUrl = imageMapping[formation.title] || imageMapping[formation.title_fr];
        if (imageUrl) {
          updates.image_url = imageUrl;
          needsUpdate = true;
          console.log(`  ${formation.title}: Adding image`);
        } else {
          console.log(`  ${formation.title}: No image found in mapping`);
        }
      }

      // 3. Update categories
      const titleKey = formation.title || formation.title_fr;
      const categorySlugs = categoryMapping[titleKey];
      if (categorySlugs && categorySlugs.length > 0) {
        const categoryIds = await getCategoryIds(categorySlugs);
        if (categoryIds.length > 0) {
          try {
            await SupabaseService.setFormationCategories(formation.id, categoryIds);
            console.log(`  ${formation.title}: Updated categories to [${categorySlugs.join(', ')}]`);
          } catch (error: any) {
            console.error(`  ${formation.title}: Error updating categories:`, error.message);
          }
        }
      } else {
        console.log(`  ${formation.title}: No category mapping found`);
      }

      // 4. Apply other updates
      if (needsUpdate) {
        try {
          await SupabaseService.updateFormation(formation.id, updates);
          console.log(`  ${formation.title}: Updated successfully`);
        } catch (error: any) {
          console.error(`  ${formation.title}: Error updating:`, error.message);
        }
      } else {
        console.log(`  ${formation.title}: No updates needed`);
      }
    }

    console.log('\n✅ All formations updated!');
  } catch (error: any) {
    console.error('Error updating formations:', error);
  }
}

updateAllFormations();

