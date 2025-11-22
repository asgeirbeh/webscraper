# Deployment Guide - Web Scraper

## Anbefalt: Railway.app (Enklest)

### Steg 1: Forbered Prosjektet

1. **Opprett en `package.json` i rotmappen**:
```bash
cd "/Users/asgeirbehrentz/Desktop/Apps/webside scraper"
```

Opprett en fil `package.json` i rotmappen med:
```json
{
  "name": "web-scraper-app",
  "version": "1.0.0",
  "scripts": {
    "build": "cd client && npm install && npm run build",
    "start": "cd server && npm install && node index.js"
  }
}
```

2. **Oppdater server for produksjon**:
   
Endre i `server/index.js` linje 10:
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173'
}));
```

Og legg til etter linje 11:
```javascript
// Serve static files from client build
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));
```

3. **Oppdater client for produksjon**:

I `client/src/App.jsx`, endre linje 33:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const eventSource = new EventSource(`${API_URL}/api/scrape-stream?url=${encodeURIComponent(targetUrl)}`)
```

Og linje 60:
```javascript
fetch(`${API_URL}/api/health`)
```

4. **Opprett `.env` fil i client-mappen**:
```
VITE_API_URL=https://your-app-name.up.railway.app
```

### Steg 2: Opprett Git Repository

```bash
cd "/Users/asgeirbehrentz/Desktop/Apps/webside scraper"
git init
git add .
git commit -m "Initial commit"
```

### Steg 3: Deploy til Railway

1. Gå til [railway.app](https://railway.app)
2. Klikk "Start a New Project"
3. Velg "Deploy from GitHub repo"
4. Koble til GitHub og velg ditt repository
5. Railway vil automatisk detektere Node.js
6. Sett miljøvariabel:
   - `PORT` = `3001`
7. Deploy!

Railway vil gi deg en URL som: `https://your-app.up.railway.app`

---

## Alternativ: DigitalOcean App Platform

### Steg 1-2: Samme som over

### Steg 3: Deploy til DigitalOcean

1. Gå til [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. Klikk "Create App"
3. Velg GitHub repository
4. Konfigurer:
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **HTTP Port**: `3001`
5. Deploy!

Pris: $5/måned

---

## Alternativ: Domeneshop VPS (Mer avansert)

Hvis du vil bruke Domeneshop, må du:

1. **Bestill VPS** (Virtual Private Server) fra Domeneshop
2. **SSH inn på serveren**
3. **Installer Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. **Last opp filene** (via SFTP eller Git)
5. **Installer dependencies**:
```bash
cd server && npm install
cd ../client && npm install && npm run build
```

6. **Sett opp PM2** (for å holde appen kjørende):
```bash
sudo npm install -g pm2
pm2 start server/index.js
pm2 startup
pm2 save
```

7. **Konfigurer Nginx** som reverse proxy
8. **Sett opp SSL** med Let's Encrypt

Dette krever mer teknisk kunnskap!

---

## Viktig Sikkerhet

Før du gjør appen offentlig:

1. **Legg til rate limiting** for å forhindre misbruk
2. **Legg til autentisering** hvis du ikke vil at alle skal bruke den
3. **Overvåk ressursbruk** - scraping kan være tungt

---

## Anbefaling

For enklest deployment: **Bruk Railway.app**
- Gratis tier for å teste
- Enkel oppsett
- Automatisk HTTPS
- God dokumentasjon

Vil du ha hjelp med å sette opp deployment?
