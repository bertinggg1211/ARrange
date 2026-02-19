require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabase } = require('../db/supabase');

async function testAdminLogin() {
  try {
    console.log('🔍 Testing admin login...');
    
    // Fetch admin user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin')
      .single();
    
    if (error) {
      console.error('❌ Error fetching admin user:', error);
      process.exit(1);
    }
    
    if (!user) {
      console.error('❌ Admin user not found');
      process.exit(1);
    }
    
    console.log('✅ Admin user found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Full Name:', user.full_name);
    
    // Test password
    const passwordMatch = await bcrypt.compare('admin', user.password_hash);
    
    if (passwordMatch) {
      console.log('✅ Password verification: SUCCESS');
      console.log('\n🎉 Admin login credentials are working!');
      console.log('📧 Email: admin');
      console.log('🔑 Password: admin');
    } else {
      console.log('❌ Password verification: FAILED');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAdminLogin();
