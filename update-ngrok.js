#!/usr/bin/env node

/**
 * Script to update ngrok URL across the project
 * Usage: node update-ngrok.js <new-ngrok-url>
 * Example: node update-ngrok.js https://abc123.ngrok.io
 */

const fs = require('fs');
const path = require('path');

const newNgrokUrl = process.argv[2];

if (!newNgrokUrl) {
  console.log('❌ Please provide a new ngrok URL');
  console.log('Usage: node update-ngrok.js <new-ngrok-url>');
  console.log('Example: node update-ngrok.js https://abc123.ngrok.io');
  process.exit(1);
}

// Validate URL format
if (!newNgrokUrl.startsWith('https://') || !newNgrokUrl.includes('ngrok')) {
  console.log('❌ Invalid ngrok URL format. Should be like: https://abc123.ngrok.io');
  process.exit(1);
}

console.log('🔄 Updating ngrok URL to:', newNgrokUrl);

// Files to update
const filesToUpdate = [
  {
    path: 'src/config/serverConfig.js',
    search: /NGROK_CURRENT: '[^']*'/,
    replace: `NGROK_CURRENT: '${newNgrokUrl}'`
  },
  {
    path: 'server/.env',
    search: /API_BASE=.*/,
    replace: `API_BASE=${newNgrokUrl}`
  },
  {
    path: 'ngrok-config.json',
    search: /"currentNgrokUrl": "[^"]*"/,
    replace: `"currentNgrokUrl": "${newNgrokUrl}"`
  }
];

let updatedFiles = 0;

filesToUpdate.forEach(({ path: filePath, search, replace }) => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    if (search.test(content)) {
      content = content.replace(search, replace);
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Updated: ${filePath}`);
      updatedFiles++;
    } else {
      console.log(`⚠️ Pattern not found in: ${filePath}`);
    }
  } catch (error) {
    console.log(`❌ Error updating ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 Updated ${updatedFiles} files with new ngrok URL: ${newNgrokUrl}`);
console.log('\n📝 Next steps:');
console.log('1. Restart your React Native Metro bundler');
console.log('2. Rebuild your APK if needed');
console.log('3. Test the connection in your app using the Server Connection menu');
