// Faux KLASSCI de l'E2E (D111) : répond 503 à TOUT, ne relaie RIEN, journalise chaque appel.
//
// Le LMS sous test vise ce serveur par `KLASSCI_API_URL`. Une école créée depuis le LMS ne
// devrait pas en avoir besoin : la liste de ce qu'il a TENTÉ d'appeler est une mesure.
// Seuls la méthode et le chemin sont journalisés : jamais le corps, qui peut porter des
// identifiants.
//
// Usage : node e2e/faux-klassci.mjs <port> <journal.jsonl>
import { createServer } from 'node:http'
import { appendFileSync } from 'node:fs'

const [port = '8180', journal = 'faux-klassci.jsonl'] = process.argv.slice(2)

createServer((req, res) => {
  appendFileSync(journal, JSON.stringify({ t: new Date().toISOString(), methode: req.method, chemin: req.url.split('?')[0] }) + '\n')
  req.resume()
  res.writeHead(503, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ success: false, message: 'Faux KLASSCI de l’E2E : indisponible par construction.' }))
}).listen(Number(port), '127.0.0.1', () => console.log(`faux KLASSCI sur 127.0.0.1:${port}`))
