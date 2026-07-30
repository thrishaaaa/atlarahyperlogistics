// Public Supabase configuration. Row Level Security protects the database;
// this publishable key is intentionally safe to load in the browser.
const SUPABASE_URL = 'https://prgcbiuinainrvedeeal.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3nb-S7uwrP3oOuA5905Uew_KDN8-t0Z';

window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
