#!/usr/bin/env node

/**
 * Manual Database Test Runner
 * 
 * This script runs the manual database test as suggested:
 * 1. Inspect Backend Logs
 * 2. Check Message Table Schema  
 * 3. Add Error Logging in API
 * 4. Run Manual DB Test
 */

// Check for environment variables first
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('📝 Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  console.error('💡 Run: node setup-environment.js for help');
  process.exit(1);
}

const { supabase } = require('./db/supabase');

async function runManualDbTest() {
  console.log('🧪 Running Manual Database Test...');
  console.log('🕐 Timestamp:', new Date().toISOString());
  console.log('='.repeat(60));

  try {
    // Test the specific query mentioned in the error
    const specificSellerId = '18a0f468-82b5-4fb2-ab5a-6d5484f7bfbe';
    
    console.log('🔍 Testing query: SELECT * FROM messages WHERE seller_id = ?');
    console.log('🎯 Seller ID:', specificSellerId);
    
    // Step 1: Check if seller exists in users table
    console.log('\n📋 Step 1: Checking if seller exists...');
    const { data: sellerData, error: sellerError } = await supabase
      .from('users')
      .select('id, full_name, role, email')
      .eq('id', specificSellerId);
    
    if (sellerError) {
      console.error('❌ Error checking seller:', sellerError);
      return { success: false, error: 'Cannot check seller existence' };
    }
    
    if (!sellerData || sellerData.length === 0) {
      console.log('⚠️ Seller does not exist in users table');
      console.log('💡 This could be why the foreign key constraint fails');
      return {
        success: false,
        issue: 'SELLER_NOT_FOUND',
        message: 'Seller ID does not exist in users table',
        sellerId: specificSellerId
      };
    }
    
    console.log('✅ Seller exists in users table');
    console.log('👤 Seller details:', JSON.stringify(sellerData[0], null, 2));
    
    // Step 2: Check messages table structure
    console.log('\n📋 Step 2: Checking messages table structure...');
    const { data: messagesStructure, error: structureError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('❌ Error checking messages table structure:', structureError);
      console.error('❌ Error code:', structureError.code);
      console.error('❌ Error message:', structureError.message);
      
      if (structureError.code === 'PGRST116') {
        return {
          success: false,
          issue: 'TABLE_NOT_FOUND',
          message: 'Messages table does not exist',
          solution: 'Run the chat database setup SQL script'
        };
      }
      
      return {
        success: false,
        issue: 'TABLE_STRUCTURE_ERROR',
        message: structureError.message,
        code: structureError.code
      };
    }
    
    console.log('✅ Messages table accessible');
    if (messagesStructure && messagesStructure.length > 0) {
      console.log('📋 Available columns:', Object.keys(messagesStructure[0]));
    }
    
    // Step 3: Run the specific query
    console.log('\n🔍 Step 3: Running specific seller query...');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('seller_id', specificSellerId);
    
    if (messagesError) {
      console.error('❌ Error querying messages for seller:', messagesError);
      console.error('❌ Error code:', messagesError.code);
      console.error('❌ Error message:', messagesError.message);
      console.error('❌ Error details:', JSON.stringify(messagesError, null, 2));
      
      // Check for specific error types
      if (messagesError.message.includes('column') && messagesError.message.includes('does not exist')) {
        return {
          success: false,
          issue: 'COLUMN_NOT_FOUND',
          message: 'seller_id column does not exist in messages table',
          error: messagesError.message,
          solution: 'Check messages table schema - missing seller_id column'
        };
      }
      
      if (messagesError.message.includes('foreign key')) {
        return {
          success: false,
          issue: 'FOREIGN_KEY_ERROR',
          message: 'Foreign key constraint error',
          error: messagesError.message,
          solution: 'Check foreign key relationships in messages table'
        };
      }
      
      return {
        success: false,
        issue: 'QUERY_ERROR',
        message: 'Error querying messages table',
        error: messagesError.message,
        code: messagesError.code
      };
    }
    
    console.log('✅ Query executed successfully');
    console.log('📊 Messages found for seller:', messages?.length || 0);
    
    if (messages && messages.length > 0) {
      console.log('📋 Sample messages:');
      messages.slice(0, 3).forEach((msg, index) => {
        console.log(`  Message ${index + 1}:`, {
          id: msg.id,
          message: msg.message?.substring(0, 50) + '...',
          created_at: msg.created_at,
          buyer_id: msg.buyer_id,
          seller_id: msg.seller_id
        });
      });
    } else {
      console.log('📭 No messages found for this seller');
    }
    
    // Step 4: Check for related data
    console.log('\n🔍 Step 4: Checking for related data...');
    
    // Check if there are any messages with this seller as buyer_id (reverse relationship)
    const { data: reverseMessages, error: reverseError } = await supabase
      .from('messages')
      .select('*')
      .eq('buyer_id', specificSellerId);
    
    if (reverseError) {
      console.log('⚠️ Error checking reverse relationship:', reverseError.message);
    } else {
      console.log('📊 Messages where seller is buyer:', reverseMessages?.length || 0);
    }
    
    // Check total messages in database
    const { data: allMessages, error: allError } = await supabase
      .from('messages')
      .select('id')
      .limit(1000);
    
    if (allError) {
      console.log('⚠️ Error checking total messages:', allError.message);
    } else {
      console.log('📊 Total messages in database:', allMessages?.length || 0);
    }
    
    // Final result
    console.log('\n' + '='.repeat(60));
    console.log('✅ MANUAL DATABASE TEST COMPLETE');
    console.log('📊 Results:');
    console.log('  - Seller exists: ✅', sellerData[0].full_name);
    console.log('  - Messages table: ✅ Accessible');
    console.log('  - Query executed: ✅ Success');
    console.log('  - Messages found:', messages?.length || 0);
    
    return {
      success: true,
      message: 'Manual database test completed successfully',
      results: {
        sellerExists: true,
        sellerName: sellerData[0].full_name,
        messagesTableAccessible: true,
        queryExecuted: true,
        messagesFound: messages?.length || 0,
        sampleMessages: messages?.slice(0, 3) || []
      }
    };

  } catch (error) {
    console.error('❌ CRITICAL ERROR during manual test:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    
    return {
      success: false,
      error: 'Manual test failed',
      message: error.message,
      stack: error.stack
    };
  }
}

// Run if called directly
if (require.main === module) {
  runManualDbTest()
    .then(result => {
      console.log('\n🎯 MANUAL TEST RESULT:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Manual test script failed:', error);
      process.exit(1);
    });
}

module.exports = runManualDbTest;
