const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Utility to sleep/delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to clean text
function cleanText(text) {
    return text
        .replace(/\s+/g, ' ')
        .trim();
}

// The scraping logic
async function scrapeWebsite(startUrl, onProgress) {
    const visited = new Set();
    const queue = [startUrl];
    const results = [];
    const domain = new URL(startUrl).hostname;
    const MAX_PAGES = 1500; // Prevent infinite loops on huge sites
    let pagesScraped = 0;

    while (queue.length > 0 && pagesScraped < MAX_PAGES) {
        const currentUrl = queue.shift();

        if (visited.has(currentUrl)) continue;
        visited.add(currentUrl);
        pagesScraped++;

        try {
            onProgress(`Scraping: ${currentUrl} (${pagesScraped}/${MAX_PAGES})`);

            const response = await axios.get(currentUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
                },
                timeout: 15000, // Increased timeout to 15 seconds
                maxRedirects: 5,
                validateStatus: function (status) {
                    return status >= 200 && status < 400; // Accept 2xx and 3xx
                }
            });

            const html = response.data;
            const $ = cheerio.load(html);

            // Extract content
            // Remove scripts, styles, etc.
            $('script').remove();
            $('style').remove();
            $('noscript').remove();
            $('iframe').remove();

            const title = $('title').text().trim();
            const bodyText = $('body').text();
            const cleanedContent = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n');

            results.push({
                url: currentUrl,
                title: title,
                content: cleanedContent
            });

            // Find links
            $('a').each((i, el) => {
                const href = $(el).attr('href');
                if (href) {
                    try {
                        const absoluteUrl = new URL(href, currentUrl).href;
                        const urlObj = new URL(absoluteUrl);

                        // Only internal links
                        if (urlObj.hostname === domain && !visited.has(absoluteUrl) && !queue.includes(absoluteUrl)) {
                            // Filter out non-html extensions
                            if (!absoluteUrl.match(/\.(jpg|jpeg|png|gif|pdf|zip|css|js|svg|ico|woff|woff2|ttf|eot)$/i)) {
                                // Remove hash
                                urlObj.hash = '';
                                const normalizedUrl = urlObj.href;
                                if (!visited.has(normalizedUrl) && !queue.includes(normalizedUrl)) {
                                    queue.push(normalizedUrl);
                                }
                            }
                        }
                    } catch (e) {
                        // Invalid URL, ignore
                    }
                }
            });

        } catch (error) {
            console.error(`Failed to scrape ${currentUrl}: ${error.message}`);
            // Don't add failed pages to results to keep output clean
        }

        // Rate limiting - be nice to servers
        await sleep(200);
    }

    if (pagesScraped >= MAX_PAGES) {
        onProgress(`⚠️ Reached maximum page limit (${MAX_PAGES}). Stopping.`);
    }

    return results;
}

app.post('/api/scrape', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Starting scrape for ${url}`);

    // Note: For a real production app, we should use Server Sent Events (SSE) or WebSockets for progress.
    // For this simple tool, we'll just wait (which might timeout for huge sites) or we can implement SSE.
    // Let's implement SSE to give feedback.

    // Actually, let's just return a stream or use a simple polling mechanism? 
    // SSE is best for "Progress bar".
});

// SSE Endpoint
app.get('/api/scrape-stream', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).send('URL required');
    }

    console.log(`Starting scrape for: ${url}`);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering

    const sendEvent = (data) => {
        try {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (err) {
            console.error('Error sending event:', err.message);
        }
    };

    // Handle client disconnect
    req.on('close', () => {
        console.log('Client disconnected');
    });

    try {
        const results = await scrapeWebsite(url, (msg) => {
            sendEvent({ type: 'progress', message: msg });
        });

        console.log(`Scraping completed. Found ${results.length} pages.`);

        // Format the final text
        let fullText = '';
        results.forEach(page => {
            fullText += '================================================================================\n';
            fullText += `URL: ${page.url}\n`;
            if (page.title) fullText += `TITLE: ${page.title}\n`;
            if (page.error) {
                fullText += `ERROR: ${page.error}\n`;
            } else {
                fullText += '--------------------------------------------------------------------------------\n';
                fullText += page.content + '\n';
            }
            fullText += '\n\n';
        });

        // Generate Sitemap XML
        let sitemapXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        sitemapXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        results.forEach(page => {
            sitemapXml += '  <url>\n';
            sitemapXml += `    <loc>${page.url}</loc>\n`;
            sitemapXml += '  </url>\n';
        });
        sitemapXml += '</urlset>';

        sendEvent({
            type: 'complete',
            data: {
                content: fullText,
                sitemap: sitemapXml
            }
        });
        res.end();
    } catch (error) {
        console.error('Scraping error:', error);
        sendEvent({ type: 'error', message: error.message });
        res.end();
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
