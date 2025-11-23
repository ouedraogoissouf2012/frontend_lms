#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour corriger MatiereDetailsModern.vue
- Ajoute l'import lmsService
- Remplace l'appel à klassciService.getSeancesByMatiere par lmsService.getMyClassesSeances
"""

import re
import sys

# Fix encoding pour Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

file_path = r"C:\Users\USER PC\Documents\propre à moi\lms-frontend\src\views\matieres\MatiereDetailsModern.vue"

# Lire le fichier
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Ajouter l'import lmsService si pas déjà présent
if "import lmsService from '@/services/lms'" not in content:
    content = content.replace(
        "import lessonService from '@/services/lesson'",
        "import lessonService from '@/services/lesson'\nimport lmsService from '@/services/lms'"
    )
    print("[OK] Import lmsService ajoute")
else:
    print("[INFO] Import lmsService deja present")

# 2. Remplacer l'appel API
old_code = "this.seances = await klassciService.getSeancesByMatiere(matiereId)"
new_code = """// Charger TOUTES les seances de l'etudiant via LMS (avec filtres backend)
        const allSeancesResponse = await lmsService.getMyClassesSeances()

        // Filtrer par matiere cote client
        this.seances = (allSeancesResponse.data || allSeancesResponse || []).filter(s => {
          // Comparer par ID de matiere
          return s.matiere?.id == matiereId || s.klassci_matiere_id == matiereId
        })

        console.log('[OK] Seances filtrees pour matiere', matiereId, ':', this.seances.length)"""

if old_code in content:
    content = content.replace(old_code, new_code)
    print("[OK] Appel API remplace")
else:
    print("[WARN] Code original non trouve (peut-etre deja modifie)")

# Écrire le fichier modifié
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n[SUCCESS] Fichier modifie avec succes!")
print(f"[FILE] {file_path}")
print("\n[NEXT STEPS]:")
print("1. cd C:/Users/USER PC/Documents/propre a moi/lms-frontend")
print("2. npm run build")
print("3. Tester dans le navigateur")
