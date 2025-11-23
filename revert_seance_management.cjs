// Script Node.js pour retirer JitsiModal de SeanceManagement.vue
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'views', 'coordinateur', 'SeanceManagement.vue');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Revert SeanceManagement.vue - Retirer JitsiModal, restaurer window.open()...\n');

// 1. Retirer JitsiModal du template
content = content.replace(
  `    <JitsiModal
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

// 3. Ajouter import useVisioParticipation (après les autres imports)
content = content.replace(
  `import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'`,
  `import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { useVisioParticipation } from '@/composables/useVisioParticipation'`
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
// D'abord trouver le pattern exact (peut être différent selon le fichier)
const oldHandleJoinVisioPattern1 = /async function handleJoinVisio\(seance\) \{[\s\S]*?console\.log\('\[VISIO\] Modal Jitsi ouverte'\)[\s\S]*?\}/;
const oldHandleJoinVisioPattern2 = /const handleJoinVisio = async \(seance\) => \{[\s\S]*?console\.log\('\[VISIO\] Modal Jitsi ouverte'\)[\s\S]*?\}/;

const newHandleJoinVisio = `const handleJoinVisio = async (seance) => {
  try {
    console.log('[VISIO] Rejoindre visio coordinateur:', seance.id)

    // Créer le composable pour cette séance si pas déjà créé
    if (!visioParticipations[seance.id]) {
      visioParticipations[seance.id] = useVisioParticipation(seance.id)
    }

    // Ouvrir window.open avec tracking
    const roomId = seance.visio_room_id
    const jitsiLink = \`https://meet.jit.si/\${roomId}\`

    await visioParticipations[seance.id].joinVisio(jitsiLink)

    console.log('[VISIO] Coordinateur a rejoint avec window.open + tracking Web Worker')

    // Rafraîchir les séances
    await loadSeances()
  } catch (error) {
    console.error('[ERREUR] Join visio coordinateur:', error)
    alert('Erreur lors de la connexion à la visio: ' + error.message)
  }
}`;

if (oldHandleJoinVisioPattern1.test(content)) {
  content = content.replace(oldHandleJoinVisioPattern1, newHandleJoinVisio);
} else if (oldHandleJoinVisioPattern2.test(content)) {
  content = content.replace(oldHandleJoinVisioPattern2, newHandleJoinVisio);
} else {
  console.warn('⚠️  Pattern handleJoinVisio non trouvé, recherche manuelle nécessaire');
}

// 6. Supprimer closeJitsiModal
const closeJitsiPattern = /const closeJitsiModal = \(\) => \{[\s\S]*?\n\}/;
content = content.replace(closeJitsiPattern, '');

// 7. Supprimer handleJitsiJoined, handleJitsiLeft, handleJitsiError (s'ils existent)
const handleJitsiJoinedPattern = /const handleJitsiJoined = \([\s\S]*?\) => \{[\s\S]*?\n\}/;
const handleJitsiLeftPattern = /const handleJitsiLeft = \([\s\S]*?\) => \{[\s\S]*?\n\}/;
const handleJitsiErrorPattern = /const handleJitsiError = \([\s\S]*?\) => \{[\s\S]*?\n\}/;

content = content.replace(handleJitsiJoinedPattern, '');
content = content.replace(handleJitsiLeftPattern, '');
content = content.replace(handleJitsiErrorPattern, '');

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Migration terminée :');
console.log('   - JitsiModal retiré du template');
console.log('   - Import JitsiModal retiré');
console.log('   - Import useVisioParticipation ajouté');
console.log('   - jitsiModal reactive remplacé par visioParticipations');
console.log('   - handleJoinVisio() modifié pour utiliser window.open + composable');
console.log('   - Handlers JitsiModal supprimés');
console.log('\n✅ SeanceManagement.vue utilise maintenant window.open() avec tracking Web Worker');
