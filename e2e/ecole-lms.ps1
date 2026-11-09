# École créée depuis le LMS, montée par les CHEMINS DU PRODUIT, pour l'E2E en CI (D110/D111).
#
# SOURCE : copie adaptée de `outils/e2e-ecole-autonome.ps1`, écrit par Fille 1 pour le banc E2E
# local du 30/10/2026 (D65), avec l'accord de la superviseure (D111). Adaptations :
#   - les chemins sont des paramètres (plus de chemins Windows) ;
#   - le mot de passe commun vient de E2E_MOT_DE_PASSE, tiré au hasard à chaque run ;
#   - le supradmin est celui de SupradminSeeder, aux valeurs fictives de la CI ;
#   - les identifiants créés (classes, matières, leçons) sont écrits en JSON pour le parcours.
#
# Seule étape hors HTTP : la validation de la demande, par le SERVICE du produit dans tinker.
# Règle gardée : à la PREMIÈRE réponse inattendue, le script s'arrête et écrit la réponse brute.
# Rien n'est inséré à la main pour combler un trou. Toutes les données sont fictives (@e2e.test).
#
# Usage : pwsh -File e2e/ecole-lms.ps1 -Api http://127.0.0.1:8000/api -Backend <dossier lms> -Sortie <dossier>

param(
    [Parameter(Mandatory)][string]$Api,
    [Parameter(Mandatory)][string]$Backend,
    [Parameter(Mandatory)][string]$Sortie
)

$ErrorActionPreference = 'Stop'
$MotDePasse = $env:E2E_MOT_DE_PASSE
if (-not $MotDePasse) { throw 'E2E_MOT_DE_PASSE est requis.' }
$Slug = 'e2e-ecole-lms'
New-Item -ItemType Directory -Force -Path $Sortie | Out-Null
$Journal = Join-Path $Sortie 'ecole-lms.log'

# Aucune requête de ce script ne sort de la machine.
$env:HTTP_PROXY = 'http://127.0.0.1:9'
$env:HTTPS_PROXY = 'http://127.0.0.1:9'
$env:NO_PROXY = '127.0.0.1,localhost'

function Appeler {
    param(
        [string]$Etape, [string]$Methode, [string]$Chemin, $Corps = $null,
        [string]$Jeton = $null, [hashtable]$EnTetes = @{}, [int[]]$Attendus = @(200, 201),
        [string]$Fichier = $null
    )
    $h = @{ Accept = 'application/json' } + $EnTetes
    if ($Jeton) { $h['Authorization'] = "Bearer $Jeton" }
    $p = @{ Uri = "$Api$Chemin"; Method = $Methode; Headers = $h; SkipHttpErrorCheck = $true; TimeoutSec = 60 }
    if ($Fichier) { $p['Form'] = @{ file = Get-Item $Fichier; delimiter = 'semicolon' } }
    elseif ($null -ne $Corps) { $p['Body'] = ($Corps | ConvertTo-Json -Depth 6); $p['ContentType'] = 'application/json' }
    $r = Invoke-WebRequest @p
    Add-Content $Journal "$Etape`t$Methode $Chemin`tHTTP $($r.StatusCode)"
    if ($Attendus -notcontains [int]$r.StatusCode) {
        Add-Content $Journal "REPONSE BRUTE :`n$($r.Content)"
        throw "ETAPE EN ECHEC : $Etape ($Methode $Chemin) a rendu HTTP $($r.StatusCode), attendu $($Attendus -join '/'). Reponse brute dans $Journal."
    }
    return ($r.Content | ConvertFrom-Json)
}

function Connecter([string]$Etape, [string]$Email) {
    (Appeler $Etape 'POST' '/auth/login' @{ username = $Email; password = $MotDePasse } -Attendus 200).data.token
}

try {
    # 1. La demande publique d'ouverture.
    Appeler '1 demande' 'POST' '/school-requests' @{
        nom_demandeur = 'Admin E2E'; email_demandeur = 'admin@e2e.test'; nom_ecole = 'Ecole creee depuis le LMS E2E'
        slug_souhaite = $Slug; usage_prevu = 'E2E en CI, donnees fictives.'
    } -Attendus 201 | Out-Null

    # 2. La validation, par le SERVICE du produit (seule étape hors HTTP).
    Push-Location $Backend
    try {
        $code = 'use App\Models\SchoolRegistrationRequest; use App\Models\User; use App\Services\SchoolRegistration\SchoolRequestDecisionService; ' +
            '$d = SchoolRegistrationRequest::where("email_demandeur", "admin@e2e.test")->where("statut", "en_attente")->firstOrFail(); ' +
            '$s = User::withoutGlobalScope("institution")->where("role", "supradmin")->whereNull("institution_id")->firstOrFail(); ' +
            '$r = app(SchoolRequestDecisionService::class)->valider($d, null, $s); ' +
            'echo json_encode(["slug" => $r->institution->slug, "mode" => $r->institution->mode->value, "lien" => $r->lienActivation]);'
        # tinker rend 0 même quand le code lève une exception : on juge sur la SORTIE.
        $sortieTinker = & php artisan tinker --execute=$code 2>&1
        $ligneJson = $sortieTinker | Where-Object { "$_".TrimStart().StartsWith('{') } | Select-Object -Last 1
        Add-Content $Journal "2 validation (service)`ttinker, code $LASTEXITCODE"
        if ($LASTEXITCODE -ne 0 -or -not $ligneJson) {
            Add-Content $Journal "SORTIE BRUTE :`n$($sortieTinker -join "`n")"
            throw "ETAPE EN ECHEC : 2 validation par le service. Sortie brute dans $Journal."
        }
    }
    finally { Pop-Location }
    $v = $ligneJson | ConvertFrom-Json
    if ($v.mode -ne 'standalone' -or $v.slug -ne $Slug) { throw "ETAPE EN ECHEC : 2 validation, ecole inattendue ($($v.slug), $($v.mode))." }
    $jetonActivation = ($v.lien -split '/')[-1]

    # 3. L'activation de l'admin d'école, puis sa connexion.
    Appeler '3 activation' 'POST' '/activation' @{ token = $jetonActivation; password = $MotDePasse; password_confirmation = $MotDePasse } -Attendus 200 | Out-Null
    $admin = Connecter '3 connexion admin' 'admin@e2e.test'

    # 4. Les comptes du personnel.
    $ids = @{}
    foreach ($c in @(
            @{ name = 'Coordinateur E2E'; email = 'coord@e2e.test'; role = 'coordinateur' },
            @{ name = 'Enseignant Un E2E'; email = 'ens1@e2e.test'; role = 'enseignant' },
            @{ name = 'Enseignant Deux E2E'; email = 'ens2@e2e.test'; role = 'enseignant' })) {
        $u = Appeler "4 compte $($c.email)" 'POST' '/users' ($c + @{ password = $MotDePasse; password_confirmation = $MotDePasse }) -Jeton $admin -Attendus 201
        $ids[$c.email] = $u.data.id
    }

    # 5. Le catalogue : classes, matières, affectations, codes d'inscription.
    $c1 = (Appeler '5 classe 6e A' 'POST' '/classes' @{ libelle = '6e A E2E'; code = 'E2E-6A'; effectif = 30 } -Jeton $admin -Attendus 201).data
    $c2 = (Appeler '5 classe 5e B' 'POST' '/classes' @{ libelle = '5e B E2E'; code = 'E2E-5B'; effectif = 30 } -Jeton $admin -Attendus 201).data
    $m = @{}
    foreach ($x in @(@{ libelle = 'Mathematiques E2E'; code = 'E2E-MATH' }, @{ libelle = 'Francais E2E'; code = 'E2E-FR' }, @{ libelle = 'SVT E2E'; code = 'E2E-SVT' })) {
        $m[$x.code] = (Appeler "5 matiere $($x.code)" 'POST' '/matieres' ($x + @{ coefficient = 2 }) -Jeton $admin -Attendus 201).data.id
    }
    foreach ($a in @(
            @($c1.id, $m['E2E-MATH'], $ids['ens1@e2e.test']), @($c1.id, $m['E2E-FR'], $ids['ens2@e2e.test']),
            @($c2.id, $m['E2E-SVT'], $ids['ens1@e2e.test']), @($c2.id, $m['E2E-MATH'], $ids['ens2@e2e.test']))) {
        Appeler "5 affectation classe $($a[0]) matiere $($a[1])" 'POST' "/classes/$($a[0])/matieres" @{ matiere_id = $a[1]; enseignant_id = $a[2] } -Jeton $admin -Attendus 201 | Out-Null
    }
    $code1 = (Appeler '5 code 6e A' 'POST' "/classes/$($c1.id)/code-inscription" -Jeton $admin -Attendus 201).data.code_inscription
    $code2 = (Appeler '5 code 5e B' 'POST' "/classes/$($c2.id)/code-inscription" -Jeton $admin -Attendus 201).data.code_inscription

    # 6. Les élèves s'inscrivent eux-mêmes par code (5 par minute au plus).
    foreach ($e in @(@(1, $code1), @(2, $code1), @(3, $code1), @(4, $code1), @(5, $code2), @(6, $code2))) {
        Appeler "6 inscription eleve$($e[0])" 'POST' '/inscriptions' @{
            code = $e[1]; nom = "Eleve $($e[0]) E2E"; email = "eleve$($e[0])@e2e.test"
            password = $MotDePasse; password_confirmation = $MotDePasse
        } -EnTetes @{ 'X-Institution' = $Slug } -Attendus 201 | Out-Null
        Start-Sleep -Seconds 13
    }

    # 7. Un élève rendu INACTIF, par le seul chemin du produit : l'import CSV.
    $coord = Connecter '7 connexion coordinateur' 'coord@e2e.test'
    $csv = Join-Path $Sortie 'import-inactif.csv'
    [System.IO.File]::WriteAllLines($csv, @('nom;prenom;email;code_classe;statut', 'Eleve 6 E2E;Inconnu;eleve6@e2e.test;E2E-5B;inactif'))
    $apercu = Appeler '7 import apercu' 'POST' '/lms/imports/preview' -Jeton $coord -Fichier $csv -Attendus @(200, 201)
    Appeler '7 import confirmation' 'POST' "/lms/imports/$($apercu.data.import_id)/confirm" -Jeton $coord -Attendus @(200, 201, 202) | Out-Null
    $suivi = Appeler '7 import suivi' 'GET' "/lms/imports/$($apercu.data.import_id)" -Jeton $coord -Attendus 200
    # HTTP 200 ne prouve rien : une ligne en erreur rend aussi 200. On juge sur les comptes.
    if ($suivi.data.status -ne 'done' -or $suivi.data.counts.error -ne 0 -or $suivi.data.counts.ok -ne 1) {
        throw "ETAPE EN ECHEC : 7 import, statut $($suivi.data.status), ok $($suivi.data.counts.ok), erreurs $($suivi.data.counts.error)."
    }

    # 8. Les leçons, par les enseignants (publiée, brouillon, archivée, publiée par la route dédiée).
    $e1 = Connecter '8 connexion ens1' 'ens1@e2e.test'
    $l1 = (Appeler '8 lecon publiee' 'POST' '/lessons' @{ title = 'Fractions, introduction'; type = 'cours'; classe_id = $c1.id; matiere_id = $m['E2E-MATH']; content = 'Contenu fictif.'; status = 'published' } -Jeton $e1 -Attendus 201).data
    $l2 = (Appeler '8 lecon brouillon' 'POST' '/lessons' @{ title = 'Fractions, exercices'; type = 'td'; classe_id = $c1.id; matiere_id = $m['E2E-MATH']; content = 'Brouillon fictif.' } -Jeton $e1 -Attendus 201).data
    $l3 = (Appeler '8 lecon archivee' 'POST' '/lessons' @{ title = 'La cellule, ancien cours'; type = 'cours'; classe_id = $c2.id; matiere_id = $m['E2E-SVT']; content = 'Archive fictive.'; status = 'archived' } -Jeton $e1 -Attendus 201).data
    $e2 = Connecter '8 connexion ens2' 'ens2@e2e.test'
    $l4 = (Appeler '8 lecon a publier' 'POST' '/lessons' @{ title = 'Lecture suivie'; type = 'cours'; classe_id = $c1.id; matiere_id = $m['E2E-FR']; content = 'Contenu fictif.' } -Jeton $e2 -Attendus 201).data
    Appeler '8 publication' 'POST' "/lessons/$($l4.id)/publish" -Jeton $e2 -Attendus 200 | Out-Null

    # Le jeu, pour le parcours (aucun secret : le mot de passe reste dans l'environnement du job).
    @{
        slug = $Slug
        comptes = @{ admin = 'admin@e2e.test'; coordinateur = 'coord@e2e.test'; enseignant = 'ens1@e2e.test'; enseignant2 = 'ens2@e2e.test'; etudiant = 'eleve1@e2e.test'; etudiant_inactif = 'eleve6@e2e.test' }
        classes = @($c1.id, $c2.id)
        matieres = @($m['E2E-MATH'], $m['E2E-FR'], $m['E2E-SVT'])
        lecons = @{ publiee = $l1.id; brouillon = $l2.id; archivee = $l3.id; publiee_ens2 = $l4.id }
    } | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $Sortie 'jeu.json')
    Write-Output "Ecole creee depuis le LMS montee. Journal : $Journal"
}
catch {
    Write-Output $_.Exception.Message
    exit 1
}
