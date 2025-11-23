const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'views', 'attendance', 'AttendanceHistory.vue');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🎨 Correction des couleurs du thème...\n');

// Fix 1: Supprimer le gradient violet du header et utiliser un header simple comme AdminClasses
const oldHeader = `<style scoped>
.attendance-history-container {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.welcome-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.welcome-icon {
  font-size: 3rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: bold;
  margin: 0;
}

.page-subtitle {
  margin: 0.5rem 0 0;
  opacity: 0.9;
}`;

const newHeader = `<style scoped>
.attendance-history-container {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.welcome-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.welcome-icon {
  font-size: 2.5rem;
  color: #3b82f6;
}

.page-title {
  font-size: 1.875rem;
  font-weight: bold;
  margin: 0;
  color: #111827;
}

.page-subtitle {
  margin: 0.5rem 0 0;
  color: #6b7280;
}`;

content = content.replace(oldHeader, newHeader);

// Fix 2: Simplifier le background des cartes
content = content.replace(
  /\.filters-card \{[^}]+\}/g,
  `.filters-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}`
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Couleurs corrigées :');
console.log('   - Header sans gradient (style simple comme AdminClasses)');
console.log('   - Icône bleue (#3b82f6)');
console.log('   - Titre noir, sous-titre gris');
console.log('\n✅ Thème adapté au style de l\'application');
