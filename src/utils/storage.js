import { supabase } from '../lib/supabase';
import { getCurrentSessionId } from './session';

const WINNERS_KEY = 'attensi-spin-winners';

// Add a new participant name to Supabase
export const saveNames = async (names) => {
  try {
    // This function is now only used for adding single names
    // The actual sync happens through real-time subscriptions
    console.log('saveNames called with:', names);
  } catch (error) {
    console.error('Error saving names:', error);
  }
};

// Add a single name to Supabase with session ID
export const addName = async (name, sessionId = null) => {
  try {
    // Use provided sessionId or get current session
    const session = sessionId || getCurrentSessionId();
    if (!session) {
      throw new Error('No session ID available');
    }

    const { data, error } = await supabase
      .from('participants')
      .insert([{ name: name.trim(), session_id: session }])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error adding name:', error);
    return { success: false, error: error.message };
  }
};

// Load all participant names from Supabase for current session
export const loadNames = async (sessionId = null) => {
  try {
    const session = sessionId || getCurrentSessionId();
    if (!session) {
      return [];
    }

    const { data, error } = await supabase
      .from('participants')
      .select('name')
      .eq('session_id', session)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data.map(item => item.name);
  } catch (error) {
    console.error('Error loading names:', error);
    return [];
  }
};

// Remove a specific name from Supabase for current session
export const removeName = async (name, sessionId = null) => {
  try {
    const session = sessionId || getCurrentSessionId();
    if (!session) {
      throw new Error('No session ID available');
    }

    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('name', name)
      .eq('session_id', session);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error removing name:', error);
    return { success: false, error: error.message };
  }
};

// Clear all participant names from Supabase for current session
export const clearNames = async (sessionId = null) => {
  try {
    const session = sessionId || getCurrentSessionId();
    if (!session) {
      throw new Error('No session ID available');
    }

    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('session_id', session);

    if (error) throw error;

    // Also clear local winners
    localStorage.removeItem(WINNERS_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error clearing names:', error);
    return { success: false, error: error.message };
  }
};

// Check if there's any data in Supabase for current session
export const hasStoredData = async (sessionId = null) => {
  try {
    const session = sessionId || getCurrentSessionId();
    if (!session) {
      return false;
    }

    const { error, count } = await supabase
      .from('participants')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session);

    if (error) throw error;
    return count > 0;
  } catch (error) {
    console.error('Error checking stored data:', error);
    return false;
  }
};

// Winners are still stored locally (not synced across devices)
export const saveWinners = (winners) => {
  try {
    localStorage.setItem(WINNERS_KEY, JSON.stringify(winners));
  } catch (error) {
    console.error('Error saving winners:', error);
  }
};

export const loadWinners = () => {
  try {
    const stored = localStorage.getItem(WINNERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading winners:', error);
    return [];
  }
};

// ============================================
// EVENT-BASED FUNCTIONS (for logged-in users)
// ============================================

// Load all active participants from an event (excludes archived)
export const loadParticipantsFromEvent = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('name, is_winner, status')
      .eq('event_id', eventId)
      .eq('status', 'active') // Only load active participants for the wheel
      .order('created_at', { ascending: true});

    if (error) throw error;
    return {
      // All active participants (including winners) - winners stay visible in participants list
      names: data.map(item => item.name),
      // Winners from database (those marked is_winner = true)
      winners: data.filter(item => item.is_winner).map(item => item.name)
    };
  } catch (error) {
    console.error('Error loading participants from event:', error);
    return { names: [], winners: [] };
  }
};

// Mark a participant as winner in the database
export const markParticipantAsWinner = async (eventId, name) => {
  try {
    const wonAt = new Date().toISOString();

    // 1. Update participant as winner
    const { error: updateError } = await supabase
      .from('participants')
      .update({ is_winner: true, won_at: wonAt })
      .eq('event_id', eventId)
      .eq('name', name);

    if (updateError) throw updateError;

    // 2. Record in winner history (permanent record)
    const { data: historyData, error: historyError } = await supabase
      .from('winner_history')
      .insert({
        event_id: eventId,
        participant_name: name,
        won_at: wonAt
      })
      .select();

    if (historyError) {
      console.error('❌ Failed to record winner history:', historyError);
      console.error('Event ID:', eventId);
      console.error('Name:', name);
      // Don't fail the whole operation if history insert fails
    } else {
      console.log('✅ Winner history recorded:', historyData);
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking participant as winner:', error);
    return { success: false, error: error.message };
  }
};

// Clear all winner status for an event (for "start fresh" option)
export const clearAllWinners = async (eventId) => {
  try {
    const { error } = await supabase
      .from('participants')
      .update({ is_winner: false, won_at: null })
      .eq('event_id', eventId)
      .eq('is_winner', true);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error clearing winners:', error);
    return { success: false, error: error.message };
  }
};

// Archive all participants for an event (soft delete for "start empty" option)
export const archiveAllParticipants = async (eventId) => {
  try {
    const { error } = await supabase
      .from('participants')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .eq('status', 'active'); // Only archive active participants

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error archiving participants:', error);
    return { success: false, error: error.message };
  }
};

// Restore a single winner back to participants (undo winner status)
export const restoreWinner = async (eventId, name) => {
  try {
    const { error } = await supabase
      .from('participants')
      .update({ is_winner: false, won_at: null })
      .eq('event_id', eventId)
      .eq('name', name);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error restoring winner:', error);
    return { success: false, error: error.message };
  }
};

// Add a name to an event (logged-in user adding manually)
export const addNameToEvent = async (eventId, name) => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .insert([{ name: name.trim(), event_id: eventId }])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error adding name to event:', error);
    return { success: false, error: error.message };
  }
};

// Remove a name from the wheel (no-op for event mode - handled in UI)
// This function is kept for compatibility but doesn't modify the database
// Winners are tracked in local state and only marked in DB when "Remove All Winners" is clicked
export const removeNameFromEvent = async () => {
  try {
    // No database changes - winner tracking is handled in UI state
    // The participant remains in the database unchanged
    return { success: true };
  } catch (error) {
    console.error('Error in removeNameFromEvent:', error);
    return { success: false, error: error.message };
  }
};
