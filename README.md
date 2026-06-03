# Job Scraper (SAP, TeamViewer, Porsche)

This project is a web-based job scraping tool that extracts "Working Student" job postings from the career sites of **SAP**, **TeamViewer**, and **Porsche**. It consists of a **Python Playwright** backend to perform the scraping, and a **Vite (Node.js)** frontend UI to view and trigger the scraping process.

## Features
- **Automated Scraping:** Uses Playwright to navigate career sites, extract job details, and bypass dynamic Javascript rendering.
- **Language Analysis:** Automatically detects English and German language requirements from job descriptions.
- **Web UI:** A clean, modern UI to view scraped jobs (from generated CSV files) and manually trigger the scraper.
- **Docker Support:** Fully containerized for easy deployment and setup.

## Prerequisites
If you plan to run the project using Docker, you only need [Docker](https://www.docker.com/) installed. 

If you want to run it natively, you will need:
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js (v18+)](https://nodejs.org/)
- [Git](https://git-scm.com/)

---

## 🚀 How to Download and Run

### 1. Download the Repository
To get started, clone the repository to your local machine using Git:
```bash
git clone https://github.com/tunabaris/Last_WorkingStudent_Updates.git
cd Last_WorkingStudent_Updates
```

### Option A: Run with Docker (Recommended)
Running with Docker is the easiest method, as it automatically installs all Python and Node.js dependencies, including the required Playwright browser binaries.

1. Build the Docker image:
   ```bash
   docker build -t job-scraper .
   ```
2. Run the Docker container:
   ```bash
   docker run -p 5173:5173 job-scraper
   ```
3. Open your browser and go to: `http://localhost:5173`

### Option B: Run Locally (Native)

If you prefer to run it without Docker, follow these steps:

**1. Setup Python Backend:**
```bash
# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
```

**2. Setup and Run the Frontend UI:**
```bash
# Navigate to the ui directory
cd ui

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```

**3. Access the Application:**
Open your browser and navigate to the URL provided in your terminal (usually `http://localhost:5173`).

---

## Usage
- Open the UI in your browser.
- Browse the latest scraped jobs for SAP, TeamViewer, and Porsche.
- To refresh the data, click the **"Run Scraper"** button in the UI. This will trigger the backend Python script to fetch the latest jobs and update the local CSV files.
