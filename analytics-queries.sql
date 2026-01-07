-- ============================================
-- Analytics Queries for Attensi Spin
-- ============================================
-- Run these in your Supabase SQL Editor to see visitor activity

-- 1. TOTAL SPINS WORLDWIDE
-- ============================================
SELECT total_spins, updated_at
FROM app_statistics
WHERE id = 1;

-- 2. RECENT WHEEL ACTIVITY (Last 7 days)
-- ============================================
-- Shows unique sessions that added participants for Name Roulette
SELECT
  session_id,
  COUNT(*) as participant_count,
  MIN(created_at) as first_activity,
  MAX(created_at) as last_activity
FROM participants
WHERE session_id IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY session_id
ORDER BY first_activity DESC;

-- 3. RECENT TEAM GENERATIONS (Last 7 days)
-- ============================================
-- Shows who created teams with Squad Scramble
SELECT
  session_id,
  mode,
  team_count,
  team_size,
  actual_teams_created,
  total_participants,
  created_at
FROM team_generations
WHERE session_id IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 4. WINNER HISTORY (Event-based only, last 7 days)
-- ============================================
SELECT
  participant_name,
  won_at,
  event_id
FROM winner_history
WHERE won_at > NOW() - INTERVAL '7 days'
ORDER BY won_at DESC;

-- 5. DAILY ACTIVITY SUMMARY (Last 7 days)
-- ============================================
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) as total_participants_added
FROM participants
WHERE session_id IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 6. ALL FREE TIER SESSIONS (Ever created)
-- ============================================
-- Shows all unique free-tier sessions with activity counts
SELECT
  session_id,
  COUNT(*) as participants_added,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen
FROM participants
WHERE session_id IS NOT NULL
GROUP BY session_id
ORDER BY last_seen DESC;

-- 7. RECENT PARTICIPANT ADDITIONS (Last 24 hours)
-- ============================================
SELECT
  name,
  session_id,
  created_at
FROM participants
WHERE session_id IS NOT NULL
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 8. TEAM GENERATION STATS (All time)
-- ============================================
-- FREE TIER ONLY:
SELECT
  COUNT(*) as total_generations,
  SUM(actual_teams_created) as total_teams_created,
  SUM(total_participants) as total_participants_organized,
  AVG(actual_teams_created) as avg_teams_per_generation,
  MIN(created_at) as first_generation,
  MAX(created_at) as last_generation
FROM team_generations
WHERE session_id IS NOT NULL;

-- ALL GENERATIONS (Free + Event-based):
SELECT
  COUNT(*) as total_generations,
  SUM(actual_teams_created) as total_teams_created,
  SUM(total_participants) as total_participants_organized,
  AVG(actual_teams_created) as avg_teams_per_generation,
  MIN(created_at) as first_generation,
  MAX(created_at) as last_generation
FROM team_generations;

-- 9. ALL TEAM GENERATIONS (Last 30 days) - Both Free and Event-based
-- ============================================
SELECT
  CASE
    WHEN session_id IS NOT NULL THEN 'Free Tier'
    ELSE 'Event-based'
  END as source,
  COALESCE(session_id, 'event: ' || event_id::text) as identifier,
  mode,
  team_count,
  team_size,
  actual_teams_created,
  total_participants,
  created_at
FROM team_generations
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
