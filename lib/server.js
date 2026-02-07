/**
 * PNG to ICO API Server
 */

import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { pathToFileURL } from 'url'
import os from 'os'
import fs from 'fs'

const EXTERNAL_PATH = 'C:\\Users\\nmlsz\\Dev\\demo\\work\\png-to-ico-main'

const app = express()
app.use(cors())

const upload = multer({ 
  dest: os.tmpdir(),
  limits: { fileSize: 10 * 1024 * 1024 }
})

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

const PORT = process.env.PORT || 5180
app.listen(PORT, () => {
  console.log(`PNG-to-ICO API server running on http://localhost:${PORT}`)
})