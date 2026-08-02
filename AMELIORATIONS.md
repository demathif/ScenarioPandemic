# Scénario Pandemic — Propositions d'améliorations

Document de propositions établi après analyse du code actuel.
Fichiers analysés : [`game.html`](views/game.html), [`game.js`](assets/game.js), [`cards.js`](assets/cards.js), [`minuteur.js`](assets/minuteur.js), [`prepare.js`](assets/prepare.js), [`style.css`](style/style.css), [`go.sh`](go.sh).

---

## 1. Synthèse et priorités

| Priorité | Domaine | Amélioration | Impact | Effort |
|----------|---------|--------------|--------|--------|
| P0 (bug) | Fiabilité | Correction des bugs critiques identifiés | Élevé | Faible |
| P1 | Fiabilité | Persistance de la partie (anti-rafraîchissement) | Élevé | Moyen |
| P1 | Gameplay | Support de 3-4 joueurs | Élevé | Moyen |
| P1 | Gameplay | Bouton « Annuler » (undo) | Élevé | Faible |
| P1 | UX | Remplacer les `alert()` par des toasts/modales | Moyen | Faible |
| P2 | Gameplay | Raccourcis clavier | Moyen | Faible |
| P2 | Fonctionnalité | Historique & classement local des parties | Moyen | Moyen |
| P2 | UX | Dark mode + thèmes | Faible | Faible |
| P2 | Accessibilité | A11y : focus, aria, contrastes | Moyen | Moyen |
| P3 | Architecture | Refactor `game.js` en modules testables | Élevé | Élevé |
| P3 | Architecture | Tests unitaires de la logique métier | Élevé | Moyen |
| P3 | Qualité | Suppression du code mort, lint, README | Faible | Faible |

---

## 2. Bugs critiques (P0)

### 2.1 Fichier mort avec bug latent — `assets/prepare.js`
`prepare.js` n'est référencé par **aucun** fichier HTML (seuls `cards.js` et `game.js` sont chargés dans [`game.html`](views/game.html:9)). Ses fonctions `run()` et `get_roles()` dupliquent celles de [`game.js`](assets/game.js:146) et [`game.js`](assets/game.js:201), et sa redirection [`prepare.js`](assets/prepare.js:81) (`../views/game.html?...`) est incorrecte si le fichier était un jour exécuté depuis la racine.

**Action :** supprimer `assets/prepare.js` (ou le réintégrer proprement s'il a une utilité).

### 2.2 Injection HTML (XSS) par le pseudo
Dans [`historiquePartie()`](assets/game.js:1008), chaque pseudo est injecté dans le HTML via `"<td>" + tab[0] + "</td>"` ([`game.js`](assets/game.js:1023)) **sans échappement**. Le champ pseudo ([`game.html`](views/game.html:58)) n'est pas réellement validé (placeholder uniquement) : un pseudo contenant `<script>` ou du HTML serait exécuté à l'affichage.

**Actions :**
- Échapper le pseudo avec `textContent` ou une fonction `escapeHtml()`.
- Valider le pseudo côté code (regex `^[A-Za-z0-9_]{1,16}$`) avant enregistrement.
- Limiter la longueur dans le HTML (`maxlength`).

### 2.3 URL de partage très longue et copie sans fallback
[`genererLienPartie()`](assets/game.js:826) encode l'intégralité des paquets (joueur + propagation) dans l'URL. Les liens peuvent dépasser plusieurs milliers de caractères, ce qui pose problème sur certains canaux de partage (WhatsApp, Slack, certains serveurs). De plus, `navigator.clipboard.writeText` ([`game.js`](assets/game.js:830)) exige un contexte sécurisé (HTTPS) et échoue silencieusement en `file://` ou HTTP non-localhost.

**Actions :**
- Compresser les paquets (Base64 + éventuellement une compression légère) pour raccourcir l'URL.
- Ajouter un fallback de copie : sélection du texte dans un champ + `document.execCommand('copy')` si l'API Clipboard est indisponible.
- Afficher le lien dans une zone cliquable en cas d'échec.

### 2.4 Chrono : `beep` sans garde-fou
[`runTimer()`](assets/minuteur.js:31) appelle `document.getElementById("beep").play()` ([`minuteur.js`](assets/minuteur.js:39)) sans vérifier l'existence de l'élément. Si la balise `<audio>` est absente ou si le navigateur bloque l'audio, une exception est levée.

**Action :** ajouter un garde-fou `if (beepEl) beepEl.play().catch(() => {})`.

### 2.5 Fin de lot de propagation : test fragile
[`tournePropogation()`](assets/game.js:688) détecte la fin d'un lot via `carte.charAt(0) == carte.charAt(2)` ([`game.js`](assets/game.js:716)). Cette comparaison suppose que le numérateur est toujours un chiffre unique (ex. `"3/4"`). Avec un dénominateur à deux chiffres (initialement `"10/..."` n'existe pas, mais le format est fragile) ou une autre mise en forme, le test casse silencieusement.

**Action :** parser les parties de `"X/Y"` en entiers (`parseInt`) et comparer `num === denom`, comme déjà fait dans [`mettreAJourCartesATirer()`](assets/game.js:613).

### 2.6 Nombre magique « 26 tours »
[`isPseudoGagnePerduCeTour()`](assets/game.js:496) contient un cas particulier codé en dur `nbTours == 26` ([`game.js`](assets/game.js:509)) et `tab[1] <= 25` ([`game.js`](assets/game.js:515)).

**Action :** extraire ces seuils en constantes nommées (ex. `MAX_TOURS`) liées aux règles de la Coupe du Monde, et documenter.

---

## 3. Fiabilité & persistance (P1)

### 3.1 Sauvegarde automatique de la partie
Actuellement, un simple rafraîchissement de la page perd toute la partie. Proposer une persistance locale :
- Sauvegarder l'état (paquets restants, cartes tirées, tours, joueur actif, chrono) dans `localStorage`/`sessionStorage` à chaque action.
- Offrir un bouton « Reprendre la partie » au chargement si une sauvegarde existe.
- Intégrer un état « Annuler » (voir 4.2) qui s'appuie sur cette même structure.

### 3.2 Validation des entrées URL
Les paramètres (`paquetJoueur`, `paquetPropagationEntier`, `pseudos`) sont désérialisés sans validation. Un lien corrompu peut produire des comportements inattendus (`undefined`, boucles).

**Action :** valider le format (décompte des épidémies, nombre de cartes) et afficher un message clair « lien invalide » le cas échéant.

---

## 4. Améliorations de gameplay (P1/P2)

### 4.1 Support de 3-4 joueurs
Le jeu est aujourd'hui figé à 2 joueurs :
- `limit = 2` avec le commentaire `FIXME: what if more that 2 players` dans [`game.js`](assets/game.js:204).
- Le HTML ne définit que `idJoueur1`/`idJoueur2` ([`game.html`](views/game.html:111)).
- La logique d'alternance de tour repose sur un calcul `% 4` ([`game.js`](assets/game.js:717)) supposant 2 joueurs.

**Actions :**
- Générer dynamiquement les panneaux joueurs (au lieu de HTML codé en dur).
- Paramétrer le nombre de joueurs à l'écran de sélection (2, 3 ou 4).
- Adapter la distribution initiale des cartes et l'alternance des tours selon `nbJoueurs`.
- Ajuster le calcul des cartes restantes (règle « le joueur suivant tire quand le paquet joueur est multiple de 4 »).

### 4.2 Bouton « Annuler la dernière action » (undo)
En jeu compétitif, une erreur de clic est coûteuse. Proposer un historique d'actions (pile) permettant d'annuler :
- Le dernier tirage joueur.
- Le dernier tirage propagation (y compris épidémie).
- Le retour au tour précédent.

### 4.3 Raccourcis clavier
Ajouter des raccourcis discrets et documentés (aide en un clic) :
- `Espace` : action principale du bouton unique.
- `P` : pause/reprise du chrono.
- `S` : arrêter le chrono.
- `Z`/`Ctrl+Z` : annuler la dernière action.

### 4.4 Vue plateau interactive (évolution majeure)
Aujourd'hui, l'outil est un *tracker* de pioche (cartes joueur + propagation + chrono) sans plateau. Une évolution immersive consisterait à ajouter :
- Une carte du monde Pandemic (SVG) avec les villes colorées.
- Les cubes de maladie posés selon les tirages.
- Les éclosions et la piste d'éclosion.
- Les stations de recherche et les remèdes découverts.
- Une interaction souris/doigt (sélection de ville, déplacement de pion).

Cette fonctionnalité transformerait l'outil d'assistance en véritable plateforme de jeu. À prioriser selon la vision produit.

### 4.5 Minuteur enrichi
- Anneau/cercle de progression visuelle du temps restant.
- Durée configurable (réglage fin au-delà de 120 s / 80 s).
- Notification (son + toast) quand il reste 10 s, puis à la fin.
- Démarrage automatique au début de chaque tour (déjà partiellement géré via [`boutonUnique()`](assets/game.js:953)).

### 4.6 Sons & animations
Au-delà du `beep` unique :
- Son de tirage de carte joueur.
- Son/alerte visuelle (pulsation, flash) quand une carte Épidémie est tirée.
- Confirmation sonore douce pour les actions validées.

---

## 5. Historique & classement (P2)

### 5.1 Classement local des parties
Les résultats sont actuellement uniquement véhiculés par les liens partagés et renvoyés vers une feuille Google Sheets ([`game.html`](views/game.html:24)). Proposer :
- Un historique local (`localStorage`) des parties jouées sur le poste (pseudo, rôle, résultat, tours, remèdes, éclosions).
- Un mini-classement (ratio victoires/défaites, meilleur nombre de tours pour une victoire, etc.).

### 5.2 Export / import des résultats
- Exporter un JSON des parties jouées pour agrégation.
- (Option) Backend léger ou service tiers (Firebase/glitch) pour un classement global multi-joueurs.

---

## 6. UX, accessibilité & mobile (P2)

### 6.1 Remplacer les `alert()` bloquants
Les `alert()` sont utilisés en masse : sélection > 2 personnages ([`game.js`](assets/game.js:213)), fin du paquet ([`game.js`](assets/game.js:369)), notifications de gain/perte des autres joueurs ([`game.js`](assets/game.js:510), [`game.js`](assets/game.js:519), [`game.js`](assets/game.js:527)), validation de fin de partie ([`game.js`](assets/game.js:793), [`game.js`](assets/game.js:801), [`game.js`](assets/game.js:805), [`game.js`](assets/game.js:810)), confirmation de copie ([`game.js`](assets/game.js:832)).

**Action :** réutiliser le système de toast existant ([`afficherToast()`](assets/game.js:866)) et introduire une modale de confirmation réutilisable.

### 6.2 Accessibilité (a11y)
- Rendre le chrono en `aria-live="polite"` pour les lecteurs d'écran.
- Indiquer visuellement le focus (styles `:focus-visible`).
- S'assurer que les boutons ont des `aria-label` explicites.
- Vérifier les contrastes (le gris `#7f8c8d` sur fond `#fdf6ec` peut être insuffisant).

### 6.3 Mobile
La feuille de style est partiellement responsive (`@media` à [`style.css`](style/style.css:860), [`style.css`](style/style.css:927), [`style.css`](style/style.css:1040)). À vérifier :
- Panneau de propagation sur très petit écran.
- Grille de personnages (déjà adaptée).
- Barre du chrono (déjà adaptée).
- Éviter les `innerHTML` cumulés de [`tournePropogation()`](assets/game.js:712) qui grossissent indéfiniment le DOM.

### 6.4 Dark mode
Introduire un thème sombre via `prefers-color-scheme` + un bouton de bascule (persisté en `localStorage`). Les variables CSS ([`style.css`](style/style.css:7)) rendent ce changement simple et peu invasif.

---

## 7. Qualité du code & architecture (P3)

### 7.1 Refactor de `game.js` (1 034 lignes, variables globales)
`game.js` mélange état global (`var`), logique métier, manipulation DOM et gestion d'événements. Propositions :
- Découper en modules : `state.js` (état du jeu), `deck.js` (construction/mélange des paquets), `rules.js` (règles de propagation, compteurs), `render.js` (DOM), `ui.js` (menu, toasts).
- Passer en modules ES (`type="module"`) ou en IIFE pour éviter la pollution du scope global.
- Regrouper les constantes de configuration (durées chrono, `limit`, seuils) dans un objet unique.

### 7.2 Tests unitaires
La logique pure est idéale pour des tests : `shuffle`, `getCouleur`, `combienTirerDeCartes`, `preparationPaquetPropagations`, `getNbCubesPourCarte`, `mettreAJourCartesATirer`.
- Ajouter un runner léger (Vitest/Jest) et un script `npm test`.
- Fiabiliser le mélange et la construction du paquet de propagation (cas des épidémies en début de lot).

### 7.3 Versioning des assets
Le cache-busting manuel `?v=31` ([`game.html`](views/game.html:8), [`game.html`](views/game.html:9), [`game.html`](views/game.html:10), [`game.html`](views/game.html:196)) est fragile (oubli d'incrément).
**Actions :** remplacer par un hash automatique (petit script de build) ou reposer sur les en-têtes anti-cache déjà fournis par [`go.sh`](go.sh:28).

### 7.4 Lint & format
- Ajouter ESLint + Prettier pour homogénéiser le style (indentation mélangée onglets/espaces, fonctions `var` vs `let`/`const`).
- Normaliser [`cards.js`](assets/cards.js) (espacements, `const`/`let`).

### 7.5 Documentation
- Il n'existe pas de `README` à la racine : ajouter un README (lancement via [`go.sh`](go.sh:1), structure des fichiers, règles de la Coupe du Monde, comment partager un lien).
- Documenter le format des paramètres URL (actuellement implicite dans [`run()`](assets/game.js:86)).

### 7.6 Détails de structure
- `LICENSE.md/` est un **dossier** contenant `LICENSE.md` : structure inhabituelle, à aplatir.
- [`prepare.js`](assets/prepare.js) : voir § 2.1 (suppression).

---

## 8. Maintenance & déploiement (P3)

- **PWA** : ajouter un `manifest.json` + un service worker pour jouer hors-ligne et installer l'application sur mobile/desktop.
- **CI** : GitHub Actions exécutant lint + tests sur chaque push.
- **Déploiement** : le projet est déjà compatible GitHub Pages (100 % statique) — documenter la procédure et la branche de publication.

---

## 9. Feuille de route suggérée

**Étape 1 — Fiabiliser (P0/P1)**
1. Supprimer `prepare.js` ; corriger XSS pseudo ; valider les entrées.
2. Fallback de copie du lien + compression des paquets.
3. Garde-fou `beep` ; parsing robuste de la fin de lot.
4. Sauvegarde locale + reprise de partie.

**Étape 2 — Améliorer l'expérience (P1/P2)**
5. Undo + raccourcis clavier.
6. Toasts/modales à la place des `alert()`.
7. Support 3-4 joueurs (rétrocompatible 2 joueurs).
8. Historique local + export JSON.

**Étape 3 — Structurer (P3)**
9. Refactor en modules + tests unitaires.
10. README, lint, CI, versioning automatique.
11. (Option) Dark mode, sons, plateau interactif, PWA.

---

## 10. Résumé des actions immédiates (quick wins)

| # | Action | Fichier |
|---|--------|---------|
| 1 | Supprimer le fichier mort `prepare.js` | [`prepare.js`](assets/prepare.js) |
| 2 | Échapper + valider le pseudo (XSS) | [`game.js`](assets/game.js:1023), [`game.html`](views/game.html:58) |
| 3 | Fallback de copie du lien | [`game.js`](assets/game.js:826) |
| 4 | Garde-fou `beep` | [`minuteur.js`](assets/minuteur.js:39) |
| 5 | Parser `X/Y` en entier pour la fin de lot | [`game.js`](assets/game.js:716) |
| 6 | Extraire les constantes (26 tours, limit, durées) | [`game.js`](assets/game.js:509), [`game.js`](assets/game.js:204), [`game.js`](assets/game.js:893) |
| 7 | Toast/modale à la place des `alert()` | [`game.js`](assets/game.js:866) |
