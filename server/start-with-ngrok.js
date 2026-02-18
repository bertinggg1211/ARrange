/**
 * Start both the server and ngrok tunnel together
 * Run: node start-with-ngrok.js
 */

const ngrok = require('ngrok');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 5000;

async function startServerAndNgrok() {
  try {
    console.log('🚀 Starting server and ngrok...\n');

    // Start the Express server
    console.log('📦 Starting Express server...');
    const serverProcess = spawn('node', ['index.js'], {
      stdio: 'inherit',
      shell: true
    });

    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Start ngrok tunnel
    console.log('\n🌐 Starting ngrok tunnel...');
    const url = await ngrok.connect(PORT);

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║        ✅ SERVER & NGROK STARTED SUCCESSFULLY!     ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    console.log(`📡 Public URL:  ${url}`);
    console.log(`🔌 Local URL:   http://localhost:${PORT}`);
    console.log(`🌐 Web Interface: http://localhost:4040`);
    console.log('\n📋 NEXT STEPS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n1️⃣  Copy the Public URL above');
    console.log('\n2️⃣  Update src/config/environment.js:');
    console.log(`    API_BASE_URL: '${url}',`);
    console.log(`    SOCKET_URL: '${url}',`);
    console.log(`    IMAGE_BASE_URL: '${url}',`);
    console.log('\n3️⃣  Update src/config/serverConfig.js:');
    console.log(`    NGROK_CURRENT: '${url}',`);
    console.log('\n4️⃣  Change environment to NGROK in environment.js:');
    console.log('    const CURRENT_ENVIRONMENT = ENVIRONMENTS.NGROK;');
    console.log('\n5️⃣  Build APK:');
    console.log('    cd android && gradlew assembleRelease');
    console.log('\n⚠️  IMPORTANT: Keep this terminal open while testing!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Handle cleanup
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down...');
      console.log('   Closing ngrok tunnel...');
      await ngrok.disconnect();
      await ngrok.kill();
      console.log('   Stopping server...');
      serverProcess.kill();
      console.log('✅ Cleanup complete. Goodbye!\n');
      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.message.includes('authtoken')) {
      console.log('\n💡 NGROK AUTHENTICATION REQUIRED:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n1. Sign up at: https://ngrok.com');
      console.log('2. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken');
      console.log('3. Run this command in your terminal:');
      console.log('\n   npx ngrok config add-authtoken YOUR_TOKEN_HERE');
      console.log('\n4. Then try again: node start-with-ngrok.js\n');
    } else if (error.message.includes('EADDRINUSE')) {
      console.log('\n💡 PORT ALREADY IN USE:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\nPort 5000 is already being used by another process.');
      console.log('Please close any running servers and try again.\n');
    }
    
    process.exit(1);
  }
}

startServerAndNgrok();
