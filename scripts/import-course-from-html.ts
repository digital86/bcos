/**
 * Script to import course from HTML to Supabase
 * Usage: Run this script with the HTML content
 */

import { SupabaseService } from '../src/lib/supabase';

interface ParsedCourseData {
  title: string;
  title_fr: string;
  description: string;
  description_fr: string;
  content: string;
  content_fr: string;
  image_url: string;
  cover_image_url: string;
  price_ht: number;
  price_ttc: number;
  duration: string;
  reference: string;
  objectives: string[];
  objectives_fr: string[];
  program: string;
  program_fr: string;
  target_audience: string[];
  target_audience_fr: string[];
  slug: string;
  category_id?: string;
}

function parseHTML(htmlContent: string): ParsedCourseData {
  // Extract title
  const titleMatch = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extract image URL - look in Objectifs section first, then anywhere
  let imageUrl = '';
  const objectivesSectionForImage = htmlContent.match(/<h2[^>]*>Objectifs<\/h2>[\s\S]*?<\/section>/i);
  if (objectivesSectionForImage) {
    const imgMatch = objectivesSectionForImage[0].match(/<img[^>]+src="([^"]+)"[^>]*>/i);
    if (imgMatch) {
      imageUrl = imgMatch[1];
    }
  }
  // Fallback: search entire HTML
  if (!imageUrl) {
    const imageMatch = htmlContent.match(/<img[^>]+src="([^"]+)"[^>]*alt="[^"]*Formation[^"]*"/i);
    if (imageMatch) {
      imageUrl = imageMatch[1];
    } else {
      // Try any img tag
      const anyImgMatch = htmlContent.match(/<img[^>]+src="([^"]+)"[^>]*>/i);
      if (anyImgMatch) {
        imageUrl = anyImgMatch[1];
      }
    }
  }

  // Extract reference
  const referenceMatch = htmlContent.match(/Référence:.*?<span[^>]*>([^<]+)<\/span>/i);
  const reference = referenceMatch ? referenceMatch[1].trim() : '';

  // Extract duration
  const durationMatch = htmlContent.match(/Durée:.*?<span[^>]*>([^<]+)<\/span>/i);
  const duration = durationMatch ? durationMatch[1].trim() : '';

  // Extract prices - handle formats like "30 000,00 DA / HT" or "32700 DA / TTC"
  const priceHTMatch = htmlContent.match(/(\d+(?:[\s,]\d+)*(?:[,\.]\d+)?)[\s,]*DA\s*\/\s*HT/i);
  const priceHT = priceHTMatch ? parseFloat(priceHTMatch[1].replace(/\s/g, '').replace(',', '.')) : 0;

  const priceTTCMatch = htmlContent.match(/(\d+(?:[\s,]\d+)*(?:[,\.]\d+)?)[\s,]*DA\s*\/\s*TTC/i);
  const priceTTC = priceTTCMatch ? parseFloat(priceTTCMatch[1].replace(/\s/g, '').replace(',', '.')) : 0;

  // Extract objectives
  const objectives: string[] = [];
  const objectiveMatches = htmlContent.matchAll(/<li[^>]*>.*?<span[^>]*>([^<]+)<\/span><\/li>/g);
  const objectivesSection = htmlContent.match(/<h2[^>]*>Objectifs<\/h2>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i);
  if (objectivesSection) {
    const objectivesList = objectivesSection[1];
    const objectiveItems = objectivesList.matchAll(/<li[^>]*>.*?<span[^>]*>([^<]+)<\/span><\/li>/g);
    for (const match of objectiveItems) {
      objectives.push(match[1].trim());
    }
  }

  // Extract program - look for sections inside border-l-4 divs
  const programSections: string[] = [];
  // Match div with border-l-4 containing h4 and ul
  const programMatches = htmlContent.matchAll(/<div[^>]*class="[^"]*border-l-4[^"]*"[^>]*>[\s\S]*?<h4[^>]*>([^<]+)<\/h4>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>[\s\S]*?<\/div>/g);
  for (const match of programMatches) {
    const sectionTitle = match[1].trim();
    const sectionItems = match[2].matchAll(/<li[^>]*>([^<]+)<\/li>/g);
    const items: string[] = [];
    for (const item of sectionItems) {
      items.push(item[1].trim());
    }
    if (items.length > 0) {
      programSections.push(`<h3>${sectionTitle}</h3><ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`);
    }
  }
  // Fallback: if no border-l-4 divs found, try the old pattern
  if (programSections.length === 0) {
    const fallbackMatches = htmlContent.matchAll(/<h4[^>]*>([IVX]+\.\s*[^<]+)<\/h4>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/g);
    for (const match of fallbackMatches) {
      const sectionTitle = match[1].trim();
      const sectionItems = match[2].matchAll(/<li[^>]*>([^<]+)<\/li>/g);
      const items: string[] = [];
      for (const item of sectionItems) {
        items.push(item[1].trim());
      }
      if (items.length > 0) {
        programSections.push(`<h3>${sectionTitle}</h3><ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`);
      }
    }
  }
  const program = programSections.join('');

  // Extract target audience
  const targetAudience: string[] = [];
  const audienceSection = htmlContent.match(/<h2[^>]*>Public Concerné<\/h2>[\s\S]*?<div[^>]*class="grid[^"]*">([\s\S]*?)<\/div>/i);
  if (audienceSection) {
    const audienceItems = audienceSection[1].matchAll(/<h3[^>]*>([^<]+)<\/h3>/g);
    for (const match of audienceItems) {
      targetAudience.push(match[1].trim().replace(/\.$/, ''));
    }
  }

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Create description from first objective or title
  const description = objectives.length > 0 ? objectives[0] : title;

  return {
    title,
    title_fr: title,
    description,
    description_fr: description,
    content: htmlContent,
    content_fr: htmlContent,
    image_url: imageUrl,
    cover_image_url: imageUrl,
    price_ht: priceHT,
    price_ttc: priceTTC,
    duration,
    reference,
    objectives,
    objectives_fr: objectives,
    program,
    program_fr: program,
    target_audience: targetAudience,
    target_audience_fr: targetAudience,
    slug,
  };
}

async function importCourse(htmlContent: string, categorySlug?: string) {
  try {
    console.log('Parsing HTML content...');
    const courseData = parseHTML(htmlContent);

    console.log('Parsed course data:', {
      title: courseData.title,
      slug: courseData.slug,
      price_ht: courseData.price_ht,
      price_ttc: courseData.price_ttc,
      duration: courseData.duration,
      reference: courseData.reference,
    });

    // Get category if provided
    let categoryId: string | undefined;
    if (categorySlug) {
      const categories = await SupabaseService.getCategories();
      const category = categories.find(cat => cat.slug === categorySlug);
      if (category) {
        categoryId = category.id;
        console.log('Found category:', category.name);
      } else {
        console.warn(`Category with slug "${categorySlug}" not found`);
      }
    }

    // Prepare formation data
    const formationData: any = {
      title: courseData.title,
      title_fr: courseData.title_fr,
      slug: courseData.slug,
      description: courseData.description,
      description_fr: courseData.description_fr,
      content: courseData.content,
      content_fr: courseData.content_fr,
      image_url: courseData.image_url,
      cover_image_url: courseData.cover_image_url,
      price: courseData.price_ttc || courseData.price_ht || 0,
      price_ht: courseData.price_ht,
      price_ttc: courseData.price_ttc,
      currency: 'DZD',
      duration: courseData.duration,
      reference: courseData.reference,
      level: 'Tous niveaux',
      max_participants: 20,
      current_participants: 0,
      rating: 0,
      is_active: true,
      is_popular: false,
      is_online: false,
      is_published: true,
      location: 'À définir',
      objectives: courseData.objectives,
      objectives_fr: courseData.objectives_fr,
      program_fr: courseData.program_fr,
      target_audience_fr: courseData.target_audience_fr,
      category_id: categoryId,
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

// Export for use
export { importCourse, parseHTML, ParsedCourseData };

// If running directly
if (require.main === module) {
  const htmlContent = process.argv[2];
  const categorySlug = process.argv[3];

  if (!htmlContent) {
    console.error('Usage: ts-node import-course-from-html.ts <html-content-file> [category-slug]');
    process.exit(1);
  }

  importCourse(htmlContent, categorySlug)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

