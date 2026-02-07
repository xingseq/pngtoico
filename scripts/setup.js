#!/usr/bin/env node
/**
 * Setup script for png-to-ico wrapper
 * Downloads and extracts the png-to-ico library if not present
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createUnzip } from 'zlib';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Configuration
const DOWNLOAD_URL = 'https://github.com/steambap/png-to-ico/archive/refs/heads/main.zip';
const EXTERNAL_DIR = path.join(ROOT_DIR, 'external');
const TARGET_DIR = path.join(EXTERNAL_DIR, 'png-to-ico-main');
const ZIP_FILE = path.join(EXTERNAL_DIR, 'png-to-ico.zip');

/**
 * Download file from URL
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading from ${url}...`);
    
    const file = createWriteStream(destPath);
    
    const request = (url) => {
      https.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          request(response.headers.location);
          return;
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log('Download completed.');
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {}); // Delete the file on error
        reject(err);
      });
    };
    
    request(url);
  });
}

/**
 * Extract zip file using system unzip command or tar
 */
async function extractZip(zipPath, destDir) {
  console.log(`Extracting ${zipPath} to ${destDir}...`);
  
  const platform = process.platform;
  
  try {
    if (platform === 'win32') {
      // Windows: use PowerShell
      await execAsync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`);
    } else {
      // macOS/Linux: use unzip
      await execAsync(`unzip -o "${zipPath}" -d "${destDir}"`);
    }
    console.log('Extraction completed.');
  } catch (error) {
    throw new Error(`Failed to extract zip: ${error.message}`);
  }
}

/**
 * Install png-to-ico dependencies if needed
 */
async function installPngToIcoDependencies() {
  const nodeModulesPath = path.join(TARGET_DIR, 'node_modules');
  
  if (fs.existsSync(nodeModulesPath)) {
    console.log('png-to-ico dependencies already installed.');
    return;
  }
  
  console.log('\nInstalling png-to-ico dependencies...');
  
  try {
    await execAsync('npm install', { cwd: TARGET_DIR });
    console.log('png-to-ico dependencies installed successfully.');
  } catch (error) {
    console.error('Warning: Failed to install png-to-ico dependencies:', error.message);
    console.error('You can manually run: cd external/png-to-ico-main && npm install');
  }
}

/**
 * Main setup function
 */
async function setup() {
  console.log('=== PNG-to-ICO Setup ===\n');
  
  const indexPath = path.join(TARGET_DIR, 'index.js');
  
  // Check if library source exists
  if (fs.existsSync(indexPath)) {
    console.log('png-to-ico library already exists at:', TARGET_DIR);
    // Still need to check and install dependencies
    await installPngToIcoDependencies();
    return;
  }
  
  console.log('png-to-ico library not found. Starting download...\n');
  
  // Create external directory if not exists
  if (!fs.existsSync(EXTERNAL_DIR)) {
    fs.mkdirSync(EXTERNAL_DIR, { recursive: true });
    console.log('Created directory:', EXTERNAL_DIR);
  }
  
  try {
    // Download zip file
    await downloadFile(DOWNLOAD_URL, ZIP_FILE);
    
    // Extract zip file
    await extractZip(ZIP_FILE, EXTERNAL_DIR);
    
    // Clean up zip file
    fs.unlinkSync(ZIP_FILE);
    console.log('Cleaned up temporary files.');
    
    // Verify extraction
    if (!fs.existsSync(indexPath)) {
      throw new Error('Installation verification failed. index.js not found.');
    }
    
    // Install dependencies
    await installPngToIcoDependencies();
    
    console.log('\n=== Setup completed successfully! ===');
    console.log('png-to-ico library installed at:', TARGET_DIR);
    
  } catch (error) {
    console.error('\n=== Setup failed ===');
    console.error('Error:', error.message);
    console.error('\nYou can manually download and extract png-to-ico from:');
    console.error(DOWNLOAD_URL);
    console.error('\nExtract it to:', TARGET_DIR);
    process.exit(1);
  }
}

/**
 * Install UI dependencies if needed
 */
async function installUIDependencies() {
  const uiNodeModules = path.join(ROOT_DIR, 'ui', 'node_modules');
  
  if (fs.existsSync(uiNodeModules)) {
    console.log('UI dependencies already installed.');
    return;
  }
  
  console.log('\nInstalling UI dependencies...');
  
  try {
    const uiDir = path.join(ROOT_DIR, 'ui');
    await execAsync('npm install', { cwd: uiDir });
    console.log('UI dependencies installed successfully.');
  } catch (error) {
    console.error('Warning: Failed to install UI dependencies:', error.message);
    console.error('You can manually run: npm install --prefix ui');
  }
}

// Run setup
setup().then(() => installUIDependencies());
