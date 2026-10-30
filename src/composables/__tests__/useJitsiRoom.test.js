/**
 * Tests du composable useJitsiRoom — src/composables/useJitsiRoom.js (#673)
 *
 * `useJitsiRoom` est la SEULE frontière du dépôt qui connaît l'IFrame API de
 * Jitsi. Tout est donc testé contre un double injecté : aucun test n'a besoin
 * d'un vrai serveur Jitsi, et la frontière reste substituable (DIP).
 *
 * Ce que ces tests verrouillent, et pourquoi c'est le cœur de #673 :
 * l'ordre d'enregistrement ne « réussit » que lorsque le FOURNISSEUR l'a
 * confirmé. Le défaut corrigé consistait justement à afficher « enregistrement
 * en cours » sur la foi d'une écriture locale, pendant que Jibri restait IDLE.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
// Double de l'IFrame API, partagé avec les tests qui montent la salle (#416).
import { ROOM, mountRoom } from '../../../tests/helpers/fakeJitsiApi'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useJitsiRoom — montage', () => {
  it('J1 — configure la salle avec le jeton et le nœud parent', async () => {
    const { room, last } = mountRoom()
    const parentNode = document.createElement('div')

    await room.mount({ ...ROOM, parentNode })

    expect(last().domain).toBe(ROOM.domain)
    expect(last().options.roomName).toBe(ROOM.roomName)
    expect(last().options.jwt).toBe(ROOM.jwt)
    expect(last().options.parentNode).toBe(parentNode)
  })

  /**
   * R7 — le jeton ne doit plus transiter par l'URL. Le vérifier ici, sur la
   * frontière, est le seul endroit où la garantie tient quel que soit l'appelant.
   */
  it('J2 — le jeton est passé en option, jamais dans le nom de salle', async () => {
    const { room, last } = mountRoom()

    await room.mount({ ...ROOM, parentNode: document.createElement('div') })

    expect(last().options.roomName).not.toContain('jwt')
    expect(last().options.roomName).not.toContain(ROOM.jwt)
  })

  it('J3 — un montage sans jeton échoue avant toute instanciation', async () => {
    const { room, instances } = mountRoom()

    await expect(
      room.mount({ ...ROOM, jwt: '', parentNode: document.createElement('div') }),
    ).rejects.toThrow()
    expect(instances).toHaveLength(0)
  })

  it('J4 — dispose() détache TOUS les écouteurs et libère l\'instance', async () => {
    const { room, last } = mountRoom()
    await room.mount({ ...ROOM, parentNode: document.createElement('div') })
    expect(last().countListeners()).toBeGreaterThan(0)

    room.dispose()

    expect(last().disposed).toBe(true)
    expect(last().countListeners()).toBe(0)
  })
})

describe('useJitsiRoom — enregistrement (le cœur de #673)', () => {
  async function mounted() {
    const ctx = mountRoom()
    await ctx.room.mount({ ...ROOM, parentNode: document.createElement('div') })
    // #416 : le démarrage exige une conférence JOINTE ; ces tests portent sur la
    // confirmation du fournisseur, pas sur la jonction (cf. visioEnregistrementJonction).
    ctx.last().emit('videoConferenceJoined', { roomName: ROOM.roomName })
    return ctx
  }

  it('J5 — la promesse ne se résout QUE sur confirmation du fournisseur', async () => {
    const { room, last } = await mounted()

    const started = room.startRecording()
    let resolved = false
    started.then(() => { resolved = true })

    // L'ordre est parti…
    expect(last().commands).toEqual([{ name: 'startRecording', args: [{ mode: 'file' }] }])
    await Promise.resolve()
    // …mais rien n'est confirmé : personne ne doit conclure au succès.
    expect(resolved).toBe(false)

    last().emit('recordingStatusChanged', { on: true, mode: 'file' })
    await expect(started).resolves.toBeUndefined()
  })

  it('J6 — un échec explicite du fournisseur rejette immédiatement', async () => {
    const { room, last } = await mounted()

    const started = room.startRecording()
    last().emit('recordingStatusChanged', { on: false, mode: 'file', error: 'service_unavailable' })

    await expect(started).rejects.toThrow(/service_unavailable/)
  })

  /**
   * MESURÉ sur le serveur : Jibri a mis 8,3 s puis 23,9 s à passer à `on`
   * (journaux Jicofo du 2026-08-31). Et Jicofo lui-même attend
   * `pending-timeout = "90 seconds"` (/run/jicofo/config/jicofo.conf:104).
   * Conclure à l'échec avant Jicofo produirait un enregistrement orphelin :
   * Jibri capturerait sans que le LMS ait rien persisté.
   */
  it('J7 — le délai de garde ne se déclenche pas avant celui de Jicofo', async () => {
    const { room } = await mounted()

    const started = room.startRecording()
    started.catch(() => {})
    let settled = false
    started.finally(() => { settled = true })

    await vi.advanceTimersByTimeAsync(90_000)
    expect(settled).toBe(false)
  })

  it('J8 — au-delà du délai de garde, la promesse est rejetée', async () => {
    const { room } = await mounted()

    const started = room.startRecording()
    const assertion = expect(started).rejects.toThrow(/confirm/i)
    await vi.advanceTimersByTimeAsync(120_000)
    await assertion
  })

  /**
   * Une promesse tenue doit être définitivement tenue. Si l'écouteur de la
   * commande survivait, un `off` ultérieur — l'arrêt normal de la séance —
   * rejetterait une promesse déjà résolue ; et un minuteur non annulé
   * produirait un rejet non intercepté deux minutes plus tard.
   */
  it('J9 — après confirmation, ni écouteur ni minuteur ne survivent', async () => {
    const { room, last } = await mounted()

    // Compte les seuls écouteurs d'enregistrement : la salle en pose d'autres,
    // permanents (jonction et départ, #416), hors du sujet de ce test.
    const ecouteursEnregistrement = () => last().listeners.get('recordingStatusChanged').size
    const started = room.startRecording()
    // 2 écouteurs : le suivi permanent de `isRecording`, plus celui de la commande.
    expect(ecouteursEnregistrement()).toBe(2)

    last().emit('recordingStatusChanged', { on: true, mode: 'file' })
    await started

    expect(ecouteursEnregistrement()).toBe(1)
    await vi.advanceTimersByTimeAsync(300_000)
    expect(ecouteursEnregistrement()).toBe(1)
  })

  it('J10 — l\'arrêt suit la même règle : confirmation avant résolution', async () => {
    const { room, last } = await mounted()

    const stopped = room.stopRecording()
    // L'API externe de Jitsi est ASYMETRIQUE, verifie dans le bundle deploye
    // (app.bundle.min.js, 9365) :
    //
    //   "start-recording": e => { let t = e.mode, ... }   -> un OBJET
    //   "stop-recording":  (e,t) => { if (![FILE,STREAM].includes(e))
    //                        error("Invalid recording mode provided!") }
    //                                                    -> une CHAINE
    //
    // Cette assertion FIGEAIT le defaut : elle exigeait un objet, donc
    // l'arret echouait TOUJOURS en production. Mesure le 2026-09-18 a
    // 09:28:24 : « <stop-recording>: Invalid recording mode provided! ».
    // L'enregistrement ne s'est arrete que parce que l'enseignant a quitte
    // la salle, ce qui a fait couper la session par Jicofo.
    expect(last().commands).toEqual([{ name: 'stopRecording', args: ['file'] }])

    last().emit('recordingStatusChanged', { on: false, mode: 'file' })
    await expect(stopped).resolves.toBeUndefined()
  })

  /**
   * Les deux promesses sont RECUEILLIES et neutralisees.
   *
   * `command()` n'est tenue que par `recordingStatusChanged` ; sans
   * confirmation elle rejette au delai de garde. Laisser ces promesses
   * pendantes produit un rejet non traite APRES la fin du test, qui fait
   * tomber d'autres fichiers du meme worker. Mesure : 6 a 7 echecs dans
   * les tests d'evaluation, sans aucun rapport, alors que l'arbre propre
   * rendait 2303 verts.
   */
  it('J10b — le demarrage envoie un OBJET, l\'arret une CHAINE', async () => {
    const { room, last } = await mounted()

    const demarre = room.startRecording()
    last().emit('recordingStatusChanged', { on: true, mode: 'file' })
    await demarre

    const arrete = room.stopRecording()
    last().emit('recordingStatusChanged', { on: false, mode: 'file' })
    await arrete

    // Verrouille l'asymetrie elle-meme : une factorisation qui
    // reunifierait les deux appels recasserait l'arret, en silence.
    expect(last().commands).toEqual([
      { name: 'startRecording', args: [{ mode: 'file' }] },
      { name: 'stopRecording', args: ['file'] },
    ])
  })

  it('J11 — piloter l\'enregistrement sans salle montée échoue', async () => {
    const { room } = mountRoom()

    await expect(room.startRecording()).rejects.toThrow()
  })
})

describe('useJitsiRoom — sortie de salle (R6)', () => {
  it('J12 — la sortie provient d\'un événement Jitsi, pas d\'une fenêtre sondée', async () => {
    const { room, last } = mountRoom()
    const onLeft = vi.fn()
    room.on('videoConferenceLeft', onLeft)
    await room.mount({ ...ROOM, parentNode: document.createElement('div') })

    last().emit('videoConferenceLeft', { roomName: ROOM.roomName })

    expect(onLeft).toHaveBeenCalledTimes(1)
  })

  it('J13 — readyToClose est relayé aussi', async () => {
    const { room, last } = mountRoom()
    const onClose = vi.fn()
    room.on('readyToClose', onClose)
    await room.mount({ ...ROOM, parentNode: document.createElement('div') })

    last().emit('readyToClose', {})

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
