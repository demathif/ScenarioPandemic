# Interactions Utilisateur — Scénario Pandemic

Ce fichier décrit **uniquement les actions que le joueur effectue** (clics, saisies, survols)
pour exécuter une partie complète, du début à la fin.

---

## 1. Page d'accueil ([`views/index.html`](views/index.html:1))

| # | Action utilisateur | Élément cible |
|---|-------------------|---------------|
| 1 | Ouvre `index.html` dans le navigateur | — |
| 2 | (Optionnel) Coche 0, 1 ou 2 cases parmi les personnages affichés | `<input type="checkbox">` |
| 3 | **Clic** sur le bouton **"Start"** | `<input type="button" value="Start">` |

→ Redirection automatique vers `game.html` avec les rôles choisis dans l'URL.

---

## 2. Initialisation de la partie ([`views/game.html`](views/game.html:1))

| # | Action utilisateur | Élément cible |
|---|-------------------|---------------|
| 4 | Reçoit une **alerte** :<br>• *"Vous êtes le 1er à jouer ce scénario (ID). Bon chance !"* (si nouveau scénario)<br>• *"Nombre de personnes ayant joué ce scénario (ID) : N\n - pseudo1\n - pseudo2"* (si d'autres ont déjà joué) | `alert()` — clic "OK" pour fermer |
| 5 | **Observe** l'affichage initial complet de la partie :<br><br>**Bloc Joueur 1** (à gauche) :<br>&nbsp;&nbsp;• [`#idJoueur1Role`](views/game.html:23) — Texte du nom du rôle (ex : *"Scientifique"*)<br>&nbsp;&nbsp;• [`#idJoueur1Image`](views/game.html:24) — Image du personnage (100×130px, ex: `Scientifique.png`)<br>&nbsp;&nbsp;• [`#idJoueur1`](views/game.html:25) — Liste `<ul>` des 4 premières cartes du paquet joueur, chaque carte affichée avec sa couleur de ville associée :<br>&nbsp;&nbsp;&nbsp;&nbsp;└ `bleu` → texte en bleu (ex: *"Atlanta", "Paris"*)<br>&nbsp;&nbsp;&nbsp;&nbsp;└ `jaune` → texte en orange (ex: *"Los Angeles", "Mexico"*)<br>&nbsp;&nbsp;&nbsp;&nbsp;└ `noir` → texte en noir (ex: *"Le Caire", "Istanbul"*)<br>&nbsp;&nbsp;&nbsp;&nbsp;└ `rouge` → texte en rouge (ex: *"Jakarta", "Tokyo"*)<br>&nbsp;&nbsp;&nbsp;&nbsp;└ `evenements` → texte en vert (ex: *"Pont aérien"*)<br><br>**Bloc Joueur 2** (à droite) :<br>&nbsp;&nbsp;• [`#idJoueur2Role`](views/game.html:29) — Texte du nom du rôle<br>&nbsp;&nbsp;• [`#idJoueur2Image`](views/game.html:30) — Image du personnage<br>&nbsp;&nbsp;• [`#idJoueur2`](views/game.html:31) — Liste `<ul>` des 4 cartes suivantes<br><br>**Lien "Cacher"** en haut de la section des cartes joueurs<br>&nbsp;&nbsp;→ clic possible pour masquer/afficher les 2 blocs joueurs ([`#idLienCartesJoueurs`](views/game.html:17))<br><br>**Boutons** visibles en bas :<br>&nbsp;&nbsp;• "Tirer 1ʳᵉ carte" — désactivé (grisé) au départ<br>&nbsp;&nbsp;• "Tirer carte propagation" — disponible<br>&nbsp;&nbsp;• "Tour..." — texte indiquant le joueur actif (initialement vide)<br>&nbsp;&nbsp;• Chronomètre à 02:00 (120s) avec ses boutons ▶️ ⏸️ ⏯️ ⏹️<br><br>**Données cachées** (non visibles sans debug) :<br>&nbsp;&nbsp;• Spoiler du paquet joueur complet<br>&nbsp;&nbsp;• Spoiler du paquet propagation complet<br><br>> **📌 Détail interne** : Le paquet de propagation est entièrement pré-construit par [`preparationPaquetPropagations()`](assets/game.js:243).<br>> Les 9 premières cartes de ce paquet sont des cartes villes numérotées `"1/9"` à `"9/9"`.<br>> Elles ne sont pas tirées ici — elles attendent dans le paquet que le joueur les pioche pendant la boucle de jeu. | [`#idJoueur1Role`](views/game.html:23), [`#idJoueur1Image`](views/game.html:24), [`#idJoueur1`](views/game.html:25)<br>[`#idJoueur2Role`](views/game.html:29), [`#idJoueur2Image`](views/game.html:30), [`#idJoueur2`](views/game.html:31)<br><br>Images des rôles :<br>[`images/Scientifique.png`](images/Scientifique.png), [`images/Archiviste.png`](images/Archiviste.png), etc. |

---

## 3. Boucle de jeu

### 3a. 🔥 Initialisation du plateau (tirage des 9 propagations de départ)

Juste après l'initialisation, le bouton **"Tirer 1ʳᵉ carte"** est désactivé ([`disabled`](views/game.html:38)).
Seul le bouton **"Tirer carte propagation"** est actif. Le joueur doit d'abord tirer les **9 cartes de propagation initiales**
qui représentent la mise en place du plateau (infections de départ).

| # | Action utilisateur | Élément cible | Fonction appelée |
|---|-------------------|---------------|-----------------|
| 6 | **Clic** sur **"Tirer carte propagation"** — 9 fois de suite | [`#idTournePropagation`](views/game.html:44) | [`tournePropogation()`](assets/game.js:347) |
| 7 | **Observe** les cartes défiler : `"1/9"`, `"2/9"`, ..., `"9/9"` — nom de ville + couleur | [`#idCartesPropagation`](views/game.html:64) | — |
| 8 | Après `"9/9"`, **observe** l'affichage **"Tour : [Nom du rôle]"** — le premier joueur est désigné | [`#idGoJoueur`](views/game.html:45) | — |

---

### 3b. Boucle principale (répétée jusqu'à ~26 tours)

Chaque tour suit cet ordre : **survol timer → tirage joueur → propagation**.

#### Étape 1 — Survol du chrono (démarrage du tour)

| # | Action utilisateur | Élément cible | Fonction appelée |
|---|-------------------|---------------|-----------------|
| 9 | **Survole** la zone du chronomètre → active le bouton "Tirer 1ʳᵉ carte" et démarre le tour | `<div onmouseover="nouveauTour()">` | [`nouveauTour()`](assets/game.js:387) |
| 10 | (Optionnel) **Sélectionne** la durée :<br>- **"Tour 1"** (120s) – cochée par défaut<br>- **"Tours suivants"** (80s) | `<input type="radio" name="duration">` | `resetTimer()` |
| 11 | **Clic** sur **▶️ Démarrer** | `<button onclick="startTimer()">` | [`startTimer()`](assets/minuteur.js:33) |
| 12 | **Attend** que le chrono atteigne 0 (bip sonore) | — | — |
| — | Ou **Clic** sur **⏸️ Pause** / **⏯️ Reprendre** / **⏹️ Reset** (optionnel) | Boutons chrono | [`pauseTimer()`](assets/minuteur.js:39) / [`resumeTimer()`](assets/minuteur.js:45) / [`resetTimer()`](assets/minuteur.js:52) |

#### Étape 2 — Tirage des 2 cartes joueur

| # | Action utilisateur | Élément cible | Fonction appelée |
|---|-------------------|---------------|-----------------|
| 13 | **Clic** sur **"Tirer 1ʳᵉ carte"** (maintenant actif) | [`#idButtonCarte1`](views/game.html:38) | [`tirerCartes('idCarte1')`](assets/game.js:178) |
| 14 | **Observe** la carte tirée s'afficher (nom + couleur) | [`#idCarte1`](views/game.html:59) | — |
| 15 | **Clic** sur **"Tirer 2ⁿᵈᵉ carte"** (apparaît après la 1ʳᵉ) | [`#idButtonCarte2`](views/game.html:39) | [`tirerCartes('idCarte2')`](assets/game.js:178) |
| 16 | **Observe** la 2ᵉ carte tirée s'afficher | [`#idCarte2`](views/game.html:60) | — |
| 17 | **Observe** que le bouton **"Tirer carte propagation"** est maintenant actif | [`#idTournePropagation`](views/game.html:44) | — |

⚠️ Si le paquet joueur est vide au moment de tirer → `alert("Désolé, il ne reste plus de carte... vous avez perdu !")` → partie terminée.

#### Étape 3 — Phase de propagation

| # | Action utilisateur | Élément cible | Fonction appelée |
|---|-------------------|---------------|-----------------|
| 18 | **Clic** sur **"Tirer carte propagation"** | [`#idTournePropagation`](views/game.html:44) | [`tournePropogation()`](assets/game.js:347) |
| 19 | **Observe** la carte de propagation s'afficher (ville ou épidémie) | [`#idCartesPropagation`](views/game.html:64) | — |
| 20 | **Répète** les étapes 18-19 pour chaque carte du lot (2, 3 ou 4 cartes) | — | — |
| 21 | **Observe** l'affichage "**Tour : [Nom du rôle]**" quand le lot est fini → retour à l'étape 1 (survol timer) | [`#idGoJoueur`](views/game.html:45) | — |

---

### 3c. Raccourci : bouton "one click"

| # | Action utilisateur | Élément cible | Fonction appelée |
|---|-------------------|---------------|-----------------|
| — | **Clic** sur **"Tirer carte propagation"** (bouton du bas, à droite) | [`#idOneClick`](views/game.html:50) | [`oneClick()`](assets/game.js:485) |

→ Ce bouton enchaîne automatiquement selon l'état courant : tirage 2ⁿᵈᵉ carte → propagation → tirage 1ʳᵉ carte.
⚠️ Il ne peut **pas** déclencher le survol du timer ([`nouveauTour()`](assets/game.js:387)) car il teste [`idGoJoueur.disabled`](assets/game.js:494) qui est indéfini sur un `<span>` — le survol reste manuel.

---

## 4. Fin de partie

| # | Action utilisateur | Élément cible | Fonction appelée |
|---|-------------------|---------------|-----------------|
| 18 | **Saisit** son pseudo (caractères a-zA-Z0-9) | [`#idPseudo`](views/game.html:87) | — |
| 19 | **Coche** **"Gagnée"** ou **"Perdue"** | [`#idGagne`](views/game.html:88) / [`#idPerdu`](views/game.html:89) | [`remplirChampsFinPartie()`](assets/game.js:403) |
| 20 | **Sélectionne** le nombre de remèdes trouvés (0-4) | [`#idNbRemedes`](views/game.html:91) | — |
| 21 | **Sélectionne** le nombre d'éclosions (0-8) | [`#idNbEclosions`](views/game.html:98) | — |
| 22 | **Clic** sur **"Partie terminée"** | `<input type="button" value="Partie terminée">` | [`partieTerminee()`](assets/game.js:415) |
| 23 | Reçoit **alerte** : *"Félicitations [pseudo] !"* ou *"Dommage [pseudo]..."* | `alert()` — OK à cliquer |
| 24 | Reçoit **alerte** : *"Lien copié !"* (le lien est automatiquement copié dans le presse-papier) | `alert()` — OK à cliquer |

---

## 5. Interactions complémentaires (optionnelles)

| # | Action utilisateur | Élément cible | Fonction appelée |
|---|-------------------|---------------|-----------------|
| 25 | **Clic** sur **"Cacher" / "Afficher"** les cartes des joueurs | [`#idLienCartesJoueurs`](views/game.html:17) | [`cacherAfficherCartes()`](assets/game.js:218) |
| 26 | **Clic** sur **"Copier le lien"** (re-copie le lien à tout moment) | `<input value="Copier le lien">` | [`genererLienPartie()`](assets/game.js:453) |
| 27 | **Clic** sur **"Nouvelle partie"** → confirmation → retour à l'accueil | `<input value="Nouvelle partie">` | [`nouvellePartie()`](assets/game.js:466) |
| 28 | **Coche** la case **"debug"** | [`#idDebug`](views/game.html:129) | [`debug()`](assets/game.js:473) |
| 29 | Si debug activé : **Clic** sur **"Montrer"** pour :<br>- **Récap des tours passés**<br>- **Spoil paquet joueur**<br>- **Spoil paquet propagation**<br>- **Historique des joueurs** | Liens dans [`#idDivDebug`](views/game.html:132) | `cacherAfficherCartes()` / [`historiquePartie()`](assets/game.js:508) |

---

## Résumé de la séquence typique (minimale)

```
Ouvrir index.html
  → (optionnel) Cocher 0-2 personnages
  → Clic "Start"
  → [redirection automatique]

Lire l'alerte ID de partie → OK

[INITIALISATION PLATEAU — 9 propagations]
  Clic "Tirer carte propagation" × 9
  → "Tour : [Rôle]" apparaît

[POUR CHAQUE TOUR]
  Survoller le chrono (active le bouton 1)
  Clic "▶️ Démarrer" (chrono)
  [simultanément] Clic "Tirer 1ère carte"
  Clic "Tirer 2nde carte"
  Clic "Tirer carte propagation" (× 2, 3 ou 4 selon le lot)
  "Tour : [Rôle]" apparaît
  [retour au début]

Saisir pseudo
Cocher Gagnée/Perdue
Définir remèdes et éclosions
Clic "Partie terminée"
  → OK alertes
  → Lien copié automatiquement (prêt à partager)
```
