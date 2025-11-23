<?php
$file = 'src/components/visio/VisioManager.vue';
$content = file_get_contents($file);

// 1. Ajouter JitsiModal dans le template (avant </div>)
$content = str_replace(
    "    <!-- ParticipantsModal -->\n    <ParticipantsModal\n      v-if=\"showParticipantsModal\"\n      :seance-id=\"seance.id\"\n      @close=\"showParticipantsModal = false\"\n    />\n  </div>\n</template>",
    "    <!-- ParticipantsModal -->\n    <ParticipantsModal\n      v-if=\"showParticipantsModal\"\n      :seance-id=\"seance.id\"\n      @close=\"showParticipantsModal = false\"\n    />\n\n    <!-- JitsiModal -->\n    <JitsiModal\n      v-if=\"jitsiModalOpen\"\n      :is-open=\"jitsiModalOpen\"\n      :seance-id=\"seance.id\"\n      :seance-title=\"jitsiModalTitle\"\n      :jitsi-link=\"jitsiModalLink\"\n      :user-name=\"jitsiUserName\"\n      :user-email=\"jitsiUserEmail\"\n      @close=\"closeJitsiModal\"\n      @joined=\"handleJitsiJoined\"\n      @left=\"handleJitsiLeft\"\n      @error=\"handleJitsiError\"\n    />\n  </div>\n</template>",
    $content
);

// 2. Ajouter import JitsiModal
$content = str_replace(
    "import ParticipantsModal from './ParticipantsModal.vue'\nimport { useVisioParticipation } from '@/composables/useVisioParticipation'",
    "import ParticipantsModal from './ParticipantsModal.vue'\nimport JitsiModal from './JitsiModal.vue'\nimport { useVisioParticipation } from '@/composables/useVisioParticipation'",
    $content
);

// 3. Ajouter JitsiModal dans components
$content = str_replace(
    "  components: {\n    ParticipantsModal\n  },",
    "  components: {\n    ParticipantsModal,\n    JitsiModal\n  },",
    $content
);

// 4. Ajouter les données pour JitsiModal
$content = str_replace(
    "  data() {\n    return {\n      loading: false,\n      showParticipantsModal: false,\n      participantCount: 0,\n      currentTime: new Date(),\n      timeCheckInterval: null\n    }\n  },",
    "  data() {\n    return {\n      loading: false,\n      showParticipantsModal: false,\n      participantCount: 0,\n      currentTime: new Date(),\n      timeCheckInterval: null,\n      jitsiModalOpen: false,\n      jitsiModalTitle: '',\n      jitsiModalLink: '',\n      jitsiUserName: '',\n      jitsiUserEmail: ''\n    }\n  },",
    $content
);

// 5. Modifier demarrerVisio (enseignant)
$content = preg_replace(
    '/async demarrerVisio\(\) \{.*?finally \{\s+this\.loading = false\s+\}\s+\}/s',
    'async demarrerVisio() {
      this.loading = true
      try {
        console.log(\'🎥 Démarrage visio par enseignant...\')

        // 1. Démarrer la visio (change status à \'active\')
        const result = await lmsService.startVisio(this.seance.id)

        if (!result.success) {
          alert(`Erreur: ${result.message}`)
          return
        }

        // 2. Générer les paramètres pour JitsiModal
        const roomId = result.data.visio_room_id || this.seance.visio?.room_id
        const matiereName = this.seance.matiere?.libelle || this.seance.matiere?.nom || \'Séance\'

        // 3. Ouvrir la modal Jitsi
        this.jitsiModalOpen = true
        this.jitsiModalTitle = matiereName
        this.jitsiModalLink = `https://meet.jit.si/${roomId}`
        this.jitsiUserName = this.user.nom && this.user.prenom
          ? `${this.user.prenom} ${this.user.nom}`
          : this.user.name || this.user.username || \'Enseignant\'
        this.jitsiUserEmail = this.user.email || \'\'

        console.log(\'✅ Modal Jitsi ouverte pour enseignant\')

        // 4. Rafraîchir les données
        this.$emit(\'visio-updated\', result.data)

      } catch (error) {
        console.error(\'[VisioManager] Erreur démarrage visio:\', error)
        alert(\'Erreur lors du démarrage de la visio: \' + (error.response?.data?.message || error.message))
      } finally {
        this.loading = false
      }
    }',
    $content
);

// 6. Modifier rejoindreVisio (étudiant)
$content = preg_replace(
    '/async rejoindreVisio\(\) \{.*?finally \{\s+this\.loading = false\s+\}\s+\}/s',
    'async rejoindreVisio() {
      if (!this.seance.visio_active) {
        alert(\'La visio n\\'est pas encore démarrée par l\\'enseignant\')
        return
      }

      this.loading = true
      try {
        console.log(\'👨‍🎓 Étudiant rejoint la visio...\')

        // Room ID depuis la séance
        const roomId = this.seance.visio_room_id || this.seance.visio?.room_id

        if (!roomId) {
          alert(\'Erreur: Room ID introuvable\')
          return
        }

        // Préparer les paramètres pour JitsiModal
        const matiereName = this.seance.matiere?.libelle || this.seance.matiere?.nom || \'Séance\'

        // Ouvrir la modal Jitsi
        this.jitsiModalOpen = true
        this.jitsiModalTitle = matiereName
        this.jitsiModalLink = `https://meet.jit.si/${roomId}`
        this.jitsiUserName = this.user.nom && this.user.prenom
          ? `${this.user.prenom} ${this.user.nom}`
          : this.user.name || this.user.username || \'Étudiant\'
        this.jitsiUserEmail = this.user.email || \'\'

        console.log(\'✅ Modal Jitsi ouverte pour étudiant\')

        // Émettre événement pour rafraîchir le compteur de participants
        this.$emit(\'participant-joined\')

      } catch (error) {
        console.error(\'[VisioManager] Erreur rejoindre visio:\', error)
        const errorMessage = error.response?.data?.message || error.message
        alert(\'Erreur lors de la connexion à la visio: \' + errorMessage)
      } finally {
        this.loading = false
      }
    }',
    $content
);

// 7. Ajouter les méthodes de gestion de la JitsiModal
$oldMethods = '    /**
     * Charger le nombre de participants
     */
    async loadParticipantCount()';

$newMethods = '    /**
     * Fermer la modal Jitsi
     */
    closeJitsiModal() {
      console.log(\'[VisioManager] Fermeture modal Jitsi\')
      this.jitsiModalOpen = false
      this.jitsiModalTitle = \'\'
      this.jitsiModalLink = \'\'
      this.jitsiUserName = \'\'
      this.jitsiUserEmail = \'\'
      
      // Rafraîchir les données
      this.$emit(\'visio-updated\')
    },

    /**
     * Événement: Utilisateur a rejoint via Jitsi API
     */
    handleJitsiJoined(event) {
      console.log(\'[VisioManager] Utilisateur a rejoint via Jitsi API\', event)
      this.$emit(\'participant-joined\')
    },

    /**
     * Événement: Utilisateur a quitté via Jitsi API
     */
    handleJitsiLeft(event) {
      console.log(\'[VisioManager] Utilisateur a quitté via Jitsi API\', event)
      this.$emit(\'participant-left\')
    },

    /**
     * Événement: Erreur Jitsi
     */
    handleJitsiError(error) {
      console.error(\'[VisioManager] Erreur Jitsi\', error)
      alert(\'Erreur lors de la connexion à la visioconférence\')
    },

    /**
     * Charger le nombre de participants
     */
    async loadParticipantCount()';

$content = str_replace($oldMethods, $newMethods, $content);

// Sauvegarder
file_put_contents($file, $content);

echo "✅ VisioManager.vue migré vers JitsiModal\n";
echo "   - JitsiModal ajouté au template\n";
echo "   - Import et component ajoutés\n";
echo "   - Data properties pour modal ajoutées\n";
echo "   - demarrerVisio() modifié (enseignant)\n";
echo "   - rejoindreVisio() modifié (étudiant)\n";
echo "   - Méthodes de gestion de modal ajoutées\n";
