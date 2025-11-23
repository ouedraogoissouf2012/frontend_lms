// Script Node.js pour retirer JitsiModal de TeacherSeances.vue
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'views', 'TeacherSeances.vue');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Revert TeacherSeances.vue - Retirer JitsiModal, restaurer window.open()...\n');

// 1. Retirer JitsiModal du template
content = content.replace(
  `    <!-- Modal Jitsi -->
    <JitsiModal
      v-if="jitsiModal.isOpen"
      :is-open="jitsiModal.isOpen"
      :seance-id="jitsiModal.seanceId"
      :seance-title="jitsiModal.seanceTitle"
      :jitsi-link="jitsiModal.jitsiLink"
      :user-name="jitsiModal.userName"
      :user-email="jitsiModal.userEmail"
      @close="closeJitsiModal"
      @joined="handleJitsiJoined"
      @left="handleJitsiLeft"
      @error="handleJitsiError"
    />`,
  ``
);

// 2. Retirer import JitsiModal
content = content.replace(
  `import JitsiModal from '@/components/visio/JitsiModal.vue'`,
  ``
);

// 3. Ajouter import useVisioParticipation (après DashboardLayout import)
content = content.replace(
  `import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { lmsService } from '@/services/lms'`,
  `import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { useVisioParticipation } from '@/composables/useVisioParticipation'
import { lmsService } from '@/services/lms'`
);

// 4. Retirer reactive jitsiModal et ajouter visioParticipation
content = content.replace(
  `const jitsiModal = reactive({
  isOpen: false,
  seanceId: null,
  seanceTitle: '',
  jitsiLink: '',
  userName: '',
  userEmail: ''
})`,
  `// visioParticipation sera créé dynamiquement pour chaque séance
const visioParticipations = reactive({})`
);

// 5. Remplacer handleJoinVisio pour utiliser useVisioParticipation
const oldHandleJoinVisio = `async function handleJoinVisio(seance) {
  try {
    console.log('[VISIO] Rejoindre visio:', seance.id)

    // Ouvrir la modal Jitsi
    const roomId = seance.visio.room_id
    const matiereName = seance.matiere?.nom || 'Séance'

    jitsiModal.isOpen = true
    jitsiModal.seanceId = seance.id
    jitsiModal.seanceTitle = matiereName
    jitsiModal.jitsiLink = \`https://meet.jit.si/\${roomId}\`
    jitsiModal.userName = currentUser.nom && currentUser.prenom
      ? \`\${currentUser.prenom} \${currentUser.nom}\`
      : currentUser.username || 'Utilisateur'
    jitsiModal.userEmail = currentUser.email || ''

    console.log('[VISIO] Modal Jitsi ouverte')
  } catch (error) {
    console.error('[ERREUR] Join visio:', error)
  }
}`;

const newHandleJoinVisio = `async function handleJoinVisio(seance) {
  try {
    console.log('[VISIO] Rejoindre visio:', seance.id)

    // Créer le composable pour cette séance si pas déjà créé
    if (!visioParticipations[seance.id]) {
      visioParticipations[seance.id] = useVisioParticipation(seance.id)
    }

    // Ouvrir window.open avec tracking
    const roomId = seance.visio.room_id
    const jitsiLink = \`https://meet.jit.si/\${roomId}\`

    await visioParticipations[seance.id].joinVisio(jitsiLink)

    console.log('[VISIO] Visio rejointe avec window.open + tracking Web Worker')

    // Rafraîchir les séances pour mettre à jour le compteur de participants
    localStorage.removeItem(CACHE_KEY_SEANCES)
    loadSeances()
  } catch (error) {
    console.error('[ERREUR] Join visio:', error)
    alert('Erreur lors de la connexion à la visio: ' + error.message)
  }
}`;

content = content.replace(oldHandleJoinVisio, newHandleJoinVisio);

// 6. Supprimer les handlers JitsiModal (closeJitsiModal, handleJitsiJoined, etc.)
const handlersToRemove = `// Gestion des événements de la modal Jitsi
function closeJitsiModal() {
  console.log('[VISIO] Fermeture modal Jitsi')
  jitsiModal.isOpen = false
  jitsiModal.seanceId = null
  jitsiModal.seanceTitle = ''
  jitsiModal.jitsiLink = ''
  jitsiModal.userName = ''
  jitsiModal.userEmail = ''

  // Rafraîchir les séances pour mettre à jour le compteur de participants
  localStorage.removeItem(CACHE_KEY_SEANCES)
  loadSeances()
}

function handleJitsiJoined(event) {
  console.log('[VISIO] Utilisateur a rejoint la visio:', event)
  // Rafraîchir les séances
  localStorage.removeItem(CACHE_KEY_SEANCES)
  loadSeances()
}

function handleJitsiLeft(event) {
  console.log('[VISIO] Utilisateur a quitté la visio:', event)
  // Rafraîchir les séances
  localStorage.removeItem(CACHE_KEY_SEANCES)
  loadSeances()
}

function handleJitsiError(error) {
  console.error('[VISIO] Erreur lors de la connexion Jitsi:', error)
  alert('Erreur lors de la connexion à la visioconférence')
}`;

content = content.replace(handlersToRemove, '');

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Migration terminée :');
console.log('   - JitsiModal retiré du template');
console.log('   - Import JitsiModal retiré');
console.log('   - Import useVisioParticipation ajouté');
console.log('   - jitsiModal reactive remplacé par visioParticipations');
console.log('   - handleJoinVisio() modifié pour utiliser window.open + composable');
console.log('   - Handlers JitsiModal supprimés');
console.log('\n✅ TeacherSeances.vue utilise maintenant window.open() avec tracking Web Worker');
