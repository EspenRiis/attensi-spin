/**
 * RLS (Row Level Security) Verification Test
 *
 * This script tests that all Supabase RLS policies are working correctly.
 * It verifies that users can only access their own data and not other users' data.
 *
 * Run with: node tests/rls-verification.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables. Please check .env file.');
  process.exit(1);
}

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message) {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (message) console.log(`   ${message}`);

  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

// Test users (you'll need to create these manually first)
const TEST_USERS = {
  user1: {
    email: 'test-user-1@example.com',
    password: 'TestPassword123!',
  },
  user2: {
    email: 'test-user-2@example.com',
    password: 'TestPassword123!',
  }
};

async function createTestClient(userEmail, userPassword) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await client.auth.signInWithPassword({
    email: userEmail,
    password: userPassword
  });

  if (error) {
    throw new Error(`Failed to sign in as ${userEmail}: ${error.message}`);
  }

  return { client, userId: data.user.id };
}

async function runTests() {
  console.log('🔒 Starting RLS Verification Tests\n');
  console.log('================================================\n');

  let user1Client, user1Id, user2Client, user2Id, user1Event, user2Event;

  try {
    // ============================================
    // SETUP: Sign in test users
    // ============================================
    console.log('📝 Setup: Signing in test users...\n');

    try {
      ({ client: user1Client, userId: user1Id } = await createTestClient(
        TEST_USERS.user1.email,
        TEST_USERS.user1.password
      ));
      logTest('User 1 Sign In', true, `Signed in as ${TEST_USERS.user1.email}`);
    } catch (err) {
      logTest('User 1 Sign In', false, err.message);
      console.log('\n⚠️  Please create test users first. Run this SQL in Supabase:');
      console.log(`
-- Create test users (run in Supabase SQL Editor)
-- Note: You may need to create these via the Auth UI or API instead
      `);
      return;
    }

    try {
      ({ client: user2Client, userId: user2Id } = await createTestClient(
        TEST_USERS.user2.email,
        TEST_USERS.user2.password
      ));
      logTest('User 2 Sign In', true, `Signed in as ${TEST_USERS.user2.email}`);
    } catch (err) {
      logTest('User 2 Sign In', false, err.message);
      return;
    }

    console.log('\n================================================\n');
    console.log('🧪 Testing USER_PROFILES RLS Policies\n');

    // ============================================
    // TEST: User can read their own profile
    // ============================================
    const { data: user1Profile, error: readOwnError } = await user1Client
      .from('user_profiles')
      .select('*')
      .eq('id', user1Id)
      .single();

    logTest(
      'Users can read own profile',
      !readOwnError && user1Profile?.id === user1Id,
      readOwnError ? `Error: ${readOwnError.message}` : 'User 1 can read their own profile'
    );

    // ============================================
    // TEST: User cannot read other users' profiles
    // ============================================
    const { data: otherProfile, error: readOtherError } = await user1Client
      .from('user_profiles')
      .select('*')
      .eq('id', user2Id)
      .single();

    logTest(
      'Users cannot read other profiles',
      !otherProfile && readOtherError,
      'User 1 correctly blocked from reading User 2 profile'
    );

    // ============================================
    // TEST: User can update their own profile
    // ============================================
    const { error: updateOwnError } = await user1Client
      .from('user_profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', user1Id);

    logTest(
      'Users can update own profile',
      !updateOwnError,
      updateOwnError ? `Error: ${updateOwnError.message}` : 'User 1 can update their own profile'
    );

    console.log('\n================================================\n');
    console.log('🧪 Testing EVENTS RLS Policies\n');

    // ============================================
    // TEST: User can create their own event
    // ============================================
    const { data: newEvent1, error: createEvent1Error } = await user1Client
      .from('events')
      .insert({
        host_user_id: user1Id,
        name: 'RLS Test Event - User 1',
        status: 'draft'
      })
      .select()
      .single();

    logTest(
      'Users can create events',
      !createEvent1Error && newEvent1,
      createEvent1Error ? `Error: ${createEvent1Error.message}` : 'User 1 created event successfully'
    );

    user1Event = newEvent1;

    // ============================================
    // TEST: User 2 creates their event
    // ============================================
    const { data: newEvent2, error: createEvent2Error } = await user2Client
      .from('events')
      .insert({
        host_user_id: user2Id,
        name: 'RLS Test Event - User 2',
        status: 'draft'
      })
      .select()
      .single();

    logTest(
      'User 2 can create events',
      !createEvent2Error && newEvent2,
      createEvent2Error ? `Error: ${createEvent2Error.message}` : 'User 2 created event successfully'
    );

    user2Event = newEvent2;

    // ============================================
    // TEST: User can read their own events
    // ============================================
    const { data: ownEvents, error: readOwnEventsError } = await user1Client
      .from('events')
      .select('*')
      .eq('id', user1Event.id);

    logTest(
      'Users can read own events',
      !readOwnEventsError && ownEvents?.length === 1,
      readOwnEventsError ? `Error: ${readOwnEventsError.message}` : 'User 1 can read their event'
    );

    // ============================================
    // TEST: User cannot read other users' draft events
    // ============================================
    const { data: otherEvents, error: readOtherEventsError } = await user1Client
      .from('events')
      .select('*')
      .eq('id', user2Event.id);

    logTest(
      'Users cannot read others\' draft events',
      otherEvents?.length === 0,
      'User 1 correctly blocked from reading User 2\'s draft event'
    );

    // ============================================
    // TEST: Anyone can read live events
    // ============================================
    // First, set user2's event to live
    await user2Client
      .from('events')
      .update({ status: 'live' })
      .eq('id', user2Event.id);

    const { data: liveEvents, error: readLiveError } = await user1Client
      .from('events')
      .select('*')
      .eq('id', user2Event.id);

    logTest(
      'Anyone can read live events',
      !readLiveError && liveEvents?.length === 1,
      readLiveError ? `Error: ${readLiveError.message}` : 'User 1 can read User 2\'s live event (needed for registration)'
    );

    // ============================================
    // TEST: User can update their own event
    // ============================================
    const { error: updateOwnEventError } = await user1Client
      .from('events')
      .update({ name: 'RLS Test Event - User 1 (Updated)' })
      .eq('id', user1Event.id);

    logTest(
      'Users can update own events',
      !updateOwnEventError,
      updateOwnEventError ? `Error: ${updateOwnEventError.message}` : 'User 1 can update their event'
    );

    // ============================================
    // TEST: User cannot update other users' events
    // ============================================
    const { error: updateOtherEventError } = await user1Client
      .from('events')
      .update({ name: 'Hacked Event' })
      .eq('id', user2Event.id);

    logTest(
      'Users cannot update others\' events',
      updateOtherEventError || false,
      'User 1 correctly blocked from updating User 2\'s event'
    );

    console.log('\n================================================\n');
    console.log('🧪 Testing PARTICIPANTS RLS Policies\n');

    // ============================================
    // TEST: Anyone can insert participants
    // ============================================
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: newParticipant, error: insertParticipantError } = await anonClient
      .from('participants')
      .insert({
        event_id: user2Event.id,
        name: 'Anonymous Participant',
        email: 'anon@example.com'
      })
      .select()
      .single();

    logTest(
      'Anyone can insert participants',
      !insertParticipantError && newParticipant,
      insertParticipantError ? `Error: ${insertParticipantError.message}` : 'Anonymous user can register as participant'
    );

    // ============================================
    // TEST: Hosts can view participants for their events
    // ============================================
    const { data: ownParticipants, error: readOwnParticipantsError } = await user2Client
      .from('participants')
      .select('*')
      .eq('event_id', user2Event.id);

    logTest(
      'Hosts can view own event participants',
      !readOwnParticipantsError && ownParticipants?.length >= 1,
      readOwnParticipantsError ? `Error: ${readOwnParticipantsError.message}` : `User 2 can view ${ownParticipants.length} participant(s)`
    );

    // ============================================
    // TEST: Users cannot view other users' event participants
    // ============================================
    const { data: otherParticipants, error: readOtherParticipantsError } = await user1Client
      .from('participants')
      .select('*')
      .eq('event_id', user2Event.id);

    logTest(
      'Users cannot view others\' event participants',
      otherParticipants?.length === 0,
      'User 1 correctly blocked from viewing User 2\'s participants'
    );

    // ============================================
    // TEST: Hosts can update their event participants
    // ============================================
    const { error: updateParticipantError } = await user2Client
      .from('participants')
      .update({ is_winner: true })
      .eq('id', newParticipant.id);

    logTest(
      'Hosts can update own event participants',
      !updateParticipantError,
      updateParticipantError ? `Error: ${updateParticipantError.message}` : 'User 2 can mark participant as winner'
    );

    // ============================================
    // TEST: Users cannot update other users' event participants
    // ============================================
    const { error: updateOtherParticipantError } = await user1Client
      .from('participants')
      .update({ is_winner: false })
      .eq('id', newParticipant.id);

    logTest(
      'Users cannot update others\' event participants',
      updateOtherParticipantError || false,
      'User 1 correctly blocked from updating User 2\'s participants'
    );

    // ============================================
    // TEST: Hosts can delete their event participants
    // ============================================
    const { error: deleteParticipantError } = await user2Client
      .from('participants')
      .delete()
      .eq('id', newParticipant.id);

    logTest(
      'Hosts can delete own event participants',
      !deleteParticipantError,
      deleteParticipantError ? `Error: ${deleteParticipantError.message}` : 'User 2 can delete participant'
    );

    console.log('\n================================================\n');
    console.log('🧹 Cleanup: Deleting test events\n');

    // ============================================
    // CLEANUP: Delete test events
    // ============================================
    if (user1Event) {
      await user1Client.from('events').delete().eq('id', user1Event.id);
      console.log('   Deleted User 1 test event');
    }
    if (user2Event) {
      await user2Client.from('events').delete().eq('id', user2Event.id);
      console.log('   Deleted User 2 test event');
    }

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    console.error(error);
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n================================================\n');
  console.log('📊 Test Summary\n');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);

  if (results.failed === 0) {
    console.log('\n🎉 All RLS policies are working correctly!\n');
  } else {
    console.log('\n⚠️  Some RLS policies need attention:\n');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`   - ${t.name}: ${t.message}`));
    console.log();
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
