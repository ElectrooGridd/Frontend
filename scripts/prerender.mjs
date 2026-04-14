// Prerender public routes to static HTML for SEO.
// Usage: npm run build:seo  (runs vite build, then this script)
//
// Why this exists: Google renders JS, but Bing/social previewers often don't.
// Prerendering gives them real HTML to read and shaves ~300ms off LCP.

import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { join, dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dirname, '..', 'dist')
const PORT = 4179
const ROUTES = ['/', '/get-started']

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
}

function startServer() {
  return new Promise((resolveStart) => {
    const server = createServer(async (req, res) => {
      try {
        const url = decodeURIComponent(req.url.split('?')[0])
        let file = join(DIST, url)
        if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
        if (!existsSync(file)) file = join(DIST, 'index.html')
        const data = await readFile(file)
        res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' })
        res.end(data)
      } catch (err) {
        res.writeHead(500)
        res.end(String(err))
      }
    })
    server.listen(PORT, () => resolveStart(server))
  })
}

async function main() {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('dist/index.html not found — run `vite build` first.')
    process.exit(1)
  }

  const server = await startServer()
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  for (const route of ROUTES) {
    console.log(`→ prerendering ${route}`)
    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle', timeout: 30000 })
    // Wait for preloader to vanish (signals React mounted)
    await page.waitForFunction(() => !document.getElementById('preloader'), { timeout: 10000 }).catch(() => {})
    // Small settle for lazy chunks
    await page.waitForTimeout(500)

    const html = await page.content()
    const outPath = route === '/' ? join(DIST, 'index.html') : join(DIST, route.replace(/^\//, ''), 'index.html')
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, html, 'utf8')
    console.log(`  ✓ ${outPath.replace(DIST, 'dist')}`)
  }

  await browser.close()
  server.close()
  console.log('prerender complete.')
}

main().catch((err) => {
  console.error('prerender failed:', err)
  process.exit(1)
})
