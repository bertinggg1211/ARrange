#!/usr/bin/env node

/**
 * Quick Setup Script for Chat Diagnostics
 * 
 * This script helps you set up the environment and run diagnostics
 */

const { setupEnvironment } = require('./setup-environment');

async function quickSetup() {
  console.log('🚀 Quick Setup for Chat Diagnostics');
  console.log('='.repeat(60));

  try {
    // Step 1: Check environment setup
    console.log('🔧 Step 1: Checking environment setup...');
    const isSetup = setupEnvironment();
    
    if (!isSetup) {
      console.log('\n❌ Environment not set up yet');
      console.log('📝 Please follow the instructions above to set up your .env file');
      console.log('🔄 Run this script again after setting up the environment');
      return;
    }

    console.log('\n✅ Environment is ready!');
    console.log('🚀 Running chat diagnostics...');
    console.log('='.repeat(60));

    // Step 2: Run diagnostics
    const { exec } = require('child_process');
    
    exec('node run-chat-diagnostics.js', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error running diagnostics:', error.message);
        return;
      }
      
      if (stderr) {
        console.error('⚠️ Warnings:', stderr);
      }
      
      console.log(stdout);
    });

  } catch (error) {
    console.error('❌ Quick setup failed:', error.message);
    console.error('💡 Please run: node setup-environment.js for manual setup');
  }
}

// Run if called directly
if (require.main === module) {
  quickSetup();
}

module.exports = quickSetup;
