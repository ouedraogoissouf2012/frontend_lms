// Script Node.js pour retirer JitsiModal de VisioManager.vue
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'visio', 'VisioManager.vue');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Revert VisioManager.vue - Retirer JitsiModal, restaurer window.open()...\n');

// 1. Retirer JitsiModal du template
content = content.replace(
  `    <!-- JitsiModal -->
    <JitsiModal
      v-if="jitsiModalOpen"
      :is-open="jitsiModalOpen"
      :seance-id="seance.id"
      :seance-title="jitsiModalTitle"
      :jitsi-link="jitsiModalLink"
      :user-name="jitsiUserName"
      :user-email="jitsiUserEmail"
      @close="closeJitsiModal"
      @joined="handleJitsiJoined"
      @left="handleJitsiLeft"
      @error="handleJitsiError"
    />`,
  ``
);

// 2. Retirer import JitsiModal
content = content.replace(
  `import ParticipantsModal from './ParticipantsModal.vue'
import JitsiModal from './JitsiModal.vue'
import { useVisioParticipation } from '@/composables/useVisioParticipation'`,
  `import ParticipantsModal from './ParticipantsModal.vue'
import { useVisioParticipation } from '@/composables/useVisioParticipation'`
);

// 3. Retirer JitsiModal des components
content = content.replace(
  `  components: {
    ParticipantsModal,
    JitsiModal
  },`,
  `  components: {
    ParticipantsModal
  },`
);

// 4. Retirer les data properties JitsiModal
content = content.replace(
  `      loading: false,
      showParticipantsModal: false,
      participantCount: 0,
      currentTime: new Date(),
      timeCheckInterval: null,
      jitsiModalOpen: false,
      jitsiModalTitle: '',
      jitsiModalLink: '',
      jitsiUserName: '',
      jitsiUserEmail: ''`,
  `      loading: false,
      showParticipantsModal: false,
      participantCount: 0,
      currentTime: new Date(),
      timeCheckInterval: null`
);

// 5. Remplacer demarrerVisio() avec window.open()
const oldDemarrerVisio = `    /**
     * Enseignant: Démarrer la visio
     */
    async demarrerVisio() {
      this.loading = true
      try {
        console.log('🎥 Démarrage visio par enseignant...')

        // 1. Démarrer la visio (change status à 'active')
        const result = await lmsService.startVisio(this.seance.id)

        if (!result.success) {
          alert(\`Erreur: \${result.message}\`)
          return
        }

        // 2. Générer les paramètres pour JitsiModal
        const roomId = result.data.visio_room_id || this.seance.visio?.room_id
        const matiereName = this.seance.matiere?.libelle || this.seance.matiere?.nom || 'Séance'

        // 3. Ouvrir la modal Jitsi
        this.jitsiModalOpen = true
        this.jitsiModalTitle = matiereName
        this.jitsiModalLink = \`https://meet.jit.si/\${roomId}\`
        this.jitsiUserName = this.user.nom && this.user.prenom
          ? \`\${this.user.prenom} \${this.user.nom}\`
          : this.user.name || this.user.username || 'Enseignant'
        this.jitsiUserEmail = this.user.email || ''

        console.log('✅ Modal Jitsi ouverte pour enseignant')

        // 4. Rafraîchir les données
        this.$emit('visio-updated', result.data)

      } catch (error) {
        console.error('[VisioManager] Erreur démarrage visio:', error)
        alert('Erreur lors du démarrage de la visio: ' + (error.response?.data?.message || error.message))
      } finally {
        this.loading = false
      }
    },`;

const newDemarrerVisio = `    /**
     * Enseignant: Démarrer la visio (window.open avec tracking)
     */
    async demarrerVisio() {
      this.loading = true
      try {
        console.log('🎥 Démarrage visio par enseignant...')

        // 1. Démarrer la visio (change status à 'active')
        const result = await lmsService.startVisio(this.seance.id)

        if (!result.success) {
          alert(\`Erreur: \${result.message}\`)
          return
        }

        // 2. Récupérer le lien Jitsi
        const roomId = result.data.visio_room_id || this.seance.visio?.room_id
        const jitsiLink = \`https://meet.jit.si/\${roomId}\`

        // 3. Utiliser le composable pour ouvrir et tracker
        await this.joinVisio(jitsiLink)

        console.log('✅ Visio démarrée avec window.open + tracking')

        // 4. Rafraîchir les données
        this.$emit('visio-updated', result.data)

      } catch (error) {
        console.error('[VisioManager] Erreur démarrage visio:', error)
        alert('Erreur lors du démarrage de la visio: ' + (error.response?.data?.message || error.message))
      } finally {
        this.loading = false
      }
    },`;

content = content.replace(oldDemarrerVisio, newDemarrerVisio);

// 6. Remplacer rejoindreVisio() avec window.open()
const oldRejoindreVisio = `    /**
     * Étudiant: Rejoindre la visio (avec JitsiModal)
     */
    async rejoindreVisio() {
      if (!this.seance.visio_active) {
        alert('La visio n\\'est pas encore démarrée par l\\'enseignant')
        return
      }

      this.loading = true
      try {
        console.log('👨‍🎓 Étudiant rejoint la visio...')

        // Room ID depuis la séance
        const roomId = this.seance.visio_room_id || this.seance.visio?.room_id

        if (!roomId) {
          alert('Erreur: Room ID introuvable')
          return
        }

        // Préparer les paramètres pour JitsiModal
        const matiereName = this.seance.matiere?.libelle || this.seance.matiere?.nom || 'Séance'

        // Ouvrir la modal Jitsi
        this.jitsiModalOpen = true
        this.jitsiModalTitle = matiereName
        this.jitsiModalLink = \`https://meet.jit.si/\${roomId}\`
        this.jitsiUserName = this.user.nom && this.user.prenom
          ? \`\${this.user.prenom} \${this.user.nom}\`
          : this.user.name || this.user.username || 'Étudiant'
        this.jitsiUserEmail = this.user.email || ''

        console.log('✅ Modal Jitsi ouverte pour étudiant')

        // Émettre événement pour rafraîchir le compteur de participants
        this.$emit('participant-joined')

      } catch (error) {
        console.error('[VisioManager] Erreur rejoindre visio:', error)
        const errorMessage = error.response?.data?.message || error.message
        alert('Erreur lors de la connexion à la visio: ' + errorMessage)
      } finally {
        this.loading = false
      }
    },`;

const newRejoindreVisio = `    /**
     * Étudiant: Rejoindre la visio (window.open avec tracking)
     */
    async rejoindreVisio() {
      if (!this.seance.visio_active) {
        alert('La visio n\\'est pas encore démarrée par l\\'enseignant')
        return
      }

      this.loading = true
      try {
        console.log('👨‍🎓 Étudiant rejoint la visio...')

        // Room ID depuis la séance
        const roomId = this.seance.visio_room_id || this.seance.visio?.room_id

        if (!roomId) {
          alert('Erreur: Room ID introuvable')
          return
        }

        // Utiliser le composable pour ouvrir et tracker
        const jitsiLink = \`https://meet.jit.si/\${roomId}\`
        await this.joinVisio(jitsiLink)

        console.log('✅ Étudiant a rejoint avec window.open + tracking')

        // Émettre événement pour rafraîchir le compteur de participants
        this.$emit('participant-joined')

      } catch (error) {
        console.error('[VisioManager] Erreur rejoindre visio:', error)
        const errorMessage = error.response?.data?.message || error.message
        alert('Erreur lors de la connexion à la visio: ' + errorMessage)
      } finally {
        this.loading = false
      }
    },`;

content = content.replace(oldRejoindreVisio, newRejoindreVisio);

// 7. Supprimer les méthodes JitsiModal (closeJitsiModal, handleJitsiJoined, etc.)
const methodsToRemove = [
  `    /**
     * Fermer la modal Jitsi
     */
    closeJitsiModal() {
      console.log('[VisioManager] Fermeture modal Jitsi')
      this.jitsiModalOpen = false
      this.jitsiModalTitle = ''
      this.jitsiModalLink = ''
      this.jitsiUserName = ''
      this.jitsiUserEmail = ''

      // Rafraîchir les données
      this.$emit('visio-updated')
    },

    /**
     * Événement: Utilisateur a rejoint via Jitsi API
     */
    handleJitsiJoined(event) {
      console.log('[VisioManager] Utilisateur a rejoint via Jitsi API', event)
      this.$emit('participant-joined')
    },

    /**
     * Événement: Utilisateur a quitté via Jitsi API
     */
    handleJitsiLeft(event) {
      console.log('[VisioManager] Utilisateur a quitté via Jitsi API', event)
      this.$emit('participant-left')
    },

    /**
     * Événement: Erreur Jitsi
     */
    handleJitsiError(error) {
      console.error('[VisioManager] Erreur Jitsi', error)
      alert('Erreur lors de la connexion à la visioconférence')
    },

    /**
     * Charger le nombre de participants
     */`,
  `    /**
     * Charger le nombre de participants
     */`
];

content = content.replace(methodsToRemove[0], methodsToRemove[1]);

// 8. Supprimer les méthodes obsolètes (startHeartbeat, stopHeartbeat, sendHeartbeat, leaveVisio, watchVisioWindow)
// Car maintenant tout est géré par le composable useVisioParticipation
const obsoleteMethods = `
    /**
     * Démarrer le système de heartbeat (ping toutes les 30 secondes)
     */
    startHeartbeat() {
      // Arrêter tout heartbeat existant
      this.stopHeartbeat()

      // Premier heartbeat immédiat
      this.sendHeartbeat()

      // Heartbeat toutes les 30 secondes
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat()
      }, 30000) // 30 secondes

      console.log('💓 Heartbeat démarré (ping toutes les 30s)')
    },

    /**
     * Arrêter le heartbeat
     */
    stopHeartbeat() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval)
        this.heartbeatInterval = null
        console.log('💔 Heartbeat arrêté')
      }
    },

    /**
     * Envoyer un ping d'activité au serveur
     */
    async sendHeartbeat() {
      try {
        await lmsService.heartbeatVisio(this.seance.id)
        console.log('💓 Heartbeat envoyé')
      } catch (error) {
        console.error('[VisioManager] Erreur heartbeat:', error)
        // Si erreur 404 (participation non trouvée), arrêter le heartbeat
        if (error.response?.status === 404) {
          console.warn('⚠️ Participation non trouvée, arrêt du heartbeat')
          this.stopHeartbeat()
          this.isInVisio = false
        }
      }
    },

    /**
     * Enregistrer la sortie de la visio
     */
    async leaveVisio() {
      try {
        const response = await lmsService.leaveVisio(this.seance.id)
        console.log('👋 Sortie de visio enregistrée:', response)
        this.isInVisio = false
      } catch (error) {
        console.error('[VisioManager] Erreur leave visio:', error)
      }
    },

    /**
     * Surveiller la fermeture de la fenêtre Jitsi
     */
    watchVisioWindow() {
      if (!this.visioWindow) return

      const checkClosed = setInterval(() => {
        if (this.visioWindow.closed) {
          clearInterval(checkClosed)
          console.log('🚪 Fenêtre Jitsi fermée, arrêt heartbeat et enregistrement sortie')
          this.stopHeartbeat()
          this.leaveVisio()
          this.visioWindow = null
        }
      }, 1000) // Vérifier toutes les secondes
    }`;

content = content.replace(obsoleteMethods, '');

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Migration terminée :');
console.log('   - JitsiModal retiré du template');
console.log('   - Import et component JitsiModal retirés');
console.log('   - Data properties JitsiModal retirées');
console.log('   - demarrerVisio() modifiée pour utiliser window.open + composable');
console.log('   - rejoindreVisio() modifiée pour utiliser window.open + composable');
console.log('   - Méthodes JitsiModal supprimées (closeJitsiModal, handleJitsiJoined, etc.)');
console.log('   - Méthodes obsolètes supprimées (startHeartbeat, stopHeartbeat, etc.)');
console.log('\n✅ VisioManager.vue utilise maintenant window.open() avec tracking Web Worker');
