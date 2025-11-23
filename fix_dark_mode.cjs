const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'views', 'attendance', 'AttendanceHistory.vue');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🌙 Adaptation pour le mode sombre...\n');

// Mapping des couleurs en dur vers les variables CSS
const colorReplacements = [
  // Backgrounds
  { old: /background:\s*white;/g, new: 'background: var(--bg-primary);' },
  { old: /background-color:\s*white;/g, new: 'background-color: var(--bg-primary);' },
  { old: /background:\s*#fff;/g, new: 'background: var(--bg-primary);' },
  { old: /background:\s*#ffffff;/g, new: 'background: var(--bg-primary);' },

  // Backgrounds secondaires (hover, etc.)
  { old: /background:\s*#f9fafb;/g, new: 'background: var(--bg-secondary);' },
  { old: /background:\s*#f3f4f6;/g, new: 'background: var(--bg-hover);' },

  // Text colors
  { old: /color:\s*#111827;/g, new: 'color: var(--text-primary);' },
  { old: /color:\s*#1f2937;/g, new: 'color: var(--text-primary);' },
  { old: /color:\s*#374151;/g, new: 'color: var(--text-primary);' },
  { old: /color:\s*#6b7280;/g, new: 'color: var(--text-secondary);' },
  { old: /color:\s*#9ca3af;/g, new: 'color: var(--text-tertiary);' },

  // Borders
  { old: /border:\s*1px solid #e5e7eb;/g, new: 'border: 1px solid var(--border-color);' },
  { old: /border:\s*1px solid #d1d5db;/g, new: 'border: 1px solid var(--border-color);' },
  { old: /border-top:\s*1px solid #e5e7eb;/g, new: 'border-top: 1px solid var(--border-color);' },
  { old: /border-bottom:\s*1px solid #e5e7eb;/g, new: 'border-bottom: 1px solid var(--border-color);' },
  { old: /border-color:\s*#e5e7eb;/g, new: 'border-color: var(--border-color);' },
  { old: /border-color:\s*#d1d5db;/g, new: 'border-color: var(--border-color);' },

  // Input backgrounds
  { old: /\.filter-input,\s*\.filter-select\s*{[^}]*background:\s*white;/g,
    new: `.filter-input,
.filter-select {
  padding: 0.625rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: var(--input-bg);
  color: var(--text-primary);` },
];

// Appliquer les remplacements
colorReplacements.forEach(({ old, new: replacement }) => {
  if (content.match(old)) {
    content = content.replace(old, replacement);
    console.log(`✓ Remplacé: ${old.toString().substring(0, 40)}...`);
  }
});

// Corrections spécifiques pour les cartes
content = content.replace(
  /\.stat-card\s*{[^}]+}/g,
  `.stat-card {
  background: var(--bg-primary);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
}`
);

content = content.replace(
  /\.table-card\s*{[^}]+}/g,
  `.table-card {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}`
);

// Correction pour le tableau
content = content.replace(
  /\.data-table thead\s*{[^}]+}/g,
  `.data-table thead {
  background: var(--bg-secondary);
}`
);

content = content.replace(
  /\.data-table tbody tr:hover\s*{[^}]+}/g,
  `.data-table tbody tr:hover {
  background: var(--bg-hover);
}`
);

// Modal
content = content.replace(
  /\.modal-content\s*{[^}]+background:\s*white;[^}]+}/g,
  `.modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}`
);

// Detail items
content = content.replace(
  /\.detail-item\s*{[^}]+background:\s*#f9fafb;[^}]+}/g,
  `.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 8px;
}`
);

content = content.replace(
  /\.detail-label\s*{[^}]+}/g,
  `.detail-label {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.875rem;
}`
);

content = content.replace(
  /\.detail-value\s*{[^}]+}/g,
  `.detail-value {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
  text-align: right;
}`
);

// Empty state
content = content.replace(
  /\.empty-state\s*{[^}]+}/g,
  `.empty-state {
  padding: 4rem 2rem;
  text-align: center;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}`
);

content = content.replace(
  /\.empty-message\s*{[^}]+}/g,
  `.empty-message {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}`
);

content = content.replace(
  /\.empty-hint\s*{[^}]+}/g,
  `.empty-hint {
  color: var(--text-secondary);
  font-size: 0.875rem;
}`
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Mode sombre adapté :');
console.log('   - Backgrounds: white → var(--bg-primary)');
console.log('   - Text colors: #111827 → var(--text-primary)');
console.log('   - Text colors: #6b7280 → var(--text-secondary)');
console.log('   - Borders: #e5e7eb → var(--border-color)');
console.log('   - Inputs: background → var(--input-bg)');
console.log('\n✅ Le thème fonctionne maintenant en mode sombre et clair');
