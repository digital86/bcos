/**
 * Script to delete all formations from Supabase
 * WARNING: This will delete ALL formations!
 * 
 * Usage: npx tsx scripts/delete-all-formations.ts
 */

import { SupabaseService } from '../src/lib/supabase';

async function deleteAllFormations() {
  try {
    console.log('🔍 Loading all formations...');
    
    // Get all formations
    const formations = await SupabaseService.getAllFormationsForAdmin();
    
    if (!formations || formations.length === 0) {
      console.log('✅ No formations found. Database is already empty.');
      return;
    }

    console.log(`📊 Found ${formations.length} formation(s):`);
    formations.forEach((formation: any, index: number) => {
      console.log(`  ${index + 1}. ${formation.title} (${formation.slug}) - ID: ${formation.id}`);
    });

    console.log('\n⚠️  WARNING: This will delete ALL formations!');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');
    
    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n🗑️  Deleting formations...');
    
    let deletedCount = 0;
    let errorCount = 0;

    for (const formation of formations) {
      try {
        await SupabaseService.deleteFormation(formation.id);
        console.log(`  ✅ Deleted: ${formation.title}`);
        deletedCount++;
      } catch (error: any) {
        console.error(`  ❌ Error deleting ${formation.title}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Successfully deleted: ${deletedCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  📦 Total: ${formations.length}`);

    if (deletedCount === formations.length) {
      console.log('\n✨ All formations deleted successfully!');
    } else {
      console.log('\n⚠️  Some formations could not be deleted. Check errors above.');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  deleteAllFormations()
    .then(() => {
      console.log('\n✅ Process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Process failed:', error);
      process.exit(1);
    });
}

export { deleteAllFormations };


