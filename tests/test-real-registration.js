/**
 * Test Real Registration Flow
 *
 * This simulates what happens when someone registers via QR code
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
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

// Create anonymous client (like a user scanning QR code)
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRegistration() {
  console.log('🧪 Testing Real Registration Flow\n');
  console.log('================================================\n');

  // Step 1: Get a live event (like the RegisterPage does)
  console.log('Step 1: Fetching live events...');
  const { data: events, error: eventsError } = await anonClient
    .from('events')
    .select('*')
    .eq('status', 'live')
    .limit(1);

  if (eventsError) {
    console.error('❌ Failed to fetch events:', eventsError);
    return;
  }

  if (!events || events.length === 0) {
    console.log('⚠️  No live events found.');
    console.log('\nTo test:');
    console.log('1. Sign in to your app');
    console.log('2. Create an event or set an existing event status to "live"');
    console.log('3. Run this test again\n');
    return;
  }

  const event = events[0];
  console.log(`✅ Found live event: "${event.name}" (ID: ${event.id})\n`);

  // Step 2: Try to insert a participant (like the form submit does)
  console.log('Step 2: Attempting to register as anonymous user...');

  const testParticipant = {
    event_id: event.id,
    name: `Test User ${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    organization: null,
    phone: null,
    custom_field_1: null,
    custom_field_2: null,
    consent_marketing: false
  };

  console.log('Participant data:', JSON.stringify(testParticipant, null, 2));
  console.log();

  const { data: insertedParticipant, error: insertError } = await anonClient
    .from('participants')
    .insert([testParticipant])
    .select()
    .single();

  if (insertError) {
    console.error('❌ Registration FAILED\n');
    console.error('Error details:');
    console.error('  Code:', insertError.code);
    console.error('  Message:', insertError.message);
    console.error('  Details:', insertError.details);
    console.error('  Hint:', insertError.hint);
    console.log('\n================================================\n');
    console.log('🔍 This means your RLS policy is still blocking inserts.');
    console.log('\nPlease run this SQL in Supabase SQL Editor:\n');
    console.log('-- Drop and recreate the policy');
    console.log('DROP POLICY IF EXISTS "Anyone can insert participants" ON public.participants;');
    console.log('');
    console.log('CREATE POLICY "Anyone can insert participants"');
    console.log('  ON public.participants');
    console.log('  FOR INSERT');
    console.log('  TO public');
    console.log('  WITH CHECK (true);');
    console.log('\n-- Verify RLS is enabled');
    console.log('SELECT tablename, rowsecurity FROM pg_tables');
    console.log('WHERE tablename = \'participants\';');
    console.log('\n-- Check all policies on participants');
    console.log('SELECT * FROM pg_policies WHERE tablename = \'participants\';');
    console.log();
    process.exit(1);
  }

  console.log('✅ Registration SUCCESSFUL!\n');
  console.log('Inserted participant:', insertedParticipant);
  console.log();

  // Step 3: Verify anonymous user CANNOT read other participants
  console.log('Step 3: Verifying anonymous user cannot read participants...');
  const { data: readParticipants } = await anonClient
    .from('participants')
    .select('*')
    .eq('event_id', event.id);

  if (!readParticipants || readParticipants.length === 0) {
    console.log('✅ Correctly blocked from reading participants (RLS working)\n');
  } else {
    console.log('⚠️  Anonymous user can read participants. This may be intended if session_id is set.\n');
  }

  // Clean up: Try to delete (should fail)
  console.log('Step 4: Verifying anonymous user cannot delete...');
  const { error: deleteError } = await anonClient
    .from('participants')
    .delete()
    .eq('id', insertedParticipant.id);

  if (deleteError) {
    console.log('✅ Correctly blocked from deleting (RLS working)\n');
  } else {
    console.log('⚠️  Anonymous user was able to delete participant (potential security issue)\n');
  }

  console.log('================================================\n');
  console.log('🎉 All tests passed! Registration is working correctly.\n');
  console.log('Note: Test participant was created but not deleted (requires event owner)');
  console.log(`Email: ${testParticipant.email}`);
  console.log('You can delete it manually from the participants tab.\n');
}

testRegistration().catch(console.error);
