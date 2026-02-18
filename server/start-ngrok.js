/**
 * Start ngrok tunnel for the server
 * Run: node start-ngrok.js
 */

const ngrok = require('ngrok');

const PORT = process.env.PORT || 5000;

async function startNgrok() {
  try {
    console.log('🚀 Starting ngrok tunnel...');
    
    // Start ngrok
    const url = await ngrok.connect(PORT);

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║           🌐 NGROK TUNNEL STARTED!                 ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    console.log(`📡 Public URL: ${url}`);
    console.log(`🔌 Local Port: ${PORT}`);
    console.log('\n📋 TODO: Update these files with the URL above:');
    console.log('   1. src/config/environment.js (line 27-29)');
    console.log('   2. src/config/serverConfig.js (line 11)');
    console.log('\n⚠️  Keep this terminal open while testing!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Closing ngrok tunnel...');
      await ngrok.disconnect();
      await ngrok.kill();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error starting ngrok:', error.message);
    
    if (error.message.includes('authtoken')) {
      console.log('\n💡 TIP: You need to authenticate ngrok first!');
      console.log('   1. Sign up at https://ngrok.com');
      console.log('   2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken');
      console.log('   3. Run: npx ngrok config add-authtoken YOUR_TOKEN_HERE\n');
    }
    
    process.exit(1);
  }
}

startNgrok();
