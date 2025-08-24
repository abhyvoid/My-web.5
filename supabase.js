<!-- supabase.js -->
<script>
  // Your Supabase project (from you)
  const SUPABASE_URL = "https://kfgjkkprfppnewhehzfr.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZ2pra3ByZnBwbmV3aGVoemZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTE0MTEsImV4cCI6MjA3MTUyNzQxMX0.OnfuZGz_c6SglErHOI6vGHt-Y44QHkThWXbZPw4ieSs";

  // global client (window.supabase)
  window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
</script>
