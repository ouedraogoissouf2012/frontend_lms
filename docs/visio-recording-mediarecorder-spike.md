# Spike #201 — Capture navigateur MediaRecorder/getDisplayMedia

Date: 2026-07-13  
Issue frontend: https://github.com/ouedraogoissouf2012/frontend_lms/issues/201  
Décision backend liée: https://github.com/ouedraogoissouf2012/lms_backend/issues/407

## Résultat court

Recommandation: **no-go comme chemin principal de production**.

La capture navigateur via `getDisplayMedia` + `MediaRecorder` peut servir de
fallback expérimental si Jibri/JaaS/provider serveur est impossible à court
terme, mais elle ne doit pas remplacer l’architecture serveur décidée côté
backend. Les limites bloquantes sont la sélection manuelle de la surface par
l’utilisateur, la capture audio inégale selon navigateur/OS, la fragilité du
flux actuel en popup, et l’absence actuelle d’un upload chunké/résumable adapté
aux vidéos longues.

## Contexte du code actuel

Le frontend a deux chemins Jitsi:

- Chemin principal séance: `visioStore.joinVisio()` ouvre Jitsi avec
  `window.open(jitsiLink, '_blank')` depuis `src/stores/visio.js`, utilisé par
  `src/composables/useVisioActions.js`, `useTrackedVisioJoin.js`,
  `useTeacherSeances.js` et `useSeanceManagement.js`.
- Chemin iframe existant: `src/components/visio/JitsiMeet.vue` et
  `JitsiModal.vue`, avec `src/composables/useJitsiMeet.js`, chargent
  `JitsiMeetExternalAPI` dans un conteneur iframe et gèrent les événements
  join/leave.

La décision backend #407 retient Option A en production: provider serveur
piloté par backend, source de vérité unique des statuts. Le fallback navigateur
aurait un cycle `idle -> recording -> uploading -> processing -> ready|failed`,
mais il n’est pas validé côté stockage.

## Questions de l’issue

### 1. `getDisplayMedia` fonctionne-t-il avec le flux actuel popup ?

Techniquement oui, mais seulement si l’enseignant choisit manuellement la bonne
fenêtre/onglet Jitsi dans le sélecteur navigateur. Le frontend ne peut pas
forcer la capture de la popup ni mémoriser l’autorisation.

Limites concrètes:

- `getDisplayMedia` nécessite HTTPS et une activation utilisateur.
- Le navigateur doit redemander l’autorisation à chaque capture.
- Les options ne peuvent pas retirer le choix final à l’utilisateur; elles ne
  sont que des contraintes/indices appliqués autour du choix utilisateur.
- Avec `window.open`, l’utilisateur peut sélectionner le mauvais onglet, un
  écran entier, ou une fenêtre qui ne contient pas la conférence.
- Si la fenêtre capturée est fermée, verrouillée ou si l’OS refuse la capture,
  l’enregistrement s’arrête ou échoue.
- L’audio est le point le plus fragile: les navigateurs ne fournissent pas tous
  une piste audio de partage, et la capture audio système/fenêtre dépend de
  l’OS et du navigateur.

Conclusion: compatible pour un prototype manuel, pas robuste pour un parcours
enseignant fiable.

### 2. Faut-il basculer vers l’iframe Jitsi ?

Si l’option navigateur est conservée comme fallback, **oui, il faut préférer le
chemin iframe/fullscreen** déjà présent (`JitsiMeet/JitsiModal`) plutôt que la
popup.

Raison:

- L’IFrame API Jitsi est déjà conçue pour intégrer une conférence via
  `new JitsiMeetExternalAPI(domain, options)` dans un `parentNode`.
- Le frontend peut guider l’utilisateur à partager “cet onglet” au lieu d’une
  popup séparée.
- Le risque de mauvais onglet est réduit, surtout si l’UI passe en modal
  fullscreen avant de demander la capture.
- Les événements Jitsi existants (`videoConferenceJoined`,
  `videoConferenceLeft`, `readyToClose`) restent exploitables pour arrêter
  proprement le recorder.

Limite importante: `getDisplayMedia` capture une surface choisie par
l’utilisateur, pas directement un composant Vue ni un iframe arbitraire. Le
passage iframe améliore l’UX et la reproductibilité, mais ne supprime pas la
permission navigateur ni le choix utilisateur.

### 3. Taille et format MediaRecorder

`MediaRecorder` est globalement disponible sur les navigateurs modernes, mais
les formats exacts doivent être détectés runtime avec
`MediaRecorder.isTypeSupported()`.

Ordre de préférence recommandé pour un prototype:

1. `video/webm;codecs=vp9,opus`
2. `video/webm;codecs=vp8,opus`
3. `video/webm`
4. `video/mp4` ou variante H.264/AAC uniquement si le navigateur la supporte

Estimations à valider en vraie séance:

| Qualité cible | Débit indicatif | Taille 60 min |
| --- | ---: | ---: |
| 720p + audio | 1.5–3 Mbps | ~0.7–1.4 Go |
| 1080p + audio | 3–5 Mbps | ~1.4–2.3 Go |

Ces chiffres dépendent du navigateur, du contenu partagé, du codec réellement
choisi, du nombre de mouvements à l’écran et du débit que l’UA accepte
d’appliquer. Le `timeslice` de `MediaRecorder.start(timeslice)` ne doit pas être
considéré exact: le navigateur peut retarder les chunks et produire des blobs
plus gros.

### 4. Upload chunké/résumable

Un fallback navigateur n’est pas viable sans protocole d’upload dédié.

Contrat minimal à prévoir côté backend avant tout code produit:

- `POST /api/lms/seances/{id}/recording/browser/init`
  - crée une session d’upload, retourne `upload_id`, taille max, chunk size,
    type MIME accepté, URL d’upload.
- `PUT/POST /api/lms/recordings/browser/{upload_id}/chunks/{index}`
  - accepte un chunk numéroté, idempotent, avec checksum.
- `POST /api/lms/recordings/browser/{upload_id}/complete`
  - assemble ou déclenche un job de concaténation/transcodage.
- `DELETE /api/lms/recordings/browser/{upload_id}`
  - abandon propre et purge des chunks incomplets.
- `GET /api/lms/recordings/browser/{upload_id}`
  - reprise après coupure: liste chunks reçus, statut, expiration.

Contraintes:

- chunk court: 5–10 secondes ou taille plafonnée, avec backpressure si réseau
  lent;
- stockage temporaire privé, quota, expiration automatique;
- reprise idempotente après refresh/coupure;
- transition backend vers `uploading`, puis `processing`, puis `ready|failed`;
- transcodage éventuel côté serveur si le navigateur produit un format peu
  compatible avec le lecteur final.

Sans ce backend, enregistrer en mémoire puis envoyer un gros blob final est trop
risqué: crash navigateur, perte totale à la fermeture, upload long non repris,
et consommation RAM/disque non maîtrisée.

### 5. UX permissions écran/micro et risques

Risques UX et produit:

- l’enseignant doit comprendre qu’il faut partager l’onglet/fenêtre Jitsi, pas
  le dashboard, pas un écran contenant des données privées;
- permission non persistante à chaque démarrage;
- capture audio non garantie, donc vidéo potentiellement muette;
- message de consentement participant obligatoire côté LMS;
- arrêt clair et visible si l’utilisateur retire le partage écran;
- indicateur permanent “enregistrement navigateur local en cours”;
- abandon explicite si upload échoue ou si la capture est interrompue.

Mesures minimales si prototype:

- feature flag désactivé par défaut;
- réservé enseignant propriétaire, jamais étudiant;
- confirmation avant démarrage;
- checklist pré-capture: “mettez la visio en fullscreen”, “choisissez cet
  onglet”, “activez audio de l’onglet si disponible”;
- bannière visible pendant `recording/uploading`;
- bouton “abandonner et supprimer les chunks”;
- logs d’audit start/stop/upload/abandon.

## Prototype recommandé si on doit tester

Ne pas brancher le prototype sur le parcours produit actuel. Faire un prototype
isolé, derrière feature flag, avec un écran interne non routé publiquement ou
une branche spike.

Étapes:

1. Réutiliser le chemin iframe `JitsiMeet/JitsiModal`.
2. Après `videoConferenceJoined`, proposer “Tester capture navigateur”.
3. Appeler `navigator.mediaDevices.getDisplayMedia({
   video: { displaySurface: 'browser' },
   audio: true,
   preferCurrentTab: true,
   selfBrowserSurface: 'include',
   systemAudio: 'include',
   surfaceSwitching: 'include'
   })`.
4. Choisir le MIME runtime avec `MediaRecorder.isTypeSupported()`.
5. Lancer `recorder.start(5000)` et afficher:
   - MIME réel;
   - présence audio/video;
   - taille cumulée;
   - durée réelle via timer indépendant;
   - erreurs `onerror` / fin de track.
6. Simuler l’upload chunké dans une interface de test ou sur endpoint mock.
7. Stopper les tracks et le recorder sur leave/readyToClose/fermeture modal.

Critères de go fallback:

- Chrome/Edge desktop capturent vidéo + audio de façon reproductible;
- Firefox/Safari ont un comportement documenté ou sont explicitement exclus;
- taille moyenne maîtrisée pour 60–120 minutes;
- upload chunké résumable validé côté backend;
- politique RGPD/consentement validée;
- fallback clairement présenté comme moins fiable que provider serveur.

## Décision proposée

Pour le produit LMS actuel: **no-go MediaRecorder comme enregistrement de
production**.

Conserver la trajectoire déjà mergée côté frontend:

- contrôles start/stop enseignants;
- polling du statut backend;
- affichage `recording.ready/failed/processing`;
- lecture sécurisée depuis séance et chapitre vidéo.

Ne rouvrir Option B que si:

- Jibri/JaaS/provider est formellement impossible;
- le backend accepte de construire le protocole chunké/résumable;
- le produit accepte un support navigateur limité et une UX de permission plus
  fragile.

## Sources consultées

- MDN — `MediaDevices.getDisplayMedia()`:
  https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia
- MDN Browser Compat Data — `getDisplayMedia` et audio capture support:
  https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/MediaDevices.json
- MDN — `MediaRecorder`:
  https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- MDN — `MediaRecorder.isTypeSupported()`:
  https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static
- MDN — `MediaRecorder.dataavailable`:
  https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/dataavailable_event
- W3C — Screen Capture:
  https://w3c.github.io/mediacapture-screen-share/
- W3C — MediaStream Recording:
  https://w3c.github.io/mediacapture-record/
- Jitsi Meet Handbook — IFrame API:
  https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/
- Jitsi Meet Handbook — IFrame commands:
  https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe-commands/
