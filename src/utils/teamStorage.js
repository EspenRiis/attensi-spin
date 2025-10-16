// Squad Scramble - Database Storage Utilities
// Functions for saving and loading team generations from Supabase

import { supabase } from '../lib/supabase';
import { getCurrentSessionId } from './session';

/**
 * Save a team generation to the database
 * @param {Object} params - Generation parameters
 * @param {string} params.eventId - Event ID (for logged-in users) or null
 * @param {string} params.sessionId - Session ID (for anonymous users) or null
 * @param {string} params.mode - 'team_count' or 'team_size'
 * @param {number} params.teamCount - Number of teams (if mode = 'team_count')
 * @param {number} params.teamSize - Team size (if mode = 'team_size')
 * @param {Array<Object>} params.teams - Array of generated teams
 * @returns {Object} - {success: boolean, generationId: string, error: string}
 */
export const saveTeamGeneration = async ({
  eventId = null,
  sessionId = null,
  mode,
  teamCount = null,
  teamSize = null,
  teams
}) => {
  try {
    // Use provided IDs or fallback to current session
    const actualSessionId = sessionId || (eventId ? null : getCurrentSessionId());

    if (!eventId && !actualSessionId) {
      throw new Error('Either eventId or sessionId must be provided');
    }

    // Calculate metadata
    const totalParticipants = teams.reduce((sum, team) => sum + team.members.length, 0);
    const actualTeamsCreated = teams.length;

    // 1. Insert team generation record
    const { data: generation, error: genError } = await supabase
      .from('team_generations')
      .insert({
        event_id: eventId,
        session_id: actualSessionId,
        mode: mode,
        team_count: teamCount,
        team_size: teamSize,
        actual_teams_created: actualTeamsCreated,
        total_participants: totalParticipants,
        is_current: true // Will trigger function to mark others as not current
      })
      .select()
      .single();

    if (genError) throw genError;

    // 2. Insert teams
    const teamsToInsert = teams.map(team => ({
      generation_id: generation.id,
      team_number: team.teamNumber,
      team_name: team.name,
      color_scheme: team.color
    }));

    const { data: insertedTeams, error: teamsError } = await supabase
      .from('teams')
      .insert(teamsToInsert)
      .select();

    if (teamsError) throw teamsError;

    // 3. Insert team members
    const teamMembersToInsert = [];

    insertedTeams.forEach((insertedTeam) => {
      const teamData = teams.find(t => t.teamNumber === insertedTeam.team_number);

      teamData.members.forEach(member => {
        teamMembersToInsert.push({
          team_id: insertedTeam.id,
          participant_id: member.id,
          is_captain: teamData.captain?.id === member.id
        });
      });
    });

    const { error: membersError } = await supabase
      .from('team_members')
      .insert(teamMembersToInsert);

    if (membersError) throw membersError;

    return {
      success: true,
      generationId: generation.id,
      error: null
    };
  } catch (error) {
    console.error('Error saving team generation:', error);
    return {
      success: false,
      generationId: null,
      error: error.message
    };
  }
};

/**
 * Load the current (most recent) team generation
 * @param {string} eventId - Event ID (for logged-in users) or null
 * @param {string} sessionId - Session ID (for anonymous users) or null
 * @returns {Object} - {generation: Object, teams: Array, error: string}
 */
export const loadCurrentTeamGeneration = async (eventId = null, sessionId = null) => {
  try {
    const actualSessionId = sessionId || (eventId ? null : getCurrentSessionId());

    if (!eventId && !actualSessionId) {
      return { generation: null, teams: [], error: null };
    }

    // Build query
    let query = supabase
      .from('team_generations')
      .select(`
        *,
        teams (
          *,
          team_members (
            *,
            participants (*)
          )
        )
      `)
      .eq('is_current', true)
      .order('created_at', { ascending: false })
      .limit(1);

    // Add filter based on event or session
    if (eventId) {
      query = query.eq('event_id', eventId);
    } else {
      query = query.eq('session_id', actualSessionId);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      return { generation: null, teams: [], error: null };
    }

    const generation = data[0];

    // Transform data into UI-friendly format
    const teams = generation.teams.map(team => ({
      id: team.id,
      teamNumber: team.team_number,
      name: team.team_name,
      color: team.color_scheme,
      members: team.team_members.map(tm => ({
        id: tm.participants.id,
        name: tm.participants.name,
        email: tm.participants.email,
        isCaptain: tm.is_captain
      })),
      captain: team.team_members.find(tm => tm.is_captain)?.participants || null
    }));

    return {
      generation: {
        id: generation.id,
        mode: generation.mode,
        teamCount: generation.team_count,
        teamSize: generation.team_size,
        actualTeamsCreated: generation.actual_teams_created,
        totalParticipants: generation.total_participants,
        createdAt: generation.created_at
      },
      teams: teams,
      error: null
    };
  } catch (error) {
    console.error('Error loading current team generation:', error);
    return {
      generation: null,
      teams: [],
      error: error.message
    };
  }
};

/**
 * Load all team generation history
 * @param {string} eventId - Event ID (for logged-in users) or null
 * @param {string} sessionId - Session ID (for anonymous users) or null
 * @param {number} limit - Max number of generations to load
 * @returns {Array<Object>} - Array of generation objects
 */
export const loadTeamGenerationHistory = async (
  eventId = null,
  sessionId = null,
  limit = 10
) => {
  try {
    const actualSessionId = sessionId || (eventId ? null : getCurrentSessionId());

    if (!eventId && !actualSessionId) {
      return [];
    }

    let query = supabase
      .from('team_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventId) {
      query = query.eq('event_id', eventId);
    } else {
      query = query.eq('session_id', actualSessionId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error loading team generation history:', error);
    return [];
  }
};

/**
 * Restore a previous generation as current
 * @param {string} generationId - Generation ID to restore
 * @returns {Object} - {success: boolean, error: string}
 */
export const restoreTeamGeneration = async (generationId) => {
  try {
    // Update the generation to mark as current
    // This will trigger the database function to mark others as not current
    const { error } = await supabase
      .from('team_generations')
      .update({ is_current: true })
      .eq('id', generationId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error restoring team generation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a team generation
 * @param {string} generationId - Generation ID to delete
 * @returns {Object} - {success: boolean, error: string}
 */
export const deleteTeamGeneration = async (generationId) => {
  try {
    const { error } = await supabase
      .from('team_generations')
      .delete()
      .eq('id', generationId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting team generation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update team member captain status
 * @param {string} teamId - Team ID
 * @param {string} participantId - Participant ID to make captain
 * @returns {Object} - {success: boolean, error: string}
 */
export const updateTeamCaptain = async (teamId, participantId) => {
  try {
    // 1. Remove captain status from all members of this team
    const { error: removeError } = await supabase
      .from('team_members')
      .update({ is_captain: false })
      .eq('team_id', teamId);

    if (removeError) throw removeError;

    // 2. Set new captain
    const { error: setCaptainError } = await supabase
      .from('team_members')
      .update({ is_captain: true })
      .eq('team_id', teamId)
      .eq('participant_id', participantId);

    if (setCaptainError) throw setCaptainError;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating team captain:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Move a participant to a different team
 * @param {string} participantId - Participant ID
 * @param {string} fromTeamId - Current team ID
 * @param {string} toTeamId - Destination team ID
 * @returns {Object} - {success: boolean, error: string}
 */
export const moveParticipantToTeam = async (participantId, fromTeamId, toTeamId) => {
  try {
    // 1. Check if participant is captain of current team
    const { data: memberData } = await supabase
      .from('team_members')
      .select('is_captain')
      .eq('team_id', fromTeamId)
      .eq('participant_id', participantId)
      .single();

    const wasCaptain = memberData?.is_captain || false;

    // 2. Delete from current team
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', fromTeamId)
      .eq('participant_id', participantId);

    if (deleteError) throw deleteError;

    // 3. Add to new team (not as captain)
    const { error: insertError } = await supabase
      .from('team_members')
      .insert({
        team_id: toTeamId,
        participant_id: participantId,
        is_captain: false // They lose captain status when moved
      });

    if (insertError) throw insertError;

    return { success: true, wasCaptain, error: null };
  } catch (error) {
    console.error('Error moving participant to team:', error);
    return { success: false, wasCaptain: false, error: error.message };
  }
};

/**
 * Update team name
 * @param {string} teamId - Team ID
 * @param {string} newName - New team name
 * @returns {Object} - {success: boolean, error: string}
 */
export const updateTeamName = async (teamId, newName) => {
  try {
    const { error } = await supabase
      .from('teams')
      .update({ team_name: newName })
      .eq('id', teamId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating team name:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if there's any saved team generation data
 * @param {string} eventId - Event ID or null
 * @param {string} sessionId - Session ID or null
 * @returns {boolean} - True if data exists
 */
export const hasTeamGenerationData = async (eventId = null, sessionId = null) => {
  try {
    const actualSessionId = sessionId || (eventId ? null : getCurrentSessionId());

    if (!eventId && !actualSessionId) {
      return false;
    }

    let query = supabase
      .from('team_generations')
      .select('id', { count: 'exact', head: true });

    if (eventId) {
      query = query.eq('event_id', eventId);
    } else {
      query = query.eq('session_id', actualSessionId);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count > 0;
  } catch (error) {
    console.error('Error checking team generation data:', error);
    return false;
  }
};
