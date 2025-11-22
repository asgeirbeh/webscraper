import { useState, useRef, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import './App.css'

function App() {
  const [url, setUrl] = useState('')
  const [isScraping, setIsScraping] = useState(false)
  const [logs, setLogs] = useState([])
  const [result, setResult] = useState(null)
  const [sitemap, setSitemap] = useState(null)
  const eventSourceRef = useRef(null)

  const handleScrape = async () => {
    if (!url) return

    // Reset state
    setIsScraping(true)
    setLogs([])
    setResult(null)
    setSitemap(null)

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // Basic URL validation
    let targetUrl = url
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl
    }

    // Connect to SSE
    const eventSource = new EventSource(`/api/scrape-stream?url=${encodeURIComponent(targetUrl)}`)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      console.log('Received event:', data) // Debug log

      if (data.type === 'progress') {
        setLogs(prev => [data.message, ...prev])
      } else if (data.type === 'complete') {
        console.log('Complete event data:', data.data) // Debug log
        setResult(data.data.content)
        setSitemap(data.data.sitemap)
        setIsScraping(false)
        eventSource.close()
        setLogs(prev => ['✅ Scraping completed successfully!', ...prev])
      } else if (data.type === 'error') {
        setLogs(prev => [`❌ Error: ${data.message}`, ...prev])
        setIsScraping(false)
        eventSource.close()
      }
    }

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error)

      // Check if server is reachable
      fetch('/api/health')
        .then(() => {
          setLogs(prev => ['❌ Connection to server lost. Please try again.', ...prev])
        })
        .catch(() => {
          setLogs(prev => ['❌ Server is not running. Please start the server first.', ...prev])
        })

      setIsScraping(false)
      eventSource.close()
    }
  }

  const handleDownload = () => {
    if (!result) return

    const blob = new Blob([result], { type: 'text/plain' })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href

    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
    link.download = `${domain}_full_content.txt`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
  }

  const handleDownloadSitemap = () => {
    if (!sitemap) return

    const blob = new Blob([sitemap], { type: 'text/xml' })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href

    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
    link.download = `${domain}_sitemap.xml`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img src="/m51-logo.png" alt="M51 Logo" style={{ width: '80px', height: '80px', marginBottom: '1rem', borderRadius: '8px' }} />
        <h1>M51's Webscraper</h1>
        <p className="subtitle">Ekstraher innhold fra hvilken som helst nettside til en pen tekstfil.</p>
      </div>

      <div className="input-group">
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="Paste a URL to start scraping..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isScraping}
            onKeyDown={(e) => e.key === 'Enter' && !isScraping && handleScrape()}
          />
          <button onClick={handleScrape} disabled={isScraping || !url}>
            {isScraping ? 'Scraping...' : 'Start'}
          </button>
        </div>
      </div>

      {(isScraping || logs.length > 0) && (
        <div className="log-container">
          {logs.length === 0 && <div className="log-entry" style={{ textAlign: 'center', opacity: 0.5 }}>Waiting for input...</div>}
          {logs.map((log, index) => (
            <div key={index} className={`log-entry ${log.includes('Error') ? 'error' : log.includes('completed') ? 'success' : ''}`}>
              {log}
            </div>
          ))}
        </div>
      )}

      <div className="download-section" style={{ display: 'flex', gap: '1rem' }}>
        <button
          className="download-btn"
          onClick={handleDownload}
          disabled={!result}
        >
          Last ned innhold (.txt)
        </button>
        <button
          className="download-btn secondary"
          onClick={handleDownloadSitemap}
          disabled={!sitemap}
        >
          Last ned sitemap (.xml)
        </button>
      </div>

      <Analytics />
    </div>
  )
}

export default App
