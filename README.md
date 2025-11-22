# Website Scraper Tool

Dette er et verktøy for å skrape alt innhold fra en nettside til en tekstfil.

## Hvordan bruke det

1. **Start Serveren** (hvis den ikke kjører):
   Åpne terminalen og gå til `server`-mappen:
   ```bash
   cd server
   npm start
   ```

2. **Start Klienten** (hvis den ikke kjører):
   Åpne en ny terminalfane og gå til `client`-mappen:
   ```bash
   cd client
   npm run dev
   ```

3. **Bruk verktøyet**:
   Gå til [http://localhost:5173](http://localhost:5173) i nettleseren din.
   Skriv inn URL-en du vil skrape og trykk "Start Scrape".
   Når den er ferdig, kan du laste ned tekstfilen.

## Funksjonalitet

- **Rekursiv Skraping**: Finner alle interne lenker og følger dem.
- **Innholdsuthenting**: Henter tekst fra hver side, fjerner menyer, skript og stiler.
- **Oversiktlig Format**: Tekstfilen markerer tydelig hvilken URL innholdet kommer fra.
