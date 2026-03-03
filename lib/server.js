/**
 * PNG to ICO API Server
 */

import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { pathToFileURL, fileURLToPath } from 'url'
import os from 'os'
import fs from 'fs'

// Get the external path dynamically
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const EXTERNAL_PATH = path.join(ROOT_DIR, 'external', 'png-to-ico-main')

const app = express()
app.use(cors())

const upload = multer({ 
  dest: os.tmpdir(),
  limits: { fileSize: 10 * 1024 * 1024 }
})

// ICO parsing function
async function parseIcoFile(filePath) {
  const buffer = await fs.promises.readFile(filePath)
  
  // Check minimum size: 6 bytes header
  if (buffer.length < 6) {
    throw new Error('File too small to be a valid ICO')
  }
  
  const reserved = buffer.readUInt16LE(0)
  const type = buffer.readUInt16LE(2)
  const numImages = buffer.readUInt16LE(4)
  
  if (reserved !== 0) {
    throw new Error('Invalid ICO file: reserved field must be 0')
  }
  if (type !== 1 && type !== 2) {
    throw new Error('Invalid ICO file: type must be 1 (ICO) or 2 (CUR)')
  }
  if (numImages === 0) {
    throw new Error('ICO file contains no images')
  }
  
  const headerSize = 6
  const entrySize = 16
  const totalHeaderSize = headerSize + numImages * entrySize
  
  if (buffer.length < totalHeaderSize) {
    throw new Error('File truncated or corrupt')
  }
  
  const sizes = []
  
  for (let i = 0; i < numImages; i++) {
    const entryOffset = headerSize + i * entrySize
    
    let width = buffer.readUInt8(entryOffset)
    let height = buffer.readUInt8(entryOffset + 1)
    // colorCount = buffer.readUInt8(entryOffset + 2)
    // reserved = buffer.readUInt8(entryOffset + 3)
    // colorPlanes = buffer.readUInt16LE(entryOffset + 4)
    // bitsPerPixel = buffer.readUInt16LE(entryOffset + 6)
    // imageSize = buffer.readUInt32LE(entryOffset + 8)
    // imageOffset = buffer.readUInt32LE(entryOffset + 12)
    
    // Width and height of 0 represent 256 pixels
    if (width === 0) width = 256
    if (height === 0) height = 256
    
    sizes.push({ width, height })
  }
  
  return sizes
}

app.post('/api/convert', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }
  
  try {
    const moduleUrl = pathToFileURL(path.join(EXTERNAL_PATH, 'index.js')).href
    const pngToIco = (await import(moduleUrl)).default
    
    const inputPath = req.file.path
    const buf = await pngToIco(inputPath)
    
    fs.unlinkSync(inputPath)
    
    res.setHeader('Content-Type', 'image/x-icon')
    res.setHeader('Content-Disposition', 'attachment; filename="converted.ico"')
    res.send(buf)
  } catch (error) {
    console.error('Convert error:', error)
    res.status(500).json({ error: error.message })
  }
})

// New endpoint for ICO analysis
app.post('/api/analyze-ico', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }
  
  try {
    const sizes = await parseIcoFile(req.file.path)
    
    // Clean up temp file
    fs.unlinkSync(req.file.path)
    
    res.json({
      success: true,
      filename: req.file.originalname,
      numImages: sizes.length,
      sizes: sizes
    })
  } catch (error) {
    console.error('ICO analysis error:', error)
    res.status(500).json({ error: error.message })
  }
})

const PORT = process.env.PORT || 5180
app.listen(PORT, () => {
  console.log(`PNG-to-ICO API server running on http://localhost:${PORT}`)
})