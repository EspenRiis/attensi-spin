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

    const { data, error, count } = await supabase
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
