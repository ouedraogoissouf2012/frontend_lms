/**
 * Web Worker pour le heartbeat de la visioconférence
 *
 * Ce Worker tourne en arrière-plan et continue à envoyer des messages
 * même quand l'onglet est inactif.
 *
 * Avantages :
 * - Indépendant de l'état de l'onglet
 * - Continue même si l'utilisateur change d'onglet
 * - Pas affecté par le throttling des navigateurs
 */

let heartbeatInterval = null;

/**
 * Écouter les messages du thread principal
 */
self.addEventListener('message', (e) => {
  const { command, interval } = e.data;

  if (command === 'start') {
    // Démarrer le heartbeat
    const intervalMs = interval || 30000; // Défaut: 30 secondes

    // Arrêter tout intervalle existant
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    // Créer le nouvel intervalle
    heartbeatInterval = setInterval(() => {
      // Envoyer un message au thread principal
      self.postMessage({ type: 'heartbeat', timestamp: Date.now() });
    }, intervalMs);

    console.log(`[Worker] Heartbeat démarré (intervalle: ${intervalMs}ms)`);

    // Envoyer une confirmation
    self.postMessage({ type: 'started', interval: intervalMs });

  } else if (command === 'stop') {
    // Arrêter le heartbeat
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
      console.log('[Worker] Heartbeat arrêté');

      // Envoyer une confirmation
      self.postMessage({ type: 'stopped' });
    }
  } else if (command === 'ping') {
    // Répondre à un ping (pour vérifier que le Worker est vivant)
    self.postMessage({ type: 'pong', timestamp: Date.now() });
  }
});

// Gestion des erreurs
self.addEventListener('error', (error) => {
  console.error('[Worker] Erreur:', error);
  self.postMessage({ type: 'error', error: error.message });
});
