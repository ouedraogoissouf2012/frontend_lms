// Script Node.js pour migrer VisioManager.vue vers JitsiModal
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'visio', 'VisioManager.vue');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Migration de VisioManager.vue vers JitsiModal...\n');

// 1. Ajouter JitsiModal dans le template
content = content.replace(
  `    <!-- ParticipantsModal -->
    <ParticipantsModal
      v-if="showParticipantsModal"
      :seance-id="seance.id"
      @close="showParticipantsModal = false"
    />
  </div>
</template>`,
  `    <!-- ParticipantsModal -->
    <ParticipantsModal
      v-if="showParticipantsModal"
      :seance-id="seance.id"
      @close="showParticipantsModal = false"
    />

    <!-- JitsiModal -->
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
    />
  </div>
</template>`
);

// 2. Ajouter import JitsiModal
content = content.replace(
  `import ParticipantsModal from './ParticipantsModal.vue'
import { useVisioParticipation } from '@/composables/useVisioParticipation'`,
  `import ParticipantsModal from './ParticipantsModal.vue'
import JitsiModal from './JitsiModal.vue'
import { useVisioParticipation } from '@/composables/useVisioParticipation'`
);

// 3. Ajouter JitsiModal dans components
content = content.replace(
  `  components: {
    ParticipantsModal
  },`,
  `  components: {
    ParticipantsModal,
    JitsiModal
  },`
);

// 4. Ajouter les données pour JitsiModal
content = content.replace(
  `  data() {
    return {
      loading: false,
      showParticipantsModal: false,
      participantCount: 0,
      currentTime: new Date(),
      timeCheckInterval: null
    }
  },`,
  `  data() {
    return {
      loading: false,
      showParticipantsModal: false,
      participantCount: 0,
      currentTime: new Date(),
      timeCheckInterval: null,
      jitsiModalOpen: false,
      jitsiModalTitle: '',
      jitsiModalLink: '',
      jitsiUserName: '',
      jitsiUserEmail: ''
    }
  },`
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Migration terminée :');
console.log('   - JitsiModal ajouté au template');
console.log('   - Import et component ajoutés');
console.log('   - Data properties pour modal ajoutées');
console.log('\n⚠️  Note: Les méthodes demarrerVisio() et rejoindreVisio() doivent être modifiées manuellement');
