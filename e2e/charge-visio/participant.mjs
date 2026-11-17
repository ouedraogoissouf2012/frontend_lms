// Test de capacité de la visio (lms_backend#1232) : les participants simulés d'UN runner.
//
// Usage : node participant.mjs <plan.json> <dossier de sortie>
// Env : RUNNER (index), T0_EPOCH_S (instant commun à tous les runners), CHARGE_VISIO_JETONS (le secret GitHub :
// { domaine, salle, jetons: [modérateur, élève 1, élève 2, …] }, signés SUR LE SERVEUR par l'émetteur du LMS).
//
// - Un Chromium sans écran, un contexte par participant, média factice (mire et bip) : aucun vrai flux.
// - Chaque participant entre à son instant (plan.mjs), puis échantillonne toutes les 5 s : entré ou non, compteurs
//   des flux reçus (RTCPeerConnection.getStats du pont vidéo), gels vidéo, CPU du runner.
// - Les jetons sont MASQUÉS dans les journaux dès le départ (une erreur de navigation affiche l'URL).
// - Sur une annulation (SIGTERM), on écrit ce qu'on a mesuré, puis on ferme : la salle se vide.
import os from 'node:os'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { validerPlan, participantsDuRunner, finS, adresseEntree } from './plan.mjs'
import { deltas } from './mesures.mjs'

const PAS_S = 5
const ATTENTE_ENTREE_MS = 60_000

function lireJetons(plan) {
  let j
  try { j = JSON.parse(process.env.CHARGE_VISIO_JETONS ?? '') } catch { throw new Error('CHARGE_VISIO_JETONS illisible (JSON attendu)') }
  if (!Array.isArray(j?.jetons) || typeof j.domaine !== 'string') throw new Error('CHARGE_VISIO_JETONS : { domaine, salle, jetons } attendu')
  // Avant toute autre sortie : chaque jeton est masqué dans les journaux de GitHub Actions.
  for (const t of j.jetons) console.log(`::add-mask::${t}`)
  if (j.salle !== plan.salle) throw new Error(`les jetons ouvrent « ${j.salle} », le plan vise « ${plan.salle} »`)
  return j
}

/** Le CPU du runner sur la période, en %, d'après deux relevés de os.cpus(). */
function lecteurCpu() {
  let avant = os.cpus()
  return () => {
    const apres = os.cpus()
    let occupe = 0
    let total = 0
    apres.forEach((c, i) => {
      const a = avant[i].times
      const t = Object.keys(c.times).reduce((s, k) => s + (c.times[k] - a[k]), 0)
      total += t
      occupe += t - (c.times.idle - a.idle)
    })
    avant = apres
    return total > 0 ? Math.round((occupe / total) * 100) : null
  }
}

// Exécuté DANS la page : les compteurs cumulés des flux reçus par le pont vidéo. Rien n'est inventé : un champ
// illisible reste null.
async function relever() {
  const conf = window.APP?.conference
  const entre = Boolean(conf?.isJoined?.())
  const pc = conf?._room?.jvbJingleSession?.peerconnection?.peerconnection
  const salle = conf?._room
  // #1232, essai 1 : ICE, DTLS et SCTP établis côté pont vidéo (journaux du JVB), mais aucun média. On relève ce qui
  // est PUBLIÉ (pistes locales, muettes ou non), ce qui est REÇU (pistes distantes), et TOUTES les connexions.
  const pistesLocales = (salle?.getLocalTracks?.() ?? []).map((t) => ({ type: t.getType?.() ?? null, muette: t.isMuted?.() ?? null }))
  const pistesDistantes = (salle?.getParticipants?.() ?? []).reduce((n, p) => n + (p.getTracks?.()?.length ?? 0), 0)
  const connexions = [...(salle?.rtc?.peerConnections?.values?.() ?? [])].map((t) => ({
    p2p: t.isP2P ?? null,
    ice: t.peerconnection?.iceConnectionState ?? null,
    etat: t.peerconnection?.connectionState ?? null,
  }))
  const base = { entre, participants: salle?.getParticipantCount?.() ?? null, pistesLocales, pistesDistantes, connexions }
  if (!pc) return { ...base, ice: null, paquetsRecus: null, paquetsPerdus: null, octetsRecus: null, octetsRecusAudio: null, octetsRecusVideo: null, gelsCumules: null, imagesDecodeesCumulees: null }
  let paquetsRecus = 0
  let paquetsPerdus = 0
  let octetsRecus = 0
  // #1232, essai 2 : le son et l'image se jugent séparément (condition du test à 60).
  const octetsRecusParType = { audio: 0, video: 0 }
  let octetsEnvoyes = 0
  let gels = 0
  let images = 0
  let paireRetenue = null
  const rapports = await pc.getStats()
  rapports.forEach((r) => {
    if (r.type === 'outbound-rtp') octetsEnvoyes += r.bytesSent ?? 0
    if (r.type === 'candidate-pair' && r.nominated && r.state === 'succeeded') paireRetenue = r
    if (r.type !== 'inbound-rtp') return
    paquetsRecus += r.packetsReceived ?? 0
    paquetsPerdus += r.packetsLost ?? 0
    octetsRecus += r.bytesReceived ?? 0
    if (r.kind in octetsRecusParType) octetsRecusParType[r.kind] += r.bytesReceived ?? 0
    if (r.kind === 'video') {
      gels += r.freezeCount ?? 0
      images += r.framesDecoded ?? 0
    }
  })
  // #1232, essai 1 : le média n'arrivait pas. L'état ICE et la paire retenue disent si la connexion au pont
  // vidéo s'établit, et par quel chemin (host, srflx, relay ; udp ou tcp).
  const local = paireRetenue ? rapports.get(paireRetenue.localCandidateId) : null
  const distant = paireRetenue ? rapports.get(paireRetenue.remoteCandidateId) : null
  const ice = {
    etat: pc.iceConnectionState ?? null,
    connexion: pc.connectionState ?? null,
    candidatLocal: local ? `${local.candidateType}/${local.protocol}` : null,
    candidatDistant: distant ? `${distant.candidateType}/${distant.protocol}:${distant.port}` : null,
  }
  return {
    ...base, ice, octetsEnvoyes, paquetsRecus, paquetsPerdus, octetsRecus,
    octetsRecusAudio: octetsRecusParType.audio, octetsRecusVideo: octetsRecusParType.video, gelsCumules: gels, imagesDecodeesCumulees: images,
  }
}

const dormir = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)))

async function vivre(navigateur, p, contexteRun) {
  const { plan, jetons, t0Ms, finMs, cpu, resultat } = contexteRun
  const trace = { numero: p.numero, role: p.role, palier: p.palier, entreeS: p.entreeS, entreeMs: null, echecEntree: null, echantillons: [] }
  resultat.participants.push(trace)
  await dormir(t0Ms + p.entreeS * 1000 - Date.now())
  if (contexteRun.arret) return
  const contexte = await navigateur.newContext({ permissions: ['camera', 'microphone'], viewport: { width: 640, height: 360 } })
  contexteRun.contextes.add(contexte)
  try {
    const page = await contexte.newPage()
    const debut = Date.now()
    await page.goto(adresseEntree(jetons.domaine, plan.salle, jetons.jetons[p.numero], p.role), { waitUntil: 'domcontentloaded', timeout: ATTENTE_ENTREE_MS })
    await page.waitForFunction(() => Boolean(window.APP?.conference?.isJoined?.()), null, { timeout: ATTENTE_ENTREE_MS })
      .then(() => { trace.entreeMs = Date.now() - debut })
      .catch(() => { trace.echecEntree = 'entrée en salle non confirmée en 60 s' })
    let precedent = null
    while (!contexteRun.arret && Date.now() < finMs) {
      const instant = Date.now()
      const brut = await page.evaluate(relever).catch(() => ({ entre: false }))
      const dt = precedent ? (instant - precedent.instant) / 1000 : 0
      trace.echantillons.push({
        numero: p.numero,
        tS: Math.round((instant - t0Ms) / 1000),
        entre: brut.entre === true,
        participantsVus: brut.participants ?? null,
        ice: brut.ice ?? null,
        octetsEnvoyes: brut.octetsEnvoyes ?? null,
        octetsRecusAudio: brut.octetsRecusAudio ?? null,
        octetsRecusVideo: brut.octetsRecusVideo ?? null,
        pistesLocales: brut.pistesLocales ?? null,
        pistesDistantes: brut.pistesDistantes ?? null,
        connexions: brut.connexions ?? null,
        ...deltas(precedent?.brut, brut.paquetsRecus == null ? null : brut, dt),
        gelsCumules: brut.gelsCumules ?? null,
        imagesDecodeesCumulees: brut.imagesDecodeesCumulees ?? null,
        cpuRunnerPct: cpu(),
      })
      if (brut.paquetsRecus != null) precedent = { instant, brut }
      contexteRun.ecrire()
      await dormir(PAS_S * 1000 - (Date.now() - instant))
    }
  } catch (e) {
    trace.echecEntree = trace.echecEntree ?? `erreur de l’outil : ${String(e?.message ?? e).split('\n')[0]}`
  } finally {
    contexteRun.contextes.delete(contexte)
    await contexte.close().catch(() => {})
  }
}

async function principal() {
  const [cheminPlan, sortie] = process.argv.slice(2)
  const plan = validerPlan(JSON.parse(readFileSync(cheminPlan, 'utf8')))
  const jetons = lireJetons(plan)
  const runner = Number(process.env.RUNNER)
  const t0Ms = Number(process.env.T0_EPOCH_S) * 1000
  if (!Number.isInteger(runner) || !Number.isFinite(t0Ms)) throw new Error('RUNNER et T0_EPOCH_S sont requis')
  const participants = participantsDuRunner(plan, runner)
  if (participants.some((p) => typeof jetons.jetons[p.numero] !== 'string')) throw new Error('pas assez de jetons pour ce runner')

  mkdirSync(sortie, { recursive: true })
  // `termine` : le run est allé au bout ; `arret` : le signal reçu et quand. Sans l'un ni l'autre, le script a été tué.
  const resultat = { runner, salle: plan.salle, t0: new Date(t0Ms).toISOString(), termine: false, arret: null, participants: [] }
  const fichier = join(sortie, `runner-${runner}.json`)
  // Atomique (écrire à côté, puis renommer) : un arrêt en pleine écriture laisse le relevé précédent, entier.
  const ecrire = () => { writeFileSync(`${fichier}.tmp`, JSON.stringify(resultat)); renameSync(`${fichier}.tmp`, fichier) }
  const navigateur = await chromium.launch({
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
  })
  // Écrit à chaque relevé : un arrêt sans signal (SIGKILL) laisse le dernier état mesuré.
  const contexteRun = { plan, jetons, t0Ms, finMs: t0Ms + finS(plan) * 1000, cpu: lecteurCpu(), resultat, contextes: new Set(), arret: false, ecrire }
  // SIGINT d'abord (annulation), SIGTERM ~7,5 s après, puis SIGKILL : le relevé s'écrit au PREMIER signal, avant
  // toute fermeture ; un second signal ne refait rien.
  const arreter = async (signal) => {
    if (contexteRun.arret) return
    contexteRun.arret = true
    resultat.arret = { signal, tS: Math.round((Date.now() - t0Ms) / 1000) }
    ecrire()
    await Promise.all([...contexteRun.contextes].map((c) => c.close().catch(() => {})))
    await navigateur.close().catch(() => {})
    process.exit(0)
  }
  process.on('SIGTERM', arreter)
  process.on('SIGINT', arreter)
  await Promise.all(participants.map((p) => vivre(navigateur, p, contexteRun)))
  if (contexteRun.arret) return
  resultat.termine = true
  ecrire()
  await navigateur.close()
}

principal().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1) })
