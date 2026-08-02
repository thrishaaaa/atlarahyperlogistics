// Public Supabase configuration. Row Level Security protects the database;
// this anon key is intentionally safe to load in the browser.
//
// NOTE: We use the legacy JWT-based anon key here (not the newer
// sb_publishable_... key) because it is a signed JWT with role=anon baked
// directly into its claims, so every Supabase microservice (PostgREST,
// Storage, Realtime, etc.) resolves the Postgres role correctly. The newer
// opaque publishable-key format requires each service to look the key up
// and translate it to a role at request time, and Storage was intermittently
// failing to do this for this project, causing every resume upload to be
// evaluated against Postgres with no role (or the wrong role) applied —
// which surfaces as "new row violates row-level security policy for table
// objects" even though the RLS policies themselves are correct.
const SUPABASE_URL = 'https://prgcbiuinainrvedeeal.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByZ2NiaXVpbmFpbnJ2ZWRlZWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMjg3MzQsImV4cCI6MjEwMDkwNDczNH0.tucoMYshL7VkTR26ZCkd0_rZilPZWihCvggenova5OU';

window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);