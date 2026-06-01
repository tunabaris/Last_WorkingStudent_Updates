import './style.css'
import Papa from 'papaparse'

const jobsGrid = document.getElementById('jobsGrid')
const searchInput = document.getElementById('searchInput')
const jobCount = document.getElementById('jobCount')
const refreshBtn = document.getElementById('refreshBtn')
const mainTitle = document.getElementById('mainTitle')
const tabBtns = document.querySelectorAll('.tab-btn')

let allJobs = []
let currentCompany = 'sap'

async function init() {
  try {
    const csvFile = currentCompany === 'sap' ? '/sap_filtered_jobs.csv' : '/teamviewer_filtered_jobs.csv'
    const response = await fetch(csvFile)
    const csvText = await response.text()
    
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        allJobs = results.data
        renderJobs(allJobs)
      }
    })
  } catch (error) {
    jobsGrid.innerHTML = `<p style="color: #ef4444;">Error loading jobs: ${error.message}</p>`
    jobCount.textContent = 'Error'
  }
}

function renderJobs(jobs) {
  jobCount.textContent = `Showing ${jobs.length} job${jobs.length !== 1 ? 's' : ''}`
  
  if (jobs.length === 0) {
    jobsGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 3rem;">No jobs found matching your criteria.</div>`
    return
  }
  
  jobsGrid.innerHTML = jobs.map(job => {
    let bannerHtml = ''
    let cardClass = 'job-card'
    
    if (job['Status'] === 'New') {
      bannerHtml = `<div class="status-banner status-new">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        Recently Added
      </div>`
    } else if (job['Status'] === 'Deleted') {
      cardClass = 'job-card status-deleted-card'
      bannerHtml = `<div class="status-banner status-deleted">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        No Longer Available
      </div>`
    }

    return `
    <div class="${cardClass}">
      ${bannerHtml}
      <div class="job-date">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        ${job['Date Posted'] || 'N/A'}
      </div>
      <h3 class="job-title">${job['Job Title']}</h3>
      
      <div class="job-meta">
        <div class="meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          ${job['Location']}
        </div>
        ${job['Department'] && job['Department'] !== 'N/A' ? `
        <div class="meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          ${job['Department']}
        </div>
        ` : ''}
      </div>
      
      <div class="tags">
        ${job['Language Req'] && job['Language Req'] !== 'Not specified' && job['Language Req'] !== 'N/A' 
          ? job['Language Req'].split(',').map(lang => `<span class="tag">${lang.trim()}</span>`).join('') 
          : ''}
      </div>
      
      <a href="${job['Direct Link']}" target="_blank" rel="noopener noreferrer" class="apply-btn">
        View & Apply
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
      </a>
    </div>
    `
  }).join('')
}

searchInput.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase()
  const filtered = allJobs.filter(job => {
    return (
      (job['Job Title'] || '').toLowerCase().includes(term) ||
      (job['Location'] || '').toLowerCase().includes(term) ||
      (job['Department'] || '').toLowerCase().includes(term) ||
      (job['Language Req'] || '').toLowerCase().includes(term)
    )
  })
  renderJobs(filtered)
})

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active class
    tabBtns.forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    
    // Update state
    currentCompany = btn.dataset.company
    
    // Update UI title
    if (currentCompany === 'sap') {
      mainTitle.textContent = 'SAP Opportunities'
    } else {
      mainTitle.textContent = 'TeamViewer Opportunities'
    }
    
    // Re-fetch and render jobs
    jobsGrid.innerHTML = ''
    jobCount.textContent = 'Loading jobs...'
    init()
  })
})

if (refreshBtn) {
  refreshBtn.addEventListener('click', async () => {
    refreshBtn.disabled = true
    const originalText = refreshBtn.innerHTML
    refreshBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> <span>Scraping...</span>`
    refreshBtn.classList.add('spinning')
    
    try {
      const res = await fetch(`/api/run-scraper?company=${currentCompany}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to run scraper')
      }
      // Re-initialize to fetch new data
      await init()
    } catch (err) {
      alert('Error running scraper: ' + err.message)
    } finally {
      refreshBtn.disabled = false
      refreshBtn.innerHTML = originalText
      refreshBtn.classList.remove('spinning')
    }
  })
}

init()
