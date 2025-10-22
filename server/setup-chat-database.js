const { supabase } = require('./db/supabase');
const fs = require('fs');
const path = require('path');

async function setupChatDatabase() {
  try {
    console.log('🔧 Setting up chat database tables...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'sql', 'create_chat_tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executing chat tables SQL...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });
    
    if (error) {
      console.error('❌ Error creating chat tables:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Chat database tables created successfully!');
    
    // Test the tables
    console.log('🧪 Testing tables...');
    
    // Test conversations table
    const { data: convTest, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (convError) {
      console.error('❌ Conversations table test failed:', convError);
    } else {
      console.log('✅ Conversations table is working');
    }
    
    // Test messages table
    const { data: msgTest, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (msgError) {
      console.error('❌ Messages table test failed:', msgError);
    } else {
      console.log('✅ Messages table is working');
    }
    
    return { success: true, message: 'Chat database setup completed' };
    
  } catch (error) {
    console.error('❌ Setup error:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  setupChatDatabase()
    .then(result => {
      console.log('Setup result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupChatDatabase;
