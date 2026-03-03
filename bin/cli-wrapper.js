#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

// Get the external path dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const EXTERNAL_PATH = path.join(ROOT_DIR, 'external', 'png-to-ico-main');

function parseArgs(args) {
  const result = { _: [], output: null, help: false, sizes: [] };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-o' || arg === '--output') {
      result.output = args[++i];
    } else if (arg === '-s' || arg === '--sizes') {
      const sizeStr = args[++i];
      result.sizes = sizeStr.split(',').map(s => parseInt(s.trim()));
    } else if (arg === '-h' || arg === '--help') {
      result.help = true;
    } else if (!arg.startsWith('-')) {
      result._.push(arg);
    }
  }
  return result;
}

const argv = parseArgs(process.argv.slice(2));

async function main() {
  if (argv.help || argv._.length === 0) {
    console.log('PNG to ICO - Convert PNG to Windows ICO\n\nUsage: png-to-ico <input.png> [-o <output.ico>] [-s <size1,size2,...>]\n\nOptions:\n  -o, --output   Output file path\n  -s, --sizes    Comma-separated list of sizes (e.g., "256,128,64,32,16")\n  -h, --help     Show help\n\nExamples:\n  png-to-co input.png\n  png-to-ico input.png -o output.ico\n  png-to-ico input.png -s 256,128,64\n  png-to-ico input.png -s 256,128,64,32,16 -o custom.ico');
    process.exit(argv.help ? 0 : 1);
  }

  const inputPath = path.resolve(argv._[0]);
  if (!fs.existsSync(inputPath)) {
    console.error(JSON.stringify({ success: false, error: 'File not found: ' + inputPath }));
    process.exit(1);
  }

  try {
    const moduleUrl = pathToFileURL(path.join(EXTERNAL_PATH, 'index.js')).href;
    const { imagesToIco } = await import(moduleUrl);
    const { readPNG, resize } = await import(pathToFileURL(path.join(EXTERNAL_PATH, 'lib/png.js')).href);
    
    const png = await readPNG(inputPath);
    
    // Validate image is square
    if (png.width !== png.height) {
      throw new Error('Please give me a square PNG image.');
    }
    
    // Use custom sizes or default sizes
    let sizes = argv.sizes.length > 0 ? argv.sizes : [256, 48, 32, 16];
    
    // Validate sizes
    sizes = sizes.filter(size => size > 0 && size <= 256);
    if (sizes.length === 0) {
      throw new Error('No valid sizes provided (must be 1-256)');
    }
    
    // Sort sizes in descending order (largest first)
    sizes.sort((a, b) => b - a);
    
    // Ensure 256 is included if not already (for best quality)
    if (!sizes.includes(256) && png.width !== 256) {
      console.warn('Note: Adding 256x256 size for better quality scaling');
      sizes.unshift(256);
    }
    
    console.log(`Converting with sizes: ${sizes.join('x')}, ${sizes.join('x')}`);
    
    // Generate resized images
    const images = await Promise.all(
      sizes.map(size => resize(png, size, size, 'bicubicInterpolation'))
    );
    
    const buf = imagesToIco(images);
    let outputPath = argv.output ? path.resolve(argv.output) : path.join(path.dirname(inputPath), path.basename(inputPath, '.png') + '.ico');
    fs.writeFileSync(outputPath, buf);
    
    console.log(JSON.stringify({ 
      success: true, 
      inputPath, 
      outputPath, 
      size: buf.length, 
      sizes: sizes,
      message: `Converted ${path.basename(inputPath)} to ${path.basename(outputPath)} with sizes: ${sizes.join(', ')}` 
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ success: false, error: error.message }));
    process.exit(1);
  }
}

main();