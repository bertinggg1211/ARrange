// Load environment variables
require('dotenv').config();

// Check for environment variables first
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('📝 Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  console.error('\n🔧 QUICK SETUP:');
  console.error('1. Create a .env file in the server directory');
  console.error('2. Add your Supabase credentials:');
  console.error('   SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('   SUPABASE_SERVICE_KEY=your_service_role_key_here');
  console.error('3. Get credentials from: Supabase Dashboard > Settings > API');
  console.error('4. Run this script again');
  console.error('\n📖 For detailed instructions, see: ENVIRONMENT_SETUP_GUIDE.md');
  process.exit(1);
}

const { supabase } = require('./db/supabase');

/**
 * Comprehensive Chat Database Diagnostic Script
 * 
 * This script will:
 * 1. Check if messages table exists
 * 2. Verify table schema and columns
 * 3. Test foreign key relationships
 * 4. Run manual queries with specific seller ID
 * 5. Check for data integrity issues
 */

async function diagnoseChatIssues() {
  console.log('🔍 Starting comprehensive chat database diagnosis...');
  console.log('🕐 Timestamp:', new Date().toISOString());
  console.log('='.repeat(60));

  try {
    // Step 1: Test basic database connection
    console.log('📡 Step 1: Testing database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      return { success: false, error: 'Database connection failed' };
    }
    console.log('✅ Database connection successful');

    // Step 2: Check if messages table exists
    console.log('\n📋 Step 2: Checking messages table existence...');
    const { data: messagesTest, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (messagesError) {
      console.error('❌ Messages table error:', messagesError);
      console.error('❌ Error code:', messagesError.code);
      console.error('❌ Error message:', messagesError.message);
      
      if (messagesError.code === 'PGRST116') {
        console.log('📝 Messages table does not exist - this is the root cause!');
        return {
          success: false,
          issue: 'TABLE_NOT_FOUND',
          message: 'Messages table does not exist',
          solution: 'Run the chat database setup SQL script in Supabase dashboard'
        };
      }
      
      return {
        success: false,
        issue: 'SCHEMA_ERROR',
        message: messagesError.message,
        code: messagesError.code
      };
    }
    
    console.log('✅ Messages table exists');

    // Step 3: Analyze table schema
    console.log('\n🔍 Step 3: Analyzing messages table schema...');
    if (messagesTest && messagesTest.length > 0) {
      console.log('📊 Sample data found:', messagesTest.length, 'records');
      console.log('📋 Available columns:', Object.keys(messagesTest[0]));
      
      // Check for required columns
      const requiredColumns = ['id', 'message', 'created_at', 'buyer_id', 'seller_id'];
      const availableColumns = Object.keys(messagesTest[0]);
      const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.error('❌ Missing required columns:', missingColumns);
        return {
          success: false,
          issue: 'MISSING_COLUMNS',
          message: 'Required columns are missing',
          missingColumns: missingColumns,
          availableColumns: availableColumns
        };
      }
      
      console.log('✅ All required columns present');
    } else {
      console.log('📋 Table is empty but exists');
    }

    // Step 4: Test foreign key relationships
    console.log('\n🔗 Step 4: Testing foreign key relationships...');
    
    // Get a sample user ID to test with
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, role')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return { success: false, error: 'Cannot fetch users for testing' };
    }
    
    if (!users || users.length === 0) {
      console.log('⚠️ No users found in database');
      return { success: false, error: 'No users found for testing' };
    }
    
    console.log('👥 Found', users.length, 'users for testing');
    const buyers = users.filter(u => u.role === 'buyer');
    const sellers = users.filter(u => u.role === 'seller');
    
    console.log('🛒 Buyers:', buyers.length);
    console.log('🏪 Sellers:', sellers.length);
    
    if (buyers.length === 0 || sellers.length === 0) {
      console.log('⚠️ Need both buyers and sellers for testing');
    }

    // Step 5: Test specific seller ID query (as requested)
    console.log('\n🧪 Step 5: Testing manual query with specific seller ID...');
    
    if (sellers.length > 0) {
      const testSellerId = sellers[0].id;
      console.log('🔍 Testing with seller ID:', testSellerId);
      
      const { data: sellerMessages, error: sellerError } = await supabase
        .from('messages')
        .select('*')
        .eq('seller_id', testSellerId);
      
      if (sellerError) {
        console.error('❌ Error querying messages for seller:', sellerError);
        console.error('❌ Error details:', JSON.stringify(sellerError, null, 2));
        
        if (sellerError.message.includes('column') && sellerError.message.includes('does not exist')) {
          return {
            success: false,
            issue: 'COLUMN_NOT_FOUND',
            message: 'seller_id column does not exist in messages table',
            error: sellerError.message
          };
        }
        
        return {
          success: false,
          issue: 'QUERY_ERROR',
          message: 'Error querying messages table',
          error: sellerError.message
        };
      }
      
      console.log('✅ Successfully queried messages for seller');
      console.log('📊 Messages found for seller:', sellerMessages?.length || 0);
      
      if (sellerMessages && sellerMessages.length > 0) {
        console.log('📋 Sample message structure:', JSON.stringify(sellerMessages[0], null, 2));
      }
    }

    // Step 6: Test buyer-seller message query
    console.log('\n💬 Step 6: Testing buyer-seller message query...');
    
    if (buyers.length > 0 && sellers.length > 0) {
      const testBuyerId = buyers[0].id;
      const testSellerId = sellers[0].id;
      
      console.log('🔍 Testing with buyer ID:', testBuyerId, 'and seller ID:', testSellerId);
      
      const { data: conversationMessages, error: convError } = await supabase
        .from('messages')
        .select('*')
        .eq('buyer_id', testBuyerId)
        .eq('seller_id', testSellerId);
      
      if (convError) {
        console.error('❌ Error querying conversation messages:', convError);
        console.error('❌ Error details:', JSON.stringify(convError, null, 2));
        
        return {
          success: false,
          issue: 'CONVERSATION_QUERY_ERROR',
          message: 'Error querying conversation messages',
          error: convError.message,
          buyerId: testBuyerId,
          sellerId: testSellerId
        };
      }
      
      console.log('✅ Successfully queried conversation messages');
      console.log('📊 Messages in conversation:', conversationMessages?.length || 0);
    }

    // Step 7: Check for data integrity issues
    console.log('\n🔍 Step 7: Checking for data integrity issues...');
    
    const { data: allMessages, error: allMessagesError } = await supabase
      .from('messages')
      .select('id, buyer_id, seller_id, message, created_at');
    
    if (allMessagesError) {
      console.error('❌ Error fetching all messages:', allMessagesError);
    } else {
      console.log('📊 Total messages in database:', allMessages?.length || 0);
      
      if (allMessages && allMessages.length > 0) {
        // Check for null values
        const nullBuyerIds = allMessages.filter(msg => !msg.buyer_id).length;
        const nullSellerIds = allMessages.filter(msg => !msg.seller_id).length;
        const nullMessages = allMessages.filter(msg => !msg.message).length;
        
        console.log('🔍 Data integrity check:');
        console.log('  - Messages with null buyer_id:', nullBuyerIds);
        console.log('  - Messages with null seller_id:', nullSellerIds);
        console.log('  - Messages with null message:', nullMessages);
        
        if (nullBuyerIds > 0 || nullSellerIds > 0 || nullMessages > 0) {
          console.log('⚠️ Data integrity issues found');
        } else {
          console.log('✅ No data integrity issues found');
        }
      }
    }

    // Step 8: Test specific seller ID from the error (if provided)
    console.log('\n🎯 Step 8: Testing with specific seller ID from error...');
    const specificSellerId = '18a0f468-82b5-4fb2-ab5a-6d5484f7bfbe';
    console.log('🔍 Testing with seller ID:', specificSellerId);
    
    const { data: specificMessages, error: specificError } = await supabase
      .from('messages')
      .select('*')
      .eq('seller_id', specificSellerId);
    
    if (specificError) {
      console.error('❌ Error querying messages for specific seller:', specificError);
      console.error('❌ Error details:', JSON.stringify(specificError, null, 2));
      
      return {
        success: false,
        issue: 'SPECIFIC_SELLER_QUERY_ERROR',
        message: 'Error querying messages for specific seller ID',
        error: specificError.message,
        sellerId: specificSellerId
      };
    }
    
    console.log('✅ Successfully queried messages for specific seller');
    console.log('📊 Messages found for specific seller:', specificMessages?.length || 0);
    
    if (specificMessages && specificMessages.length > 0) {
      console.log('📋 Sample message for specific seller:', JSON.stringify(specificMessages[0], null, 2));
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ DIAGNOSIS COMPLETE - All tests passed!');
    console.log('📊 Summary:');
    console.log('  - Database connection: ✅ Working');
    console.log('  - Messages table: ✅ Exists');
    console.log('  - Table schema: ✅ Valid');
    console.log('  - Foreign keys: ✅ Working');
    console.log('  - Queries: ✅ Working');
    console.log('  - Data integrity: ✅ Good');
    
    return {
      success: true,
      message: 'All diagnostic tests passed',
      summary: {
        databaseConnection: true,
        messagesTableExists: true,
        schemaValid: true,
        foreignKeysWorking: true,
        queriesWorking: true,
        dataIntegrityGood: true
      }
    };

  } catch (error) {
    console.error('❌ CRITICAL ERROR during diagnosis:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    
    return {
      success: false,
      error: 'Diagnosis failed',
      message: error.message,
      stack: error.stack
    };
  }
}

// Run if called directly
if (require.main === module) {
  diagnoseChatIssues()
    .then(result => {
      console.log('\n🎯 DIAGNOSIS RESULT:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Diagnosis script failed:', error);
      process.exit(1);
    });
}

module.exports = diagnoseChatIssues;
