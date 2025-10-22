const { supabase } = require('./db/supabase');

async function checkMessagesSchema() {
  try {
    console.log('🔍 Checking messages table schema...');
    
    // Try to get the table structure by selecting from it
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing messages table:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      if (error.code === 'PGRST116') {
        console.log('📝 Messages table does not exist');
        return { success: false, message: 'Messages table does not exist' };
      }
      
      return { success: false, error: error.message };
    }
    
    console.log('✅ Messages table exists');
    console.log('📊 Sample data:', data);
    
    if (data && data.length > 0) {
      console.log('📋 Available columns:', Object.keys(data[0]));
    } else {
      console.log('📋 Table is empty, but exists');
    }
    
    return { success: true, data: data };
    
  } catch (error) {
    console.error('❌ Schema check error:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  checkMessagesSchema()
    .then(result => {
      console.log('Schema check result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Schema check failed:', error);
      process.exit(1);
    });
}

module.exports = checkMessagesSchema;
