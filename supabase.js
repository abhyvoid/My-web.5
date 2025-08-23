// supabase.js
const supabaseUrl = "https://kfgjkkprfppnewhehzfr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZ2pra3ByZnBwbmV3aGVoemZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTE0MTEsImV4cCI6MjA3MTUyNzQxMX0.OnfuZGz_c6SglErHOI6vGHt-Y44QHkThWXbZPw4ieSs";

const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

export { supabase };
