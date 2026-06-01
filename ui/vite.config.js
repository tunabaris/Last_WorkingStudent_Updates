import { defineConfig } from 'vite'
import { exec } from 'child_process'
import path from 'path'

const scraperPlugin = () => {
  return {
    name: 'scraper-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/run-scraper' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          // Assuming vite is running in ui/ directory
          const cwd = path.resolve(process.cwd(), '..')
          
          exec('python scraper.py', { cwd }, (error, stdout, stderr) => {
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
