import { defineConfig } from 'vite'
import { exec } from 'child_process'
import path from 'path'

const scraperPlugin = () => {
  return {
    name: 'scraper-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/api/run-scraper') && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          // Assuming vite is running in ui/ directory
          const cwd = path.resolve(process.cwd(), '..')
          
          // Parse query string for company parameter
          const urlObj = new URL(req.url, `http://${req.headers.host}`)
          const company = urlObj.searchParams.get('company') || 'all'
          
          exec(`python scraper.py ${company}`, { cwd }, (error, stdout, stderr) => {
            if (error) {
              console.error(`Scraper error: ${error.message}`)
              res.statusCode = 500
              res.end(JSON.stringify({ error: error.message, stderr }))
              return
            }
            res.end(JSON.stringify({ success: true, stdout }))
          })
          return
        }
        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [scraperPlugin()]
})
