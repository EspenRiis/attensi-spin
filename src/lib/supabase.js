import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xxmapoiddadngoaofsti.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bWFwb2lkZGFkbmdvYW9mc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODIxNjksImV4cCI6MjA3NDk1ODE2OX0.83mPVlUm8wyGOEm8BXXMcvzKZ2K5WtfMWimUQnjOJyI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
