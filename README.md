# Coucou : petits jeux calmes pour tout-petits

Application web installable (PWA) pour un enfant de 1 à 3 ans : 100 % gratuite, sans publicité, sans compte, sans connexion réseau pendant le jeu, sans aucun suivi.

> « Coucou » est un nom provisoire, facile à changer (voir plus bas).

## Les 4 mini-jeux

| Icône | Jeu | Comment on joue |
|---|---|---|
| Bulles | **Bulles à toucher** | Des bulles pastel montent doucement. Un tap (même à côté) en fait éclater une, avec un petit « plop ». |
| Rond, carré, triangle | **Formes dans leur trou** | Glisser chaque forme vers sa silhouette, ou simplement la toucher : elle y va toute seule. |
| Panier | **Trier les couleurs** | Poser chaque balle dans le panier de sa couleur. Une voix dit la couleur. |
| Chat | **Animaux** | Toucher un animal : il bouge et la voix dit « Le chat fait miaou ! ». |

Aucun échec possible : un tap n'importe où donne toujours une réaction douce, et une forme lâchée au mauvais endroit revient doucement à sa place, sans bruit négatif.

## Pour l'adulte

- **Revenir au menu** : pendant un jeu, rien n'est affiché. Gardez le doigt appuyé **2 secondes dans le coin en haut à gauche**. Un anneau discret se remplit, puis une petite maison apparaît pendant 5 secondes : touchez-la.
- **Pause douce** : au bout de **15 minutes** de jeu, l'écran passe en fondu vers une lune qui dort, et une voix dit au revoir. Un simple tap ne fait rien. Gardez le doigt appuyé **2 secondes n'importe où** : deux boutons apparaissent, ▶ pour reprendre et 🏠 pour revenir au menu.
  - Pour tester la pause sans attendre : ajoutez `?minutes=0.5` à la fin de l'adresse (pause au bout de 30 secondes).
- **Le son** : iOS n'autorise le son qu'après un premier toucher. Le premier tap sur l'accueil le débloque. Si l'iPhone est en mode silencieux (bouton latéral), les sons du jeu peuvent être coupés.

## Bloquer les sorties accidentelles : l'Accès guidé

Une page web ne peut pas bloquer les gestes d'iOS (balayer depuis le bas, centre de contrôle…). C'est l'**Accès guidé** d'Apple qui s'en charge :

1. **Réglages → Accessibilité → Accès guidé** : activez-le.
2. Dans **Réglages du code**, choisissez un code (différent de celui du téléphone, c'est plus sûr).
3. Activez **Raccourci d'accessibilité → Accès guidé**.
4. Ouvrez Coucou, puis **appuyez trois fois sur le bouton latéral** (ou le bouton principal sur les anciens modèles) → **Démarrer**.
5. Pour sortir : **triple-clic** à nouveau, puis entrez votre code → **Fin**.

Dans les options de l'Accès guidé, vous pouvez aussi désactiver les **boutons de volume** et fixer une **limite de temps**.

## Mettre le jeu en ligne gratuitement (GitHub Pages)

1. Créez un compte gratuit sur <https://github.com> (si vous n'en avez pas).
2. En haut à droite : **+ → New repository**. Nom : par exemple `coucou`. Cochez **Public** (obligatoire pour Pages gratuit), puis **Create repository**.
3. Sur la page du dépôt vide, cliquez sur **uploading an existing file**. Glissez-déposez **tout le contenu** du dossier `Baby` (les dossiers `css`, `icons`, `js`, `outils` et les fichiers `index.html`, `manifest.webmanifest`, `sw.js`, `README.md`). Le fichier `BRIEF_JEU_BEBE.md` est facultatif. Cliquez sur **Commit changes**.
4. Allez dans **Settings → Pages**. Sous *Build and deployment*, choisissez **Source : Deploy from a branch**, puis **Branch : main** et **/ (root)** → **Save**.
5. Après 1 à 2 minutes, l'adresse apparaît en haut de cette page, du type `https://VOTRE-NOM.github.io/coucou/`.

> Le dépôt public est visible par tous, mais il ne contient rien de personnel. Évitez simplement d'y mettre des enregistrements de voix privés si cela vous gêne.

## Installer sur l'iPhone / l'iPad

1. Ouvrez l'adresse dans **Safari** (pas Chrome).
2. Touchez le bouton **Partager** (carré avec une flèche vers le haut).
3. Choisissez **Sur l'écran d'accueil**, puis **Ajouter**.
4. Lancez Coucou depuis sa nouvelle icône : il s'ouvre en plein écran, sans barre Safari.
5. Ouvrez-le une fois avec internet : ensuite, il fonctionne **hors-ligne** (mode avion compris).

## Publier une mise à jour

1. Modifiez les fichiers, puis renvoyez-les sur GitHub (même méthode « Add file → Upload files »).
2. **Important** : dans `sw.js`, augmentez le numéro `VERSION` (par exemple `1` → `2`). Sans ça, les appareils garderont l'ancienne version en cache.
3. Sur l'iPhone/iPad, l'app installée se met à jour au lancement suivant avec internet. Si ce n'est pas le cas : fermez complètement l'app (balayez-la depuis le sélecteur d'apps), rouvrez-la, refermez-la, puis rouvrez-la encore.
4. En dernier recours : supprimez l'icône de l'écran d'accueil, puis **Réglages → Safari → Avancé → Données des sites web**, supprimez la ligne `github.io`, et réinstallez depuis Safari.

## Enregistrer votre propre voix (facultatif)

Par défaut, c'est la voix française de l'appareil qui parle. Pour la remplacer :

1. Enregistrez un fichier par phrase avec l'app **Dictaphone** (format `.m4a`), par exemple `chat.m4a`.
2. Créez un dossier `audio` à côté de `index.html` et mettez-y les fichiers.
3. Dans `js/data/recordings.js`, retirez les `//` devant la ligne correspondante.
4. Ajoutez le fichier à la liste `FILES` de `sw.js` et augmentez `VERSION`.

Si un fichier manque, la voix de l'appareil prend automatiquement le relais.

## Tester sur ce PC

Double-cliquez (ou clic droit → *Exécuter avec PowerShell*) sur `outils/serveur-local.ps1`, puis ouvrez <http://localhost:8080/> dans Chrome ou Edge. Les outils de développement (F12 → icône téléphone) permettent de simuler un iPhone.

## Tests automatiques (facultatif)

Ils vérifient le jeu dans le moteur de Safari (WebKit), sur iPhone et iPad, en portrait et en paysage : zoom bloqué, coin maison, tailles des cibles, pause, rotation, hors-ligne, absence d'erreurs. Ils nécessitent Node.js :

```bash
npm install
```

```bash
npx playwright install webkit
```

```bash
npm test
```

Ces tests ne remplacent pas un essai sur le vrai appareil : son, voix, mode silencieux, installation sur l'écran d'accueil et Accès guidé ne peuvent être vérifiés que sur l'iPhone ou l'iPad.

## Organisation du code

Site statique en JavaScript natif, sans framework ni étape de compilation.

```
index.html               page unique
manifest.webmanifest     informations d'installation (nom, icônes, plein écran)
sw.js                    service worker : cache hors-ligne versionné
icons/                   icônes 180 / 192 / 512 px
css/base.css             palette, anti-zoom, safe areas, styles des jeux
js/main.js               démarrage, menu, passage menu ↔ jeux, pause
js/core/input.js         tactile : anti-zoom, cible la plus proche, anti-rebond, glisser tolérant
js/core/audio.js         sons doux (Web Audio) et voix française
js/core/layout.js        taille d'écran, rotation, encoche
js/core/session.js       minuteur de 15 min et écran de pause
js/core/homeGuard.js     coin caché et bouton maison
js/core/effects.js       ondulation et petits utilitaires
js/data/recordings.js    vos enregistrements audio (facultatif)
js/games/*.js            un fichier par mini-jeu
outils/serveur-local.ps1 serveur de test local pour Windows
```

Chaque jeu exporte `{ id, icon, create() }` et l'objet créé expose `init(container, services)`, `start()`, `stop()` et `resize()`. Pour ajouter un jeu, créez un nouveau fichier dans `js/games/` sur ce modèle et ajoutez-le à la liste `GAMES` de `js/main.js` (et à `FILES` dans `sw.js`).

**Changer le nom** : remplacez « Coucou » dans `index.html` (balises `title` et `apple-mobile-web-app-title`) et dans `manifest.webmanifest`.
