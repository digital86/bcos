import { SupabaseService } from '../src/lib/supabase';

// Function to extract image URL from HTML content
function extractImageFromHTML(html: string): string | null {
  if (!html) return null;
  
  // Try to find img tag with src
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (imgMatch && imgMatch[1]) {
    let imgUrl = imgMatch[1];
    // Clean up URL
    imgUrl = imgUrl.replace(/&amp;/g, '&');
    // If relative URL, make it absolute
    if (imgUrl.startsWith('/')) {
      imgUrl = 'https://bcos-dz.com' + imgUrl;
    }
    return imgUrl;
  }
  
  // Try to find background-image in style
  const bgMatch = html.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
  if (bgMatch && bgMatch[1]) {
    let imgUrl = bgMatch[1];
    imgUrl = imgUrl.replace(/&amp;/g, '&');
    if (imgUrl.startsWith('/')) {
      imgUrl = 'https://bcos-dz.com' + imgUrl;
    }
    return imgUrl;
  }
  
  return null;
}

// Function to extract duration from HTML content
function extractDurationFromHTML(html: string): string | null {
  if (!html) return null;
  
  // Common patterns for duration
  const patterns = [
    /(\d+)\s*(?:jour|jours|jrs?|day|days)/i,
    /Durée[:\s]+(\d+)\s*(?:jour|jours|jrs?)/i,
    /Duration[:\s]+(\d+)\s*(?:jour|jours|jrs?|day|days)/i,
    /(\d+)\s*(?:jour|jours|jrs?)\s*(?:de\s+)?formation/i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const days = parseInt(match[1]);
      if (days === 1) return '1 jour';
      if (days === 2) return '2 jours';
      if (days === 3) return '3 jours';
      if (days > 3) return `${days} jours`;
    }
  }
  
  return null;
}

// Function to extract price from HTML content
function extractPriceFromHTML(html: string): { price_ht?: string; price_ttc?: string } | null {
  if (!html) return null;
  
  const result: { price_ht?: string; price_ttc?: string } = {};
  
  // Try to find Prix HT
  const prixHTMatch = html.match(/Prix\s+HT[:\s]+(\d+(?:\s+\d+)*(?:\.\d+)?)\s*(?:DA|DZD|€|EUR)?/i);
  if (prixHTMatch && prixHTMatch[1]) {
    result.price_ht = prixHTMatch[1].replace(/\s+/g, '');
  }
  
  // Try to find Prix TTC
  const prixTTCMatch = html.match(/Prix\s+TTC[:\s]+(\d+(?:\s+\d+)*(?:\.\d+)?)\s*(?:DA|DZD|€|EUR)?/i);
  if (prixTTCMatch && prixTTCMatch[1]) {
    result.price_ttc = prixTTCMatch[1].replace(/\s+/g, '');
  }
  
  return Object.keys(result).length > 0 ? result : null;
}

// Function to analyze HTML structure and extract all relevant data
function analyzeHTMLContent(html: string, title: string): {
  image_url?: string;
  duration?: string;
  price_ht?: string;
  price_ttc?: string;
} {
  const result: any = {};
  
  if (!html) return result;
  
  // Extract image
  const image = extractImageFromHTML(html);
  if (image) {
    result.image_url = image;
  }
  
  // Extract duration
  const duration = extractDurationFromHTML(html);
  if (duration) {
    result.duration = duration;
  }
  
  // Extract price
  const price = extractPriceFromHTML(html);
  if (price) {
    if (price.price_ht) result.price_ht = price.price_ht;
    if (price.price_ttc) result.price_ttc = price.price_ttc;
  }
  
  return result;
}

async function extractAndUpdateAllFormations() {
  try {
    console.log('Fetching all formations with HTML content...');
    const formations = await SupabaseService.getAllFormationsForAdmin();
    console.log(`Found ${formations.length} formations to analyze\n`);

    let updatedCount = 0;
    let imageUpdatedCount = 0;
    let durationUpdatedCount = 0;

    for (const formation of formations) {
      const updates: any = {};
      let needsUpdate = false;

      // Get HTML content (try content_fr first, then content)
      const htmlContent = formation.content_fr || formation.content || '';
      
      if (!htmlContent) {
        console.log(`⚠️  ${formation.title}: No HTML content found`);
        continue;
      }

      // Analyze HTML content
      const extractedData = analyzeHTMLContent(htmlContent, formation.title || formation.title_fr);

      // Update image if found in HTML and different from current
      if (extractedData.image_url) {
        if (!formation.image_url || formation.image_url !== extractedData.image_url) {
          updates.image_url = extractedData.image_url;
          needsUpdate = true;
          imageUpdatedCount++;
          console.log(`  📷 ${formation.title}: Found image in HTML: ${extractedData.image_url}`);
        }
      } else if (!formation.image_url) {
        console.log(`  ⚠️  ${formation.title}: No image found in HTML`);
      }

      // Update duration if found in HTML and different from current
      if (extractedData.duration) {
        if (!formation.duration || formation.duration !== extractedData.duration) {
          updates.duration = extractedData.duration;
          needsUpdate = true;
          durationUpdatedCount++;
          console.log(`  ⏱️  ${formation.title}: Found duration in HTML: ${extractedData.duration}`);
        }
      } else if (!formation.duration) {
        // Try to calculate from price if duration not found in HTML
        const priceTtc = parseFloat(formation.price_ttc || '0');
        if (priceTtc > 0) {
          let calculatedDuration = '';
          if (priceTtc >= 39240) calculatedDuration = '3 jours';
          else if (priceTtc >= 26160) calculatedDuration = '2 jours';
          else calculatedDuration = '1 jour';
          
          if (calculatedDuration) {
            updates.duration = calculatedDuration;
            needsUpdate = true;
            durationUpdatedCount++;
            console.log(`  ⏱️  ${formation.title}: Calculated duration from price: ${calculatedDuration}`);
          }
        }
      }

      // Update price if found in HTML and different from current
      if (extractedData.price_ht && formation.price_ht !== extractedData.price_ht) {
        updates.price_ht = extractedData.price_ht;
        needsUpdate = true;
        console.log(`  💰 ${formation.title}: Updated price_ht: ${extractedData.price_ht}`);
      }
      
      if (extractedData.price_ttc && formation.price_ttc !== extractedData.price_ttc) {
        updates.price_ttc = extractedData.price_ttc;
        needsUpdate = true;
        console.log(`  💰 ${formation.title}: Updated price_ttc: ${extractedData.price_ttc}`);
      }

      // Apply updates
      if (needsUpdate) {
        try {
          await SupabaseService.updateFormation(formation.id, updates);
          updatedCount++;
          console.log(`  ✅ ${formation.title}: Updated successfully\n`);
        } catch (error: any) {
          console.error(`  ❌ ${formation.title}: Error updating: ${error.message}\n`);
        }
      } else {
        console.log(`  ✓ ${formation.title}: No updates needed\n`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log(`  Total formations analyzed: ${formations.length}`);
    console.log(`  Formations updated: ${updatedCount}`);
    console.log(`  Images updated: ${imageUpdatedCount}`);
    console.log(`  Durations updated: ${durationUpdatedCount}`);
    console.log('='.repeat(60));
    console.log('\n✅ All formations analyzed and updated!');
  } catch (error: any) {
    console.error('❌ Error analyzing formations:', error);
  }
}

extractAndUpdateAllFormations();


