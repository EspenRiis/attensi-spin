/**
 * Squad Scramble Database Verification Script
 * Run this to verify migration completed successfully
 */

import { createClient } from '@supabase/supabase-js';

// Read env vars from import.meta.env or process.env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure .env file exists with:');
  console.log('  VITE_SUPABASE_URL=your-url');
  console.log('  VITE_SUPABASE_ANON_KEY=your-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('🔍 Verifying Squad Scramble Database Migration...\n');

  try {
    // 1. Check team_generations table
    console.log('1. Checking team_generations table...');
    const { data: generations, error: genError } = await supabase
      .from('team_generations')
      .select('*')
      .limit(1);

    if (genError) {
      console.error('   ❌ Error:', genError.message);
    } else {
      console.log('   ✅ team_generations table exists');
      console.log(`   📊 Current records: ${generations?.length || 0}`);
    }

    // 2. Check teams table
    console.log('\n2. Checking teams table...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .limit(1);

    if (teamsError) {
      console.error('   ❌ Error:', teamsError.message);
    } else {
      console.log('   ✅ teams table exists');
      console.log(`   📊 Current records: ${teams?.length || 0}`);
    }

    // 3. Check team_members table
    console.log('\n3. Checking team_members table...');
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .limit(1);

    if (membersError) {
      console.error('   ❌ Error:', membersError.message);
    } else {
      console.log('   ✅ team_members table exists');
      console.log(`   📊 Current records: ${members?.length || 0}`);
    }

    // 4. Check events.available_tools column
    console.log('\n4. Checking events.available_tools column...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name, available_tools')
      .limit(3);

    if (eventsError) {
      console.error('   ❌ Error:', eventsError.message);
    } else {
      console.log('   ✅ available_tools column exists');
      if (events && events.length > 0) {
        console.log(`   📊 Sample events:${events.map(e =>
          `\n      - ${e.name}: ${JSON.stringify(e.available_tools)}`
        ).join('')}`);
      }
    }

    console.log('\n✅ Database verification complete!\n');
    console.log('🎉 You can now test Squad Scramble at:');
    console.log('   http://localhost:5174/squad-scramble\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }

  process.exit(0);
}

verifyDatabase();
