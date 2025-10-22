const fs = require('fs');
const path = require('path');

const glbFilePath = path.join(__dirname, 'src', 'data', 'TEST1.glb');

console.log('🔄 Converting TEST1.glb to base64...');
console.log('📁 File path:', glbFilePath);

fs.readFile(glbFilePath, (err, data) => {
  if (err) {
    console.error('❌ Error reading GLB file:', err);
    return;
  }
  
  const base64String = data.toString('base64');
  console.log('✅ GLB file converted to base64 successfully!');
  console.log('📊 Base64 length:', base64String.length);
  console.log('📊 File size:', data.length, 'bytes');
  
  // Create the data URI
  const dataUri = `data:model/gltf-binary;base64,${base64String}`;
  
  console.log('\n🎯 Copy this data URI to use in your TryAR component:');
  console.log('================================================================================');
  console.log(dataUri);
  console.log('================================================================================');
  
  // Also save to a file for easy copying
  const outputFile = path.join(__dirname, 'TEST1_GLB_BASE64.txt');
  fs.writeFileSync(outputFile, dataUri);
  console.log(`\n💾 Data URI also saved to: ${outputFile}`);
});

