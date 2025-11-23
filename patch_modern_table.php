<?php

$file = 'src/views/admin/AdminMatieres.vue';
$content = file_get_contents($file);

// Nouveau CSS moderne inspiré de l'exemple
$newTableCSS = <<<'CSS'
/* Modern Table Container */
.modern-table-container {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 2rem;
}

/* Modern Table */
.modern-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--card-bg);
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Table Header - Style bleu vif comme l'exemple */
.modern-table thead {
  background: linear-gradient(135deg, #4a90e2 0%, #5a9df2 100%);
}

.modern-table thead tr {
  background: transparent;
}

.modern-table th {
  padding: 1rem 1.25rem;
  text-align: left;
  font-weight: 700;
  font-size: 0.8125rem;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: none;
}

/* Table Body */
.modern-table tbody tr {
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.15s ease;
}

.modern-table tbody tr:hover {
  background: var(--hover-bg);
}

.modern-table tbody tr:last-child {
  border-bottom: none;
}

.modern-table td {
  padding: 1.125rem 1.25rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  vertical-align: middle;
}

/* Matiere Cell avec indicateur de couleur */
.matiere-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.matiere-indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.matiere-text {
  font-weight: 600;
  color: var(--text-primary);
}

/* Text Content - pour les listes (filières, niveaux) */
.text-content {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.list-item {
  display: block;
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1.4;
}

.empty-value {
  color: var(--text-secondary);
  font-style: italic;
}

/* Centered Cell - pour les valeurs numériques */
.centered-cell {
  text-align: center;
  font-weight: 500;
  color: var(--text-primary);
}

/* Actions Cell */
.actions-cell {
  text-align: center;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: var(--hover-bg);
  color: var(--primary-color);
}

.icon-btn .icon {
  width: 1.125rem;
  height: 1.125rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .modern-table th,
  .modern-table td {
    padding: 0.875rem 1rem;
    font-size: 0.8125rem;
  }
}

CSS;

// Trouver et remplacer l'ancien CSS du tableau
// On cherche depuis "/* Floating Table Container */" jusqu'à "/* Empty state" ou ".empty-state"

$pattern = '/\/\* Floating Table Container \*\/.*?(?=\/\* Empty state|\.empty-state)/s';

if (preg_match($pattern, $content)) {
    $content = preg_replace($pattern, $newTableCSS . "\n\n", $content);
    file_put_contents($file, $content);
    echo "✅ CSS du tableau moderne appliqué avec succès!\n";
} else {
    echo "❌ Pattern non trouvé, tentative alternative...\n";

    // Alternative: chercher .floating-table-container jusqu'à .empty-state
    $lines = explode("\n", $content);
    $startIdx = -1;
    $endIdx = -1;

    foreach ($lines as $idx => $line) {
        if (strpos($line, '.floating-table-container') !== false && $startIdx === -1) {
            $startIdx = $idx;
        }
        if (strpos($line, '.empty-state') !== false && $endIdx === -1) {
            $endIdx = $idx;
            break;
        }
    }

    if ($startIdx !== -1 && $endIdx !== -1) {
        // Supprimer les anciennes lignes et insérer le nouveau CSS
        array_splice($lines, $startIdx, $endIdx - $startIdx, explode("\n", $newTableCSS . "\n"));
        $content = implode("\n", $lines);
        file_put_contents($file, $content);
        echo "✅ CSS du tableau moderne appliqué (méthode alternative)!\n";
        echo "   Lignes remplacées: " . ($endIdx - $startIdx) . "\n";
        echo "   De la ligne: $startIdx à $endIdx\n";
    } else {
        echo "❌ Impossible de trouver les marqueurs de début/fin\n";
        echo "   startIdx: $startIdx, endIdx: $endIdx\n";
    }
}
