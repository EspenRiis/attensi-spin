import { createClient } from '@supabase/supabase-js'

// Use environment variables in production, fallback to hardcoded values in development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xxmapoiddadngoaofsti.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bWFwb2lkZGFkbmdvYW9mc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODIxNjksImV4cCI6MjA3NDk1ODE2OX0.83mPVlUm8wyGOEm8BXXMcvzKZ2K5WtfMWimUQnjOJyI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
