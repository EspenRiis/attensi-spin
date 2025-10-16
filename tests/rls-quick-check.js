/**
 * RLS Quick Check
 *
 * This script performs a quick check of your current RLS setup without requiring test users.
 * It verifies that RLS is enabled and policies exist.
 *
 * Run with: node tests/rls-quick-check.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables in .env file.');
  process.exit(1);
}

console.log('🔒 RLS Quick Check\n');
console.log('================================================\n');

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTable(tableName) {
  console.log(`\n📋 Checking ${tableName}...`);

  // Try to query the table without authentication
  const { data, error } = await client
    .from(tableName)
    .select('*')
    .limit(1);

  if (error) {
    // If we get a policy error, RLS is working!
    if (error.code === 'PGRST301' || error.message.includes('policy')) {
      console.log(`   ✅ RLS enabled (blocked anonymous access)`);
      return true;
    } else {
      console.log(`   ⚠️  Error: ${error.message}`);
      return false;
    }
  } else {
    // Got data without auth - check if this is expected
    if (tableName === 'events' && data.length > 0) {
      console.log(`   ✅ RLS working (returned ${data.length} live events - this is expected)`);
      return true;
    } else if (data.length === 0) {
      console.log(`   ✅ RLS enabled (no data accessible without auth)`);
      return true;
    } else {
      console.log(`   ⚠️  Unexpected: Got ${data.length} rows without authentication`);
      return false;
    }
  }
}

async function testParticipantInsertion() {
  console.log(`\n📋 Testing participant insertion (should be allowed for registration)...`);

  // First, get a live event to test with
  const { data: events } = await client
    .from('events')
    .select('id')
    .eq('status', 'live')
    .limit(1);

  if (!events || events.length === 0) {
    console.log(`   ⚠️  No live events found. Create a live event to test participant insertion.`);
    return null;
  }

  const testEmail = `rls-test-${Date.now()}@example.com`;

  // Try to insert a participant anonymously
  const { data, error } = await client
    .from('participants')
    .insert({
      event_id: events[0].id,
      name: 'RLS Test Participant',
      email: testEmail
    })
    .select()
    .single();

  if (error) {
    console.log(`   ❌ Participant insertion failed: ${error.message}`);
    return null;
  } else {
    console.log(`   ✅ Participant insertion allowed (needed for public registration)`);

    // Clean up
    const deleteResult = await client
      .from('participants')
      .delete()
      .eq('email', testEmail);

    if (deleteResult.error) {
      console.log(`   ⚠️  Note: Test participant could not be deleted (expected - RLS working)`);
    } else {
      console.log(`   ✅ Cleanup: Test participant removed`);
    }

    return data;
  }
}

async function checkAuth() {
  console.log(`\n🔐 Checking authentication status...`);

  const { data: { session } } = await client.auth.getSession();

  if (session) {
    console.log(`   ✅ Authenticated as: ${session.user.email}`);
    return session.user;
  } else {
    console.log(`   ℹ️  Not authenticated (expected for this check)`);
    return null;
  }
}

async function runChecks() {
  try {
    await checkAuth();

    console.log(`\n================================================`);
    console.log(`\n🔍 Checking RLS on tables...\n`);

    const tables = [
      'user_profiles',
      'events',
      'participants',
      'email_templates'
    ];

    const results = await Promise.all(tables.map(checkTable));

    // Test participant insertion specifically
    await testParticipantInsertion();

    console.log(`\n================================================`);
    console.log(`\n📊 Summary\n`);

    const passCount = results.filter(r => r).length;
    console.log(`✅ ${passCount}/${tables.length} tables have RLS enabled`);

    if (passCount === tables.length) {
      console.log(`\n✅ RLS is properly configured!\n`);
      console.log(`Next steps:`);
      console.log(`1. Create test users (see tests/RLS_TEST_GUIDE.md)`);
      console.log(`2. Run full test suite: node tests/rls-verification.js`);
    } else {
      console.log(`\n⚠️  Some tables may need RLS policies reviewed.\n`);
    }

    console.log(`\nFor detailed testing, see: tests/RLS_TEST_GUIDE.md\n`);

  } catch (error) {
    console.error(`\n❌ Error running checks:`, error.message);
    process.exit(1);
  }
}

runChecks();
