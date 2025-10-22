#!/usr/bin/env node

/**
 * Apply Schema Fix Script
 * 
 * This script applies the schema fix to the messages table
 */

// Load environment variables
require('dotenv').config();

// Check for environment variables first
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('📝 Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  console.error('\n🔧 QUICK SETUP:');
  console.error('1. Create a .env file in the server directory');
  console.error('2. Add your Supabase credentials');
  console.error('3. Run this script again');
  process.exit(1);
}

const { supabase } = require('./db/supabase');
const fs = require('fs');
const path = require('path');

async function applySchemaFix() {
  console.log('🔧 Applying schema fix to messages table...');
  console.log('🕐 Timestamp:', new Date().toISOString());
  console.log('='.repeat(60));

  try {
    // Read the SQL fix script
    const sqlPath = path.join(__dirname, 'fix-messages-schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL fix script loaded');
    console.log('🔍 SQL content preview:');
    console.log(sqlContent.split('\n').slice(0, 10).join('\n') + '...');
    
    console.log('\n⚠️  IMPORTANT: This will modify your database schema!');
    console.log('📋 The following changes will be made:');
    console.log('  - Add created_at column (alias for timestamp)');
    console.log('  - Add sender_type column');
    console.log('  - Add product_data column');
    console.log('  - Create performance indexes');
    
    console.log('\n🚀 Applying schema fix...');
    
    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error applying schema fix:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      // Try alternative approach - execute SQL directly
      console.log('\n🔄 Trying alternative approach...');
      
      // Add created_at column
      console.log('📝 Adding created_at column...');
      const { error: createdAtError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;'
      });
      
      if (createdAtError) {
        console.log('⚠️ created_at column might already exist:', createdAtError.message);
      } else {
        console.log('✅ created_at column added');
      }
      
      // Update created_at from timestamp
      console.log('📝 Updating created_at from timestamp...');
      const { error: updateError } = await supabase.rpc('exec_sql', {
        sql: 'UPDATE messages SET created_at = timestamp WHERE created_at IS NULL;'
      });
      
      if (updateError) {
        console.log('⚠️ Update error:', updateError.message);
      } else {
        console.log('✅ created_at values updated');
      }
      
      // Add sender_type column
      console.log('📝 Adding sender_type column...');
      const { error: senderTypeError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_type VARCHAR(10) CHECK (sender_type IN (\'buyer\', \'seller\'));'
      });
      
      if (senderTypeError) {
        console.log('⚠️ sender_type column might already exist:', senderTypeError.message);
      } else {
        console.log('✅ sender_type column added');
      }
      
      // Update sender_type based on sender_id
      console.log('📝 Updating sender_type values...');
      const { error: updateSenderError } = await supabase.rpc('exec_sql', {
        sql: 'UPDATE messages SET sender_type = \'buyer\' WHERE sender_id = buyer_id;'
      });
      
      if (updateSenderError) {
        console.log('⚠️ Update sender_type error:', updateSenderError.message);
      } else {
        console.log('✅ sender_type values updated for buyers');
      }
      
      const { error: updateSellerError } = await supabase.rpc('exec_sql', {
        sql: 'UPDATE messages SET sender_type = \'seller\' WHERE sender_id = seller_id;'
      });
      
      if (updateSellerError) {
        console.log('⚠️ Update seller sender_type error:', updateSellerError.message);
      } else {
        console.log('✅ sender_type values updated for sellers');
      }
      
      // Add product_data column
      console.log('📝 Adding product_data column...');
      const { error: productDataError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE messages ADD COLUMN IF NOT EXISTS product_data JSONB;'
      });
      
      if (productDataError) {
        console.log('⚠️ product_data column might already exist:', productDataError.message);
      } else {
        console.log('✅ product_data column added');
      }
      
    } else {
      console.log('✅ Schema fix applied successfully');
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying schema fix...');
    const { data: messages, error: verifyError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      console.error('❌ Error verifying schema:', verifyError);
      return { success: false, error: verifyError.message };
    }
    
    if (messages && messages.length > 0) {
      console.log('📋 Updated columns:', Object.keys(messages[0]));
      
      const hasCreatedAt = messages[0].created_at !== undefined;
      const hasSenderType = messages[0].sender_type !== undefined;
      const hasProductData = messages[0].product_data !== undefined;
      
      console.log('✅ Schema verification:');
      console.log('  - created_at column:', hasCreatedAt ? '✅ Present' : '❌ Missing');
      console.log('  - sender_type column:', hasSenderType ? '✅ Present' : '❌ Missing');
      console.log('  - product_data column:', hasProductData ? '✅ Present' : '❌ Missing');
      
      if (hasCreatedAt && hasSenderType && hasProductData) {
        console.log('\n🎉 SCHEMA FIX COMPLETE!');
        console.log('✅ All required columns are now present');
        console.log('🚀 Chat functionality should now work properly');
        
        return { success: true, message: 'Schema fix applied successfully' };
      } else {
        console.log('\n⚠️ Some columns are still missing');
        console.log('💡 You may need to run the SQL script manually in Supabase dashboard');
        
        return { success: false, message: 'Some columns are still missing' };
      }
    } else {
      console.log('📭 No messages found to verify schema');
      return { success: true, message: 'Schema fix applied (no data to verify)' };
    }
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR applying schema fix:', error);
    console.error('❌ Error stack:', error.stack);
    
    return {
      success: false,
      error: 'Schema fix failed',
      message: error.message,
      stack: error.stack
    };
  }
}

// Run if called directly
if (require.main === module) {
  applySchemaFix()
    .then(result => {
      console.log('\n🎯 SCHEMA FIX RESULT:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Schema fix script failed:', error);
      process.exit(1);
    });
}

module.exports = applySchemaFix;
