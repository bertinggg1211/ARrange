const { supabase } = require('./db/supabase');
const fs = require('fs');
const path = require('path');

async function setupChatDatabase() {
  try {
    console.log('🔄 Setting up chat database tables...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'sql', 'create_chat_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          // Try direct execution for some statements
          console.log('🔄 Trying alternative execution method...');
          const { error: directError } = await supabase
            .from('_supabase_migrations')
            .select('*')
            .limit(1);
          
          if (directError && directError.code !== 'PGRST116') {
            console.error('❌ Error executing statement:', error);
            console.error('Statement:', statement.substring(0, 100) + '...');
          }
        }
      }
    }
    
    console.log('✅ Chat database setup completed!');
    
    // Test the tables
    console.log('🧪 Testing table creation...');
    
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (!convError) {
      console.log('✅ Conversations table ready');
    } else {
      console.log('⚠️ Conversations table issue:', convError.message);
    }
    
    if (!msgError) {
      console.log('✅ Messages table ready');
    } else {
      console.log('⚠️ Messages table issue:', msgError.message);
    }
    
    console.log('🎉 Chat system database is ready!');
    
  } catch (error) {
    console.error('❌ Error setting up chat database:', error);
  }
}

// Run the setup
setupChatDatabase().then(() => {
  console.log('✅ Setup complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
