/**
 * Script to run migration 007: Create scheduled_formations table
 * 
 * Usage:
 *   npx tsx scripts/run-migration-007.ts
 * 
 * Or with Node:
 *   npm install -g tsx
 *   tsx scripts/run-migration-007.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { supabaseConfig } from '../supabase-config';

// Note: This requires service_role key for executing SQL
// For security, use Supabase Dashboard SQL Editor instead
async function runMigration() {
  console.log('⚠️  This script requires service_role key.');
  console.log('📝 Please run the migration manually in Supabase Dashboard:');
  console.log('   1. Go to: https://app.supabase.com');
  console.log('   2. Select your project');
  console.log('   3. Open SQL Editor');
  console.log('   4. Copy content from: migrations/007_create_scheduled_formations.sql');
  console.log('   5. Paste and Run');
  console.log('');
  console.log('📁 Migration file location:');
  console.log('   migrations/007_create_scheduled_formations.sql');
  
  // Alternative: If you have service_role key, uncomment below:
  /*
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
    process.exit(1);
  }

  const supabase = createClient(supabaseConfig.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const migrationSQL = readFileSync(
      join(__dirname, '../migrations/007_create_scheduled_formations.sql'),
      'utf-8'
    );

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📦 Executing ${statements.length} SQL statements...`);

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error('❌ Error:', error);
        }
      }
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  */
}

runMigration();


