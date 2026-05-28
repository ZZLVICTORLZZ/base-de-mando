import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xdciomndikpifslwrksj.supabase.co';
const supabaseKey = 'sb_publishable_XaAFacNNbuAD6hrM3twpMg_K6-QaPYV';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@apolo11.com',
    password: 'apolo11admin'
  });

  if (error) {
    console.error('ERROR AL CREAR:', error.message);
  } else {
    console.log('USUARIO CREADO CON EXITO:', data.user?.email);
  }
}

main();
