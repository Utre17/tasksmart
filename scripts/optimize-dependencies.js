#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Paths
const rootDir = path.resolve(__dirname, '..');
const currentPackageJsonPath = path.join(rootDir, 'package.json');
const optimizedPackageJsonPath = path.join(rootDir, 'package.json.optimized');
const backupPath = path.join(rootDir, 'package.json.backup');

// Backup current package.json
console.log('📦 Backing up current package.json...');
try {
  fs.copyFileSync(currentPackageJsonPath, backupPath);
  console.log('✅ Backup created at package.json.backup');
} catch (error) {
  console.error('❌ Failed to create backup:', error.message);
  process.exit(1);
}

// Replace with optimized version
console.log('📦 Replacing with optimized package.json...');
try {
  fs.copyFileSync(optimizedPackageJsonPath, currentPackageJsonPath);
  console.log('✅ Package.json replaced with optimized version');
} catch (error) {
  console.error('❌ Failed to replace package.json:', error.message);
  
  // Restore backup if replacement fails
  console.log('🔄 Restoring backup...');
  fs.copyFileSync(backupPath, currentPackageJsonPath);
  console.log('✅ Backup restored');
  
  process.exit(1);
}

// Run npm install to update node_modules
console.log('📦 Running npm install to update dependencies...');
const npmInstall = spawn('npm', ['install'], {
  cwd: rootDir,
  stdio: 'inherit'
});

npmInstall.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Dependencies optimized successfully!');
    console.log('📝 To restore the original package.json, run:');
    console.log('   mv package.json.backup package.json && npm install');
  } else {
    console.error(`❌ npm install exited with code ${code}`);
    console.log('🔄 You may want to restore the backup manually:');
    console.log('   mv package.json.backup package.json && npm install');
  }
}); 