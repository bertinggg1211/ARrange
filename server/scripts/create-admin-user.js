require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabase } = require('../db/supabase');

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...');
    
    // Hash the password 'admin'
    const passwordHash = await bcrypt.hash('admin', 10);
    console.log('✅ Password hashed successfully');
    
    // Check if admin user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin')
      .single();
    
    if (existingUser) {
      console.log('⚠️  Admin user already exists. Updating password...');
      
      // Update existing admin user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          role: 'admin',
          full_name: 'Administrator',
          updated_at: new Date().toISOString(),
        })
        .eq('email', 'admin')
        .select();
      
      if (updateError) {
        console.error('❌ Error updating admin user:', updateError);
        process.exit(1);
      }
      
      console.log('✅ Admin user updated successfully');
      console.log('📧 Email: admin');
      console.log('🔑 Password: admin');
      process.exit(0);
    }
    
    // Create new admin user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: 'admin',
        password_hash: passwordHash,
        role: 'admin',
        full_name: 'Administrator',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();
    
    if (insertError) {
      console.error('❌ Error creating admin user:', insertError);
      process.exit(1);
    }
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin');
    console.log('🔑 Password: admin');
    console.log('\n⚠️  IMPORTANT: Please change the admin password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAdminUser();
