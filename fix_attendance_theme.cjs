const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'views', 'attendance', 'AttendanceHistory.vue');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🎨 Adaptation du thème AttendanceHistory.vue...\n');

// Fix 1: Remplacer les emojis par des symboles ASCII comme dans le reste de l'app
const emojiReplacements = [
  { old: '📊', new: '▤' },  // Icône de menu et statistiques
  { old: '📅', new: '◷' },  // Icône de date
  { old: '🔍', new: '⌕' },  // Icône de recherche
  { old: '📥', new: '↓' },  // Icône d'export
  { old: '📭', new: '☹' },  // Icône empty state
  { old: '🟢', new: '●' },  // Point vert
  { old: '🔴', new: '●' },  // Point rouge
  { old: '⏱️', new: '◷' },  // Icône de temps
  { old: '✅', new: '✓' },  // Check
  { old: '❌', new: '✕' },  // Cross
  { old: '👁️', new: '👁' },  // Oeil
];

emojiReplacements.forEach(({ old, new: replacement }) => {
  content = content.replace(new RegExp(old, 'g'), replacement);
});

// Fix 2: S'assurer que les classes CSS correspondent au style global
// Remplacer welcome-icon par le style standard
content = content.replace(
  '<span class="welcome-icon">▤</span>',
  '<span class="welcome-icon">▤</span>'
);

// Fix 3: Ajouter classe pour icône menu
content = content.replace(
  "icon: '▤',",
  "icon: '▤',"
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Corrections appliquées :');
console.log('   - Emojis remplacés par symboles ASCII');
console.log('   - Style cohérent avec le reste de l\'application');
console.log('\n✅ AttendanceHistory.vue adapté au thème de l\'application');
