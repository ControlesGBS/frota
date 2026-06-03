import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ndwivbhqglpnfyqwjbzu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kd2l2YmhxZ2xwbmZ5cXdqYnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjMwNzksImV4cCI6MjA5NTk5OTA3OX0.uYzp_BlsQlgMp48k10gpSQdBReXJToGuVAkh38i3ABg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)