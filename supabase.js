<!-- Load AFTER the CDN script in each page -->
<script>
  // === Your Supabase project ===
  const SUPABASE_URL = 'https://kfgjkkprfppnewhehzfr.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZ2pra3ByZnBwbmV3aGVoemZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTE0MTEsImV4cCI6MjA3MTUyNzQxMX0.OnfuZGz_c6SglErHOI6vGHt-Y44QHkThWXbZPw4ieSs';

  window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Helpers
  window.ADMIN_EMAIL = 'abhayrangappanvat@gmail.com';
  window.uuid = () => (crypto?.randomUUID ? crypto.randomUUID() : (Date.now() + '_' + Math.random().toString(16).slice(2)));
</script>
