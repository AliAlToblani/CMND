import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mwdaxgwudhostyzjvmgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13ZGF4Z3d1ZGhvc3R5emp2bWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0MTg0MjMsImV4cCI6MjA1MTk5NDQyM30.gfwFi84TLT4PhH6Ij3hCUyJRjXUBJpRLqpVzLDCE4Zs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('partnerships')
    .select('id, name, partnership_type')
    .ilike('name', '%qambar%');
  
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Partnerships matching "qambar":');
    console.log(JSON.stringify(data, null, 2));
  }
}

check();
