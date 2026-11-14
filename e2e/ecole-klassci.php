<?php

// Monte l'école KLASSCI FICTIVE de l'E2E (K1, D481) dans la base de l'E2E : une institution en mode
// `klassci` dont l'URL KLASSCI vise un faux local. AUCUN utilisateur n'est créé : c'est la première
// connexion KLASSCI qui les crée, comme en production (LoginOrchestrator, KlassciUserSynchronizer).
//
// Modèle : lms_backend tests/load/setup/prepare-load-test-data.php (refus de la production, URL
// locale exigée). Usage, depuis le dossier du back : php <ce fichier> <dossier du back> <url locale>

use App\Models\Institution;
use Illuminate\Contracts\Console\Kernel;

[$script, $back, $url] = array_pad($argv, 3, null);
if (! is_string($back) || ! is_file($back.'/vendor/autoload.php')) {
    fwrite(STDERR, "[ecole-klassci] dossier du back introuvable\n");
    exit(1);
}
if (! is_string($url) || ! preg_match('#^http://127\.0\.0\.1:\d+$#', $url)) {
    fwrite(STDERR, "[ecole-klassci] une URL locale http://127.0.0.1:<port> est exigée\n");
    exit(1);
}

require $back.'/vendor/autoload.php';
$app = require $back.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (app()->environment('production')) {
    fwrite(STDERR, "[ecole-klassci] REFUS : APP_ENV=production\n");
    exit(1);
}

Institution::updateOrCreate(
    ['slug' => 'e2e-klassci'],
    ['name' => 'Ecole fictive E2E KLASSCI', 'mode' => 'klassci', 'klassci_api_url' => $url, 'is_active' => true],
);
echo "[ecole-klassci] école KLASSCI fictive montée, KLASSCI = {$url}\n";
