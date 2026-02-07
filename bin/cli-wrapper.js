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
  const result = { _: [], output: null, help: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-o' || arg === '--output') {
      result.output = args[++i];
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
    console.log('PNG to ICO - Convert PNG to Windows ICO\n\nUsage: png-to-ico <input.png> [-o <output.ico>]\n\nOptions:\n  -o, --output   Output file path\n  -h, --help     Show help');
    process.exit(argv.help ? 0 : 1);
  }

  const inputPath = path.resolve(argv._[0]);
  if (!fs.existsSync(inputPath)) {
    console.error(JSON.stringify({ success: false, error: 'File not found: ' + inputPath }));
    process.exit(1);
  }

  try {
    const moduleUrl = pathToFileURL(path.join(EXTERNAL_PATH, 'index.js')).href;
    const pngToIco = (await import(moduleUrl)).default;
    const buf = await pngToIco(inputPath);
    let outputPath = argv.output ? path.resolve(argv.output) : path.join(path.dirname(inputPath), path.basename(inputPath, '.png') + '.ico');
    fs.writeFileSync(outputPath, buf);
    console.log(JSON.stringify({ success: true, inputPath, outputPath, size: buf.length, message: 'Converted ' + path.basename(inputPath) + ' to ' + path.basename(outputPath) }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ success: false, error: error.message }));
    process.exit(1);
  }
}

main();