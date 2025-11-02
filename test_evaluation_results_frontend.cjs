/**
 * TEST FRONTEND - RÉSULTATS ÉVALUATIONS
 * ======================================
 * Validation du composant Vue et de l'intégration
 */

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║   TEST FRONTEND - RÉSULTATS ÉVALUATIONS                        ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let score = 0;
let maxScore = 0;
const tests = {};

// ============================================
// TEST 1: Vérification fichier composant Vue
// ============================================
maxScore += 15;
console.log('🔍 TEST 1: Vérification fichier AdminEvaluationResults.vue...');
try {
    const componentPath = path.join(__dirname, 'src/views/admin/AdminEvaluationResults.vue');
    const componentExists = fs.existsSync(componentPath);

    if (componentExists) {
        const content = fs.readFileSync(componentPath, 'utf8');
        const size = content.length;

        console.log(`   ✅ Fichier existe (${size} caractères)`);

        // Vérifier les sections clés
        const hasTemplate = content.includes('<template>');
        const hasScript = content.includes('<script setup>');
        const hasStyle = content.includes('<style scoped>');

        if (hasTemplate && hasScript && hasStyle) {
            console.log('   ✅ Sections template, script et style présentes');
            score += 15;
            tests.component_structure = { status: 'PASS', points: 15 };
        } else {
            console.log('   ⚠️  Certaines sections manquantes');
            score += 10;
            tests.component_structure = { status: 'PARTIAL', points: 10 };
        }
    } else {
        console.log('   ❌ Fichier composant non trouvé');
        tests.component_structure = { status: 'FAIL', points: 0 };
    }
} catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
    tests.component_structure = { status: 'ERROR', points: 0, error: error.message };
}
console.log('');

// ============================================
// TEST 2: Vérification des emoticônes
// ============================================
maxScore += 10;
console.log('🔍 TEST 2: Vérification des emoticônes...');
try {
    const componentPath = path.join(__dirname, 'src/views/admin/AdminEvaluationResults.vue');
    const content = fs.readFileSync(componentPath, 'utf8');

    const emojis = ['📊', '🏫', '📝', '🔄', '👥', '✅', '📈', '🎯', '📚', '💯', '🔍', '📥', '📄', '⏳', '⚠️'];
    let foundEmojis = 0;

    emojis.forEach(emoji => {
        if (content.includes(emoji)) {
            foundEmojis++;
        }
    });

    console.log(`   📊 Emoticônes trouvées: ${foundEmojis}/${emojis.length}`);

    if (foundEmojis >= 12) {
        console.log('   ✅ Bonne utilisation des emoticônes');
        score += 10;
        tests.emojis = { status: 'PASS', points: 10, found: foundEmojis };
    } else if (foundEmojis >= 8) {
        console.log('   ⚠️  Emoticônes partiellement utilisées');
        score += 7;
        tests.emojis = { status: 'PARTIAL', points: 7, found: foundEmojis };
    } else {
        console.log('   ❌ Peu d\'emoticônes trouvées');
        tests.emojis = { status: 'FAIL', points: 0, found: foundEmojis };
    }
} catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
    tests.emojis = { status: 'ERROR', points: 0, error: error.message };
}
console.log('');

// ============================================
// TEST 3: Vérification variables CSS du thème
// ============================================
maxScore += 15;
console.log('🔍 TEST 3: Vérification utilisation des variables du thème...');
try {
    const componentPath = path.join(__dirname, 'src/views/admin/AdminEvaluationResults.vue');
    const content = fs.readFileSync(componentPath, 'utf8');

    const themeVars = [
        'var(--card-bg)',
        'var(--text-primary)',
        'var(--text-secondary)',
        'var(--input-bg)',
        'var(--border-primary)',
        'var(--spacing-',
        'var(--font-size-',
        'var(--radius-'
    ];

    let varsUsed = 0;
    themeVars.forEach(varName => {
        if (content.includes(varName)) {
            varsUsed++;
        }
    });

    console.log(`   📊 Variables CSS utilisées: ${varsUsed}/${themeVars.length}`);

    if (varsUsed >= 7) {
        console.log('   ✅ Excellent respect du système de thème');
        score += 15;
        tests.theme_vars = { status: 'PASS', points: 15 };
    } else if (varsUsed >= 4) {
        console.log('   ⚠️  Variables partiellement utilisées');
        score += 10;
        tests.theme_vars = { status: 'PARTIAL', points: 10 };
    } else {
        console.log('   ❌ Variables du thème peu utilisées');
        tests.theme_vars = { status: 'FAIL', points: 0 };
    }
} catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
    tests.theme_vars = { status: 'ERROR', points: 0, error: error.message };
}
console.log('');

// ============================================
// TEST 4: Vérification service API
// ============================================
maxScore += 15;
console.log('🔍 TEST 4: Vérification service evaluation.js...');
try {
    const servicePath = path.join(__dirname, 'src/services/evaluation.js');
    const content = fs.readFileSync(servicePath, 'utf8');

    const hasMethod = content.includes('getEvaluationResultsByClass');
    const hasApiCall = content.includes('/evaluations/${id}/results-by-class');

    if (hasMethod && hasApiCall) {
        console.log('   ✅ Méthode getEvaluationResultsByClass présente');
        console.log('   ✅ Appel API correctement défini');
        score += 15;
        tests.api_service = { status: 'PASS', points: 15 };
    } else {
        console.log('   ⚠️  Service incomplet');
        score += 7;
        tests.api_service = { status: 'PARTIAL', points: 7 };
    }
} catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
    tests.api_service = { status: 'ERROR', points: 0, error: error.message };
}
console.log('');

// ============================================
// TEST 5: Vérification router
// ============================================
maxScore += 10;
console.log('🔍 TEST 5: Vérification route dans router/index.js...');
try {
    const routerPath = path.join(__dirname, 'src/router/index.js');
    const content = fs.readFileSync(routerPath, 'utf8');

    const hasRoute = content.includes('AdminEvaluationResults');
    const hasPath = content.includes('/admin/evaluations/results');
    const hasRoles = content.includes("roles: ['superAdmin', 'coordinateur']");

    if (hasRoute && hasPath && hasRoles) {
        console.log('   ✅ Route /admin/evaluations/results configurée');
        console.log('   ✅ Permissions coordinateur et superAdmin définies');
        score += 10;
        tests.router = { status: 'PASS', points: 10 };
    } else {
        console.log('   ⚠️  Configuration route incomplète');
        score += 5;
        tests.router = { status: 'PARTIAL', points: 5 };
    }
} catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
    tests.router = { status: 'ERROR', points: 0, error: error.message };
}
console.log('');

// ============================================
// TEST 6: Vérification menu sidebar
// ============================================
maxScore += 10;
console.log('🔍 TEST 6: Vérification menu dans Sidebar.vue...');
try {
    const sidebarPath = path.join(__dirname, 'src/components/layout/Sidebar.vue');
    const content = fs.readFileSync(sidebarPath, 'utf8');

    const hasMenuItem = content.includes('Résultats Évaluations');
    const hasIcon = content.includes("icon: '📊'");
    const hasLink = content.includes("to: '/admin/evaluations/results'");

    if (hasMenuItem && hasIcon && hasLink) {
        console.log('   ✅ Item de menu présent avec icône 📊');
        console.log('   ✅ Lien vers /admin/evaluations/results');
        score += 10;
        tests.sidebar = { status: 'PASS', points: 10 };
    } else {
        console.log('   ⚠️  Menu sidebar incomplet');
        score += 5;
        tests.sidebar = { status: 'PARTIAL', points: 5 };
    }
} catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
    tests.sidebar = { status: 'ERROR', points: 0, error: error.message };
}
console.log('');

// ============================================
// TEST 7: Vérification packages npm
// ============================================
maxScore += 10;
console.log('🔍 TEST 7: Vérification packages npm (xlsx, jspdf)...');
try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    const hasXlsx = packageJson.dependencies && packageJson.dependencies.xlsx;
    const hasJsPdf = packageJson.dependencies && packageJson.dependencies.jspdf;
    const hasAutoTable = packageJson.dependencies && packageJson.dependencies['jspdf-autotable'];

    if (hasXlsx && hasJsPdf && hasAutoTable) {
        console.log(`   ✅ xlsx: ${packageJson.dependencies.xlsx}`);
        console.log(`   ✅ jspdf: ${packageJson.dependencies.jspdf}`);
        console.log(`   ✅ jspdf-autotable: ${packageJson.dependencies['jspdf-autotable']}`);
        score += 10;
        tests.packages = { status: 'PASS', points: 10 };
    } else {
        console.log('   ⚠️  Certains packages manquants');
        score += 5;
        tests.packages = { status: 'PARTIAL', points: 5 };
    }
} catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
    tests.packages = { status: 'ERROR', points: 0, error: error.message };
}
console.log('');

// ============================================
// TEST 8: Vérification fonctions export
// ============================================
maxScore += 15;
console.log('🔍 TEST 8: Vérification fonctions export (Excel/PDF)...');
try {
    const componentPath = path.join(__dirname, 'src/views/admin/AdminEvaluationResults.vue');
    const content = fs.readFileSync(componentPath, 'utf8');

    const hasExportExcel = content.includes('function exportToExcel');
    const hasExportPdf = content.includes('function exportToPDF');
    const hasXlsxImport = content.includes("import * as XLSX from 'xlsx'");
    const hasJsPdfImport = content.includes("import jsPDF from 'jspdf'");

    if (hasExportExcel && hasExportPdf && hasXlsxImport && hasJsPdfImport) {
        console.log('   ✅ Fonction exportToExcel définie');
        console.log('   ✅ Fonction exportToPDF définie');
        console.log('   ✅ Imports XLSX et jsPDF présents');
        score += 15;
        tests.export_functions = { status: 'PASS', points: 15 };
    } else {
        console.log('   ⚠️  Fonctions export incomplètes');
        score += 10;
        tests.export_functions = { status: 'PARTIAL', points: 10 };
    }
} catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
    tests.export_functions = { status: 'ERROR', points: 0, error: error.message };
}
console.log('');

// ============================================
// RAPPORT FINAL
// ============================================
console.log('═══════════════════════════════════════════════════════════════');
console.log('                    RAPPORT DE TEST FRONTEND                    ');
console.log('═══════════════════════════════════════════════════════════════\n');

const percentage = (score / maxScore) * 100;

console.log('📊 RÉSUMÉ DES TESTS:');
console.log('──────────────────────────────────────────────────────────────');
Object.entries(tests).forEach(([testName, result]) => {
    const status = result.status;
    const icon = status === 'PASS' ? '✅' : (status === 'PARTIAL' ? '⚠️' : '❌');
    const label = testName.replace(/_/g, ' ').toUpperCase();
    console.log(`   ${icon} ${label.padEnd(35)} ${result.points} points`);
});
console.log('');

console.log('═══════════════════════════════════════════════════════════════');
console.log(`   SCORE TOTAL: ${score} / ${maxScore} points (${percentage.toFixed(1)}%)`);
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('═══════════════════════════════════════════════════════════════');
console.log('                    FIN DU TEST FRONTEND                        ');
console.log('═══════════════════════════════════════════════════════════════');
