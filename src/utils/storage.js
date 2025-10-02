import { supabase } from '../lib/supabase';

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

// Add a single name to Supabase
export const addName = async (name) => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .insert([{ name: name.trim() }])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error adding name:', error);
    return { success: false, error: error.message };
  }
};

// Load all participant names from Supabase
export const loadNames = async () => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('name')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data.map(item => item.name);
  } catch (error) {
    console.error('Error loading names:', error);
    return [];
  }
};

// Remove a specific name from Supabase
export const removeName = async (name) => {
  try {
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('name', name);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error removing name:', error);
    return { success: false, error: error.message };
  }
};

// Clear all participant names from Supabase
export const clearNames = async () => {
  try {
    const { error } = await supabase
      .from('participants')
      .delete()
      .neq('id', 0); // Delete all rows

    if (error) throw error;

    // Also clear local winners
    localStorage.removeItem(WINNERS_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error clearing names:', error);
    return { success: false, error: error.message };
  }
};

// Check if there's any data in Supabase
export const hasStoredData = async () => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;
    return data && data.length > 0;
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
