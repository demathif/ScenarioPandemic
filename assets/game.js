/** Variables globales */
var paquetJoueur;
var epidemdiesShuffle;
var rolesShuffle = [];
var paquetEpidemie;
var paquetPropagationEntier = [];
var nbTours = 0;
var nbCartesPropagationTournees = 0;
var pseudos = [];
var lienSansPseudo = "";

/** Cartes événement choisies par le joueur pour le paquet (défaut = celles définies) */
var evenementsSelectionnes = [];

/** Indique si le joueur a choisi lui-même les cartes événement (sinon on garde le défaut) */
var evenementsChoisisParJoueur = false;

// Permet de bien compter le nombre de tour
var isChronoDejaTourne = false;

/** Mapping rôle → numéro de joueur (1 ou 2) */
var joueurDuRole = {};

/** Joueur actif (1 ou 2) */
var joueurActif = 1;

/** Suivi des propagations */
var nbEpidemiesTombees = 0;
var cartesPropagationTirees = [];

/** Noms des épidémies dans l'ordre où elles sont rencontrées */
var epidemiesNom = [];

/** Paramètres de la requête (URL) */
var vars = {};

/** Identifiant unique de la partie */
var idUnique = 0;

/** Constantes de règles (format Coupe du Monde) */
var MAX_TOURS = 26;                                     // Nombre maximal de tours avant la fin du paquet joueur
var PSEUDO_REGEX = /^[A-Za-z0-9_]{1,16}$/;              // Pseudo autorisés : lettres, chiffres, tiret bas

/** Thème : 'auto' | 'light' | 'dark' (persisté dans localStorage) */
var themeEtat = 'auto';

/** Lit le thème mémorisé (ou 'auto' pour suivre le système) */
function lireTheme() {
	try { return localStorage.getItem('theme') || 'auto'; } catch (e) { return 'auto'; }
}

/** Applique le thème via data-theme sur <html> et met à jour le bouton */
function appliquerTheme() {
	themeEtat = lireTheme();
	var sombre = false;
	if (themeEtat === 'auto') {
		sombre = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
	} else {
		sombre = (themeEtat === 'dark');
	}
	document.documentElement.setAttribute('data-theme', sombre ? 'dark' : 'light');
	mettreAJourBoutonTheme();
}

/** Met à jour le libellé du bouton de bascule de thème */
function mettreAJourBoutonTheme() {
	var btn = document.getElementById('idBoutonTheme');
	if (!btn) return;
	var sombre = document.documentElement.getAttribute('data-theme') === 'dark';
	btn.textContent = sombre ? '☀️ Thème clair' : '🌙 Thème sombre';
}

/** Bascule entre clair et sombre (enregistre le choix manuel) */
function toggleTheme() {
	var sombre = document.documentElement.getAttribute('data-theme') === 'dark';
	themeEtat = sombre ? 'light' : 'dark';
	try { localStorage.setItem('theme', themeEtat); } catch (e) {}
	appliquerTheme();
}

/** Applique le thème et suit les changements du thème système (si 'auto') */
function initialiserTheme() {
	appliquerTheme();
	if (window.matchMedia) {
		var mq = window.matchMedia('(prefers-color-scheme: dark)');
		var onChangement = function() { if (lireTheme() === 'auto') appliquerTheme(); };
		if (mq.addEventListener) mq.addEventListener('change', onChangement);
		else if (mq.addListener) mq.addListener(onChangement);
	}
}

/** Retourne la couleur de la carte */
function getCouleur(carte){
	if(bleu.indexOf(carte) >= 0) {
		return 'blue';
	}
	else if (jaune.indexOf(carte) >= 0) {
		return 'orange';
	}
	else if (noir.indexOf(carte) >= 0) {
		return 'black';
	}
	else if (rouge.indexOf(carte) >= 0) {
		return 'red';
	}
	else if (epidemies.indexOf(carte) >= 0) {
		return 'mediumseagreen';
	}
	return 'slategray';
}


/** Permet de retirer les 4 premières cartes du paquet joueur
	ainsi que les roles des 2 joueurs
	Retourne { role, cartes } pour le récap debug de la main initiale */
function miseEnPlaceJoueur(idJoueur) {
	var cartesHtml = "";
	var carte = "";
	var cartesDistribuees = [];
	var role = rolesShuffle.shift();
	for (var i = 0; i <= 3; i++) {
		carte = paquetJoueur.shift();
		cartesDistribuees.push(carte);
		var descEvt = descriptionsEvenement[carte];
		cartesHtml += "<span class='carte-joueur-item'><span class='carte-color' data-color='" + getCouleur(carte) + "'" +
			(descEvt ? ' title="' + descEvt + '" data-aide="evenement" data-nom="' + carte + '" tabindex="0" role="button"' : "") +
			">" + carte + "</span></span>";
	}
	document.getElementById(idJoueur + 'Cartes').innerHTML = cartesHtml;
	document.getElementById(idJoueur + 'Role').innerHTML = role;

	// Couleur du pion
	var numJoueur = idJoueur === 'idJoueur1' ? 1 : 2;
	joueurDuRole[role] = numJoueur;
	var pionColor = couleurPion[role] || '#7f8c8d';

	document.getElementById(idJoueur + 'Image').innerHTML =
		'<div class="player-card-image-wrapper">' +
			'<span class="player-pawn" style="background-color:' + pionColor + ';">' +
				'J' + numJoueur +
			'</span>' +
			'<img src="../images/' + encodeURI(role) + '.png" width="160" height="200" class="zoomA" alt="' + role + '"' +
				' title="' + (descriptionsRole[role] || role) + '"' +
				' data-aide="role" data-nom="' + role + '" tabindex="0" role="button">' +
		'</div>';

	return { role: role, cartes: cartesDistribuees };
}


/** Fonction principale */
function run () {
	// Applique le thème (clair/sombre) et suit les préférences système
	initialiserTheme();

	// Active l'ouverture des descriptions de cartes au clic / tap / clavier
	initialiserAideCartes();

	// S'il existe des paramètres dans la requête, on s'en sert
	vars = {};
	vars['roleJoueur1'] = "";
	vars['roleJoueur2'] = "";
	vars['paquetJoueur'] = "";
	vars['paquetPropagationEntier'] = "";
	vars['pseudos'] = "";
	vars['idUnique'] = "";
	idUnique = 0;

	window.location.href.replace(location.hash, '').replace(
		/[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
		function( m, key, value ) { // callback
			vars[key] = value !== undefined ? value : '';
		}
	);

	if (vars['idUnique'].length >= 1) {
		idUnique = vars['idUnique'];
	}

	// Rejouer un scénario partagé (rôles dans l'URL) → lancement direct
	if(vars['roleJoueur1'].length >= 1 && vars['roleJoueur2'].length >= 1) {
		rolesShuffle[0] = decodeURI(vars['roleJoueur1']);
		rolesShuffle[1] = decodeURI(vars['roleJoueur2']);
		afficherJeu();
		initialiserPartie();
	}
	// Nouvelle partie → écran de sélection des personnages
	else {
		afficherSelection();
	}
}


/** Affiche l'écran de sélection et génère la grille des personnages */
function afficherSelection() {
	document.getElementById('idViewJeu').style.display = "none";
	var sel = document.getElementById('idViewSelection');
	if (sel) sel.style.display = "block";
	// Sur la sélection, le menu ☰ ne propose que "À propos" (ni lien, ni actions de jeu)
	document.querySelectorAll('.menu-item').forEach(function(el) { el.style.display = "none"; });
	document.querySelectorAll('.menu-jeu').forEach(function(el) { el.style.display = "none"; });
	// Ferme les panneaux éventuellement ouverts depuis la vue de jeu
	fermerPanneauxOuverts();
	genererGrillePersonnages();
	genererGrilleEvenements();
}


/** Affiche la vue de jeu */
function afficherJeu() {
	var sel = document.getElementById('idViewSelection');
	if (sel) sel.style.display = "none";
	document.getElementById('idViewJeu').style.display = "block";
	// En jeu, le menu ☰ affiche le lien + les actions de jeu
	document.querySelectorAll('.menu-item').forEach(function(el) { el.style.display = ""; });
	document.querySelectorAll('.menu-jeu').forEach(function(el) { el.style.display = ""; });
	// Ferme les panneaux ouverts depuis l'écran de sélection (À propos, menu ☰, fin de partie)
	fermerPanneauxOuverts();
}

/** Ferme les panneaux auxiliaires (À propos, menu ☰, fin de partie) */
function fermerPanneauxOuverts() {
	var info = document.getElementById('idInfo');
	if (info) info.style.display = "none";
	var menu = document.getElementById('idMenuSecondaire');
	if (menu) menu.style.display = "none";
	var fin = document.getElementById('idFinPartie');
	if (fin) fin.style.display = "none";
}


/** Génère la grille des personnages (cases à cocher) */
function genererGrillePersonnages() {
	var myForm = document.getElementById("idBoxes");
	if (!myForm) return;
	var grid = document.createElement("div");
	grid.className = "character-grid";

	for (var i = 0; i < roles.length; i++) {
		var card = document.createElement("div");
		card.className = "character-card";

		var checkBox = document.createElement("input");
		checkBox.type = "checkbox";
		checkBox.value = roles[i];
		checkBox.id = "id" + i;
		checkBox.className = "character-checkbox";

		var label = document.createElement("label");
		label.className = "character-label";
		label.htmlFor = "id" + i;

		var img = document.createElement("img");
		img.src = "./../images/" + encodeURI(roles[i]) + ".png";
		img.alt = roles[i];
		img.title = descriptionsRole[roles[i]] || roles[i];
		img.loading = "lazy";

		var nameSpan = document.createElement("span");
		nameSpan.className = "character-name";
		nameSpan.textContent = roles[i];

		var selectedBadge = document.createElement("span");
		selectedBadge.className = "character-selected-badge";
		selectedBadge.textContent = "✓";

		label.appendChild(img);
		label.appendChild(nameSpan);
		card.appendChild(checkBox);
		card.appendChild(label);
		card.appendChild(selectedBadge);
		grid.appendChild(card);
	}

	// Bouton Start : dernière cellule de la grille (taille d'une carte personnage)
	var startBtn = document.createElement("button");
	startBtn.type = "button";
	startBtn.className = "btn-start";
	startBtn.title = "Commencer la partie";
	startBtn.innerHTML = '<span class="btn-start-icon">▶</span>' +
		'<span class="btn-start-text-main">READY</span>' +
		'<span class="btn-start-text-sub">TO SURVIVE</span>';
	startBtn.onclick = function() { get_roles(myForm); };
	grid.appendChild(startBtn);

	myForm.appendChild(grid);
}


/** Génère la grille de sélection des cartes événement du paquet */
function genererGrilleEvenements() {
	var container = document.getElementById('idGrilleEvenements');
	if (!container) return;

	// Réinitialise la sélection par défaut : les 8 cartes événement définies
	evenementsSelectionnes = evenements.slice();
	evenementsChoisisParJoueur = false;
	container.innerHTML = "";

	var grid = document.createElement("div");
	grid.className = "evenements-grid";

	evenements.forEach(function(nom) {
		var card = document.createElement("label");
		card.className = "evenement-card";

		var cb = document.createElement("input");
		cb.type = "checkbox";
		cb.className = "evenement-checkbox";
		cb.value = nom;
		cb.checked = evenementsSelectionnes.indexOf(nom) >= 0;
		cb.onchange = function() { mettreAJourCompteurEvenements(); };

		var nomSpan = document.createElement("span");
		nomSpan.className = "evenement-nom";
		nomSpan.textContent = nom;

		card.title = descriptionsEvenement[nom] || "";
		card.appendChild(cb);
		card.appendChild(nomSpan);
		grid.appendChild(card);
	});

	container.appendChild(grid);
	mettreAJourCompteurEvenements();
}

/** Lit les cartes événement cochées dans la grille de sélection */
function lireEvenementsCoches() {
	var liste = [];
	var checks = document.querySelectorAll('.evenement-checkbox:checked');
	for (var i = 0; i < checks.length; i++) {
		liste.push(checks[i].value);
	}
	return liste;
}

/** Applique un mode à la sélection : 'defaut' (les 8 cartes définies) | 'aucun' */
function selectionEvenements(mode) {
	var checks = document.querySelectorAll('.evenement-checkbox');
	for (var i = 0; i < checks.length; i++) {
		if (mode === 'defaut') {
			checks[i].checked = true; // les 8 cartes définies sont toutes cochées par défaut
		} else if (mode === 'aucun') {
			checks[i].checked = false;
		}
	}
	mettreAJourCompteurEvenements();
}

/** Met à jour le compteur de cartes événement sélectionnées */
function mettreAJourCompteurEvenements() {
	var el = document.getElementById('idCompteurEvenements');
	if (!el) return;
	var n = document.querySelectorAll('.evenement-checkbox:checked').length;
	el.textContent = n + " carte" + (n > 1 ? "s" : "") + " événement sélectionnée" + (n > 1 ? "s" : "");
}


/** onclick du bouton Start : récupère les rôles choisis ou les tire au hasard */
function get_roles (form) {
	var count = 0;
	var choice = [];
	var limit = 2; // FIXME: what if more that 2 players

	var checkboxes = form.querySelectorAll('input[type="checkbox"]');
	for (var i = 0; i < checkboxes.length; i++) {
		if (checkboxes[i].checked) {
			if (count < limit) {
				choice[count] = checkboxes[i].value;
				count++;
			} else if (count >= limit) {
				afficherToast("Vous ne pouvez pas choisir plus de " + limit + " personnages", "error");
				return;
			}
		}
	}
	if (count != limit) { // some roles would be random
		var roles_copy = roles.slice();
		for (var k = 0; k < limit; k++) {
			roles_copy = roles_copy.filter(function(e) { return e !== choice[k]; });
		}
		shuffle(roles_copy);
		for (var j = 0; j < limit - count; j++) {
			choice[limit - j - 1] = roles_copy[j];
		}
	}

	// Récupère les cartes événement cochées par le joueur (défaut = cartes définies)
	evenementsSelectionnes = lireEvenementsCoches();
	evenementsChoisisParJoueur = true;

	shuffle(choice);
	demarrerPartie(choice[0], choice[1]);
}


/** Démarre la partie avec les rôles choisis (même page, sans redirection) */
function demarrerPartie(role1, role2) {
	rolesShuffle[0] = role1;
	rolesShuffle[1] = role2;
	afficherJeu();
	initialiserPartie();
}


/** Initialise la partie (paquets, pseudos, lien, mise en place des joueurs) */
function initialiserPartie() {
	// Réinitialise les noms d'épidémies rencontrées (utile en rejeu de lien)
	epidemiesNom = [];

	// Si le paquetJoueur est passé en paramètre, on le prend
	if(vars['paquetJoueur'].length >= 1) {
		paquetJoueur = decodeURI(vars['paquetJoueur']).split('*');

		// Si le paquet propagation vient aussi du lien, preparationPaquetPropagations()
		// n'est pas appelée : on reconstruit l'ordre des épidémies du paquet joueur
		// pour pouvoir afficher leurs noms et descriptions.
		// (même logique de parcours par paires que preparationPaquetPropagations())
		if (vars['paquetPropagationEntier'].length >= 1) {
			for (var e = 8; e < paquetJoueur.length; e += 2) {
				if (epidemies.indexOf(paquetJoueur[e]) >= 0) {
					epidemiesNom.push(paquetJoueur[e]);
				}
				if (epidemies.indexOf(paquetJoueur[e + 1]) >= 0) {
					epidemiesNom.push(paquetJoueur[e + 1]);
				}
			}
		}
	}
	// Sinon, on le génère
	else {
		// Cartes événement du paquet : celles choisies par le joueur (par défaut les 8 cartes définies)
		var evenementsPool = (evenementsChoisisParJoueur ? evenementsSelectionnes.slice() : evenements.slice());

		// Mélange des cartes événement
		shuffle(evenementsPool);

		// Création du paquet joueur : 5 cartes événement (ou moins si le joueur en a choisi moins)
		paquetJoueur = bleu.concat(jaune).concat(noir).concat(rouge).concat(evenementsPool.slice(0, Math.min(5, evenementsPool.length)));

		// Mélange du paquet joueur
		shuffle(paquetJoueur);

		// Mélange le paquet des 6 épidémies
		epidemdiesShuffle = epidemies.slice();
		shuffle(epidemdiesShuffle);

		// Ajout des 6 épidémies en partant de la fin
		paquetJoueur.splice(47 + randomInt(0,7), 0, epidemdiesShuffle.shift());
		paquetJoueur.splice(39 + randomInt(0,7), 0, epidemdiesShuffle.shift());
		paquetJoueur.splice(32 + randomInt(0,7), 0, epidemdiesShuffle.shift());
		paquetJoueur.splice(24 + randomInt(0,8), 0, epidemdiesShuffle.shift());
		paquetJoueur.splice(16 + randomInt(0,8), 0, epidemdiesShuffle.shift());
		paquetJoueur.splice(8 + randomInt(0,8), 0, epidemdiesShuffle.shift());
	}

	// Si le paquet propagation est passé en paramètre, on le prend
	if(vars['paquetPropagationEntier'].length >= 1) {
		paquetPropagationEntier = decodeURI(vars['paquetPropagationEntier']).split('*');
	}
	// Sinon, on le génère
	else {
		// Préparation paquet épdémie
		paquetEpidemie = bleu.concat(jaune).concat(noir).concat(rouge);

		// Mélange du paquet épidémie
		shuffle(paquetEpidemie);

		// Préparation du paquet entier de Propagation
		preparationPaquetPropagations();
	}

	// On teste s'il y a des pseudos
	if (vars['pseudos'].length >= 1) {
		var joueurs = [];
		pseudos = decodeURI(vars['pseudos']).split('*');
		pseudos.forEach(function(item, index, array) {
			// item est du type = potaw.1.0.10.3.5 (pseudo . nbTour . gagnePerdu . nbCartePropa . nbRemedes . nbEclosions)
			var tab = item.split('.');
			joueurs[index] = tab[0];
		});

		// On n'affiche pas dans l'ordre les joueurs qui ont joués, pour ne pas influencer
		shuffle(joueurs);
		afficherToast("Nombre de personnes ayant joué ce scénario (" + idUnique + ") : " + pseudos.length + " — " + joueurs.join(" · "));
	}
	else {
		// On conserve l'idUnique du lien partagé (sinon l'historique du scénario serait perdu)
		if (idUnique == 0) {
			idUnique = Date.now();
			afficherToast("Vous êtes le 1er à jouer ce scénario (" + idUnique + "). Bonne chance !");
		}
		else {
			afficherToast("Rejeu du scénario (" + idUnique + "). Vous êtes le 1er à enregistrer un résultat — bonne chance !");
		}
	}


	// On génère le lien de la partie (URL absolue, ouvrable depuis n'importe où)
	var baseLien = window.location.href.split('#')[0].split('?')[0];
	lienSansPseudo = baseLien + "?" +
					(idUnique == 0 ? "" : "idUnique=" + idUnique) +
					"&roleJoueur1=" +  encodeURI(rolesShuffle[0]) +
					"&roleJoueur2=" +  encodeURI(rolesShuffle[1]) +
					"&paquetJoueur=" + encodeURI(paquetJoueur.join('*')) +
					"&paquetPropagationEntier=" + encodeURI(paquetPropagationEntier.join('*'));

	// Permet de tirer les 4 cartes pour les 2 joueurs
	var main1 = miseEnPlaceJoueur('idJoueur1');
	var main2 = miseEnPlaceJoueur('idJoueur2');
	construireMainInitiale(main1, main2);

	// On écrit toutes les cartes au cas où
	document.getElementById('idSpoilPaquetJoueur').innerHTML = paquetJoueur.join("<br />");
	document.getElementById('idSpoilPaquetPropagation').innerHTML = paquetPropagationEntier.join("<br />");

	// Initialisation du panneau propagation
	initialiserPanelPropagation();

	// État initial du bouton unique
	mettreAJourBoutonUnique();
}


/** Affiche et supprime la 1ère carte du paquet joueur */
function tirerCartes(idCarte) {
	var isIdCarte1 = idCarte == 'idCarte1';
	if (isIdCarte1) {
		isChronoDejaTourne = false;
		document.getElementById('idGoJoueur').className = "";
		isPseudoGagnePerduCeTour("J");
		document.getElementById('idButtonCarte1').style.display = "none";
		document.getElementById('idButtonCarte2').style.display = "block";
		// Début de tour : on vide le cadre du joueur actif (les 4 initiales incluses)
		var monContainer = document.getElementById('idJoueur' + joueurActif + 'Cartes');
		if (monContainer) {
			monContainer.innerHTML = "";
		}
	}
	else {
		document.getElementById('idButtonCarte1').style.display = "block";
		document.getElementById('idButtonCarte1').disabled = true;
		document.getElementById('idButtonCarte2').style.display = "none";
		document.getElementById('idTournePropagation').disabled = false;
	}

	// S'il n'y a plus de carte dans le paquet, alors la partie est perdue
	if(paquetJoueur.length == 0) {
		afficherModal("💀 Partie perdue", "Désolé, il ne reste plus de carte... vous avez perdu !");
		document.getElementById('idTournePropagation').disabled = true;
		return;
	}

	// On prend la prochaine carte du paquet
	var carte = paquetJoueur.shift();
	// Si c'est une carte événement, on affiche sa description au survol et au tap
	var descEvt = descriptionsEvenement[carte];
	var htmlCarte = "<span class='carte-color' data-color='" + getCouleur(carte) + "'" +
		(descEvt ? ' title="' + descEvt + '" data-aide="evenement" data-nom="' + carte + '" tabindex="0" role="button"' : "") +
		">" + carte + "</span>";
	document.getElementById('idRecap').innerHTML += carte + "<br />";

	// Ajouter la carte dans la zone du joueur actif (suite des 4 premières)
	// Les cartes ne sont pas persistantes : on vide le cadre de l'autre joueur
	var autreJoueur = joueurActif == 1 ? 2 : 1;
	var autreContainer = document.getElementById('idJoueur' + autreJoueur + 'Cartes');
	if (autreContainer) {
		autreContainer.innerHTML = "";
	}
	var cartesContainer = document.getElementById('idJoueur' + joueurActif + 'Cartes');
	if (cartesContainer) {
		var carteEl = document.createElement('span');
		carteEl.className = 'carte-joueur-item';
		carteEl.innerHTML = htmlCarte;
		cartesContainer.appendChild(carteEl);
	}

	mettreAJourBoutonUnique();
}


/** Cacher ou afficher des div passés en paramètre */
function cacherAfficherCartes(idAmodifier, idLienAmodifier) {
	var noneBlock = document.getElementById(idAmodifier).style.display == "block" ? "none" : "block";
	if (noneBlock == 'block') {
		document.getElementById(idLienAmodifier).innerHTML = "Cacher";
	}
	else {
		document.getElementById(idLienAmodifier).innerHTML = "Afficher";
	}
	document.getElementById(idAmodifier).style.display = noneBlock;
}


/** Retourne combien de cartes ville du paquet propatation il faut tirer */
function combienTirerDeCartes (nbEpidemies) {
	if (nbEpidemies <= 2) {
		return 2;
	}
	else if (nbEpidemies <= 4) {
		return 3;
	}
	return 4;
}


/** On crée un paquet de cartes avec déjà toutes les épidémies */
function preparationPaquetPropagations() {
	var defaussePropagation = [];
	var nbEpidemies = 0;
	var villePropagation = [];

	// Compteur du paquet paquetPropagationEntier
	var j = 0;

	// Compteur du paquet defaussePropagation
	var k = 0;

	// On tire les 9 premières cartes des maladies
	for (var i = 1 ; i <= 9 ; i++) {
		villePropagation = paquetEpidemie.shift();
		paquetPropagationEntier[j++] = i + "/9 - " + villePropagation;
		defaussePropagation[k++] = villePropagation;
	}

	// On parcourt chaque carte du paquet joueur
	for (var i = 8 ; i < paquetJoueur.length ; i++) {
		var nbEpidemiesEn2Cartes = 0;

		// Combien d'épidémies dans les 2 prochaines cartes ?
		if (epidemies.indexOf(paquetJoueur[i]) >= 0) {
			nbEpidemiesEn2Cartes++;
			epidemiesNom.push(paquetJoueur[i]);
		}
		if (epidemies.indexOf(paquetJoueur[i + 1]) >= 0) {
			nbEpidemiesEn2Cartes++;
			epidemiesNom.push(paquetJoueur[i + 1]);
		}

		// On boucle sur le nombre de cartes épidémies tournées en 2 cartes
		for (var epi = 1 ; epi <= nbEpidemiesEn2Cartes ; epi++) {
			nbEpidemies++;
			// On pioche la carte de sous le paquet
			var villeEpidemie = paquetEpidemie.pop();

			// On ajoute la carte épidémie à la défausse
			defaussePropagation[k++] = villeEpidemie;

			// On ajoute dans le paquetPropagationEntier l'épidémie
			paquetPropagationEntier[j++] = "Epidemie n° " + nbEpidemies + " - " + villeEpidemie;

			// On mélange la défausse
			shuffle(defaussePropagation);

			// on la met au-dessus du paquet
			paquetEpidemie = defaussePropagation.concat(paquetEpidemie);

			// On vide le paquet defaussePropagation
			defaussePropagation.length = 0;
			k = 0;
		}

		var nbCartes = combienTirerDeCartes(nbEpidemies);
		for(var carte = 1; carte <= nbCartes ; carte++) {
			villePropagation = paquetEpidemie.shift();
			paquetPropagationEntier[j++] = carte + "/" + nbCartes + " - " + villePropagation;
			defaussePropagation[k++] = villePropagation;
		}

		// On tire les cartes 2 par 2
		i++;
	}
}

/** Informe par message si un joueur a déjà gagné ou perdue au tour en cours */
function isPseudoGagnePerduCeTour(typeCarte) {
	pseudos.forEach(function(item, index, array) {
		// item est du type = potaw.1.0.10 (pseudo . nbTour . gagnePerdu . nbCartePropa . nbRemedes . nbEclosions)
		var tab = item.split('.');

		/* Cas général :
		 - on perd quand on tire une carte propagation
		 - on gagne avant de tirer une carte du paquet joueur
		Cas particulier :
		 - on peut perdre si on tire la dernière carte du paquet joueur
		*/

		// Cas particulier
		if (paquetJoueur.length == 1 && nbTours == MAX_TOURS && nbTours == tab[1]) {
			afficherToast("Le joueur " + tab[0] + " a perdu aussi par manque de carte dans le paquet joueur.", "error");
		}

		// Cas général
		// Si on tire une carte Propagation, on regarde si quelqu'un a perdu
		if (typeCarte == "P" && tab[1] <= (MAX_TOURS - 1) ) {
			// Si la partie était perdue et qu'on a tournée le même nombre de cartes
			if (tab[2] == '0' && nbCartesPropagationTournees == tab[3]) {
				afficherToast("Le joueur " + tab[0] + " a perdu sur cette prochaine carte propagation.", "error");
				}
			}

		// Si on tire une carte Joueur, on regarde si un quelqu'un a gagné
		if (typeCarte == "J") {
			// Si la partie était gagnée et qu'on est on même nombre
			if (tab[2] == '1' && nbTours == tab[1]) {
				afficherToast("Le joueur " + tab[0] + " a gagné au tour précédent.", "success");
			}
		}
	});
}


/** Retourne le nombre de cubes à ajouter selon la position dans les 9 initiales */
function getNbCubesPourCarte(carteStr, indexGlobal) {
	if (carteStr.indexOf("Epidemie") >= 0) {
		return 0;
	}

	// On se base d'abord sur l'étiquette de la carte, indépendamment de l'ordre des appels.
	// Infection initiale : "X/9 - Ville" (X de 1 à 9) → 3 / 3 / 3 / 2 / 2 / 2 / 1 / 1 / 1 cubes.
	var debut = carteStr.split('-')[0].trim();
	var parts = debut.split('/');
	if (parts.length === 2) {
		var numLot = parseInt(parts[0], 10);
		var denomLot = parseInt(parts[1], 10);
		if (!isNaN(numLot) && denomLot === 9) {
			if (numLot <= 3) return 3;
			if (numLot <= 6) return 2;
			return 1;
		}
		// Lots de propagation normaux : 1 cube par ville
		return 1;
	}

	// Repli : index 0-based (les 9 premières cartes = infection initiale)
	if (indexGlobal < 3) return 3;
	if (indexGlobal < 6) return 2;
	return 1;
}

/** Initialise le panneau propagation avec les infos du prochain lot */
function initialiserPanelPropagation() {
	if (paquetPropagationEntier.length === 0) return;
	var premiereCarte = paquetPropagationEntier[0];
	var parties = premiereCarte.split('-');
	var debut = parties[0].trim(); // ex: "1/9" ou "Epidemie n° 1"
	
	var nbATirer = "-";
	if (debut.indexOf('/') >= 0) {
		var denom = debut.split('/')[1];
		nbATirer = denom;
	}
	document.getElementById('idCartesATirer').textContent = nbATirer;
	mettreAJourPanelPropagation();
}

/** Met à jour l'affichage du panneau propagation */
function mettreAJourPanelPropagation() {
	document.getElementById('idNbEpidemies').textContent = nbEpidemiesTombees;
}

/** Retourne le nombre d'épidémies en tête du paquet propagation restant */
function compterEpidemiesEnTete() {
	var count = 0;
	for (var i = 0; i < paquetPropagationEntier.length; i++) {
		if (paquetPropagationEntier[i].indexOf("Epidemie") >= 0) {
			count++;
		} else {
			break;
		}
	}
	return count;
}

/** Met à jour le compteur "Cartes à tirer" d'après la carte qui vient d'être tirée */
function mettreAJourCartesATirer(carteStr) {
	if (!carteStr) {
		// Fin de lot : initialiser le compteur pour le lot suivant
		if (paquetPropagationEntier.length > 0) {
			var nbEpiTete = compterEpidemiesEnTete();
			var prochaineReguliere = paquetPropagationEntier[nbEpiTete];
			if (prochaineReguliere) {
				var debut = prochaineReguliere.split('-')[0].trim();
				if (debut.indexOf('/') >= 0) {
					var denom = parseInt(debut.split('/')[1], 10);
					if (!isNaN(denom)) {
						document.getElementById('idCartesATirer').textContent = denom + nbEpiTete;
					}
				}
			}
		}
		return;
	}
	// Une épidémie → décrémenter le compteur (elle compte comme une carte tirée)
	if (carteStr.indexOf("Epidemie") >= 0) {
		var actuel = document.getElementById('idCartesATirer').textContent;
		if (actuel !== '-' && actuel !== '') {
			var reste = parseInt(actuel, 10);
			if (!isNaN(reste) && reste > 0) {
				document.getElementById('idCartesATirer').textContent = reste - 1;
			}
		}
		return;
	}
	// Format: "X/Y - Ville" → extraire X et Y
	var debut = carteStr.split('-')[0].trim();
	if (debut.indexOf('/') < 0) return;
	var num = parseInt(debut.split('/')[0], 10);
	var denom = parseInt(debut.split('/')[1], 10);
	if (isNaN(num) || isNaN(denom)) return;
	var reste = denom - num; // cartes restantes à tirer après celle-ci
	document.getElementById('idCartesATirer').textContent = reste;
}

/** Ajoute une carte au panneau de propagation visuel */
function ajouterCarteAuPanel(carteStr) {
	var container = document.getElementById('idPropagationCartes');
	// Enlever le message "En attente"
	var emptyMsg = container.querySelector('.propagation-empty');
	if (emptyMsg) emptyMsg.remove();

	if (carteStr.indexOf("Epidemie") >= 0) {
		// Carte épidémie → va dans le bloc épidémies séparé (sans la ville)
		var epidemiesContainer = document.getElementById('idPropagationEpidemies');
		var epidemiesCartes = document.getElementById('idEpidemiesCartes');
		epidemiesContainer.style.display = "block";

		// Extraire le numéro d'épidémie pour retrouver son nom
		var numEpi = parseInt(carteStr.replace(/^Epidemie n° (\d+).*$/, '$1'), 10);
		var nomEpidemie = (!isNaN(numEpi) && epidemiesNom[numEpi - 1]) ? epidemiesNom[numEpi - 1] : '';

		var el = document.createElement('div');
		el.className = 'propa-card propa-epidemic';
		var html = '<span class="propa-card-label">💀 Épidémie</span>';
		if (nomEpidemie) {
			var descEpi = descriptionsEpidemie[nomEpidemie] || '';
			html += '<span class="propa-card-epidemic-name" title="' + descEpi + '"' +
				' data-aide="epidemie" data-nom="' + nomEpidemie + '" tabindex="0" role="button">' +
				nomEpidemie + '</span>';
		}
		el.innerHTML = html;
		epidemiesCartes.appendChild(el);

		// La ville touchée est aussi ajoutée dans le flux principal de propagation (avec 3 cubes comme dans les règles)
		var parties = carteStr.split('-');
		var nomVille = parties.length > 1 ? parties[1].trim() : "???";
		var couleur = getCouleur(nomVille);
		var elVille = document.createElement('div');
		elVille.className = 'propa-card';
		var cubesHtml = '';
		for (var c = 0; c < 3; c++) {
			cubesHtml += '<span class="cube" style="background-color:' + couleur + ';"></span>';
		}
		elVille.innerHTML =
			'<span class="propa-card-ville carte-color" data-color="' + couleur + '">' + nomVille + '</span>' +
			'<span class="propa-card-cubes">' + cubesHtml + '</span>';
		container.appendChild(elVille);
		return;
	}

	// Carte ville : extraire uniquement le nom de la ville (sans le "X/Y")
	var parties = carteStr.split('-');
	var nomVille = parties[1].trim();
	var couleur = getCouleur(nomVille);
	var nbCubes = getNbCubesPourCarte(carteStr, cartesPropagationTirees.length);

	// Construire les petits carrés de cubes
	var cubesHtml = '';
	for (var c = 0; c < nbCubes; c++) {
		cubesHtml += '<span class="cube" style="background-color:' + couleur + ';"></span>';
	}

	var el = document.createElement('div');
	el.className = 'propa-card';
	el.innerHTML =
		'<span class="propa-card-ville carte-color" data-color="' + couleur + '">' + nomVille + '</span>' +
		'<span class="propa-card-cubes">' + cubesHtml + '</span>';
	container.appendChild(el);
}


/** Permet de tourner les cartes du paquet propagation */
function tournePropogation(){
	nbCartesPropagationTournees++;

	// On récupère 1ère carte du paquet propagation
	var carte = paquetPropagationEntier.shift();

	// Détection épidémie
	if (carte.indexOf("Epidemie") >= 0) {
		nbEpidemiesTombees++;
	}

	// Ajout au panneau visuel
	// IMPORTANT : la carte n'est ajoutée à cartesPropagationTirees qu'APRÈS le rendu,
	// pour que l'index passé à getNbCubesPourCarte() soit bien 0-based.
	ajouterCarteAuPanel(carte);
	cartesPropagationTirees.push(carte);
	mettreAJourPanelPropagation();
	mettreAJourCartesATirer(carte);

	document.getElementById('idRecap').innerHTML += carte + "<br />";

	// Ici, on tire la X° carte sur X cartes à tirer du paquet propagation.
	// Fin de lot détectée quand le numérateur vaut le dénominateur (ex. "4/4 - Ville").
	var debutCarte = carte.split('-')[0].trim();
	var numLot = parseInt(debutCarte.split('/')[0], 10);
	var denomLot = parseInt(debutCarte.split('/')[1], 10);
	if (!isNaN(numLot) && !isNaN(denomLot) && numLot === denomLot) {
		var joueur = (paquetJoueur.length + 1) % 4 == 0 ? 1 : 2;
		document.getElementById('idTournePropagation').disabled = true;
		document.getElementById('idGoJoueur').innerHTML = "Tour : " + document.getElementById('idJoueur' + joueur + 'Role').innerHTML;
		document.getElementById('idGoJoueur').className = "goJoueur";
		surlignerJoueur(joueur);
		// Mise à jour du lot suivant
		mettreAJourCartesATirer();
	}
	isPseudoGagnePerduCeTour("P");
mettreAJourBoutonUnique();
}


/** Met en surbrillance le joueur actif et grise l'autre */
function surlignerJoueur(numJoueur) {
	joueurActif = numJoueur;
	var joueur1 = document.getElementById('idJoueur1');
	var joueur2 = document.getElementById('idJoueur2');
	if (joueur1 && joueur2) {
		joueur1.classList.toggle('joueur-actif', numJoueur === 1);
		joueur2.classList.toggle('joueur-actif', numJoueur === 2);
	}
}


/** Lorqu'on est en survol du chrono */
function nouveauTour() {
	if (document.getElementById('idGoJoueur').className == "goJoueur") {
		document.getElementById('idButtonCarte1').disabled = false;
		// Début de tour : on ne garde que la dernière carte de propagation (le top deck)
		var propContainer = document.getElementById('idPropagationCartes');
		var cartesProp = propContainer.querySelectorAll('.propa-card');
		for (var i = 0; i < cartesProp.length - 1; i++) {
			cartesProp[i].remove();
		}
		// Grise la dernière carte conservée pour la différencier des nouvelles
		if (cartesProp.length > 0) {
			cartesProp[cartesProp.length - 1].classList.add('propa-card-grisee');
		}
		if (isChronoDejaTourne == false) {
			isChronoDejaTourne = true;
			nbTours++;
			document.getElementById('idRecap').innerHTML += "<b>Tour " + nbTours + " : " + document.getElementById('idGoJoueur').innerHTML + "</b><br />";
		}
	}
	mettreAJourBoutonUnique();
}

/** Permet de saisir les champs de Nombres de remèdes et d'éclosions en fin de partie */
function remplirChampsFinPartie(isGagne){
	// On active les champs
	document.getElementById('idNbRemedesEclosions').style.display = "block";
	if(isGagne) {
		document.getElementById('idNbRemedes').value = "4";
	}
	else {
		document.getElementById('idNbRemedes').value = "0";
	}
}

/** Partie terminée */
function partieTerminee(){
	var gagnePerdue = -1 ;
	var ps = document.getElementById('idPseudo').value;

	// Si rien n'est rempli (pas de pseudo ni de résultat) → on copie juste le lien
	if (ps == "" && !document.getElementById('idGagne').checked && !document.getElementById('idPerdu').checked) {
		genererLienPartie();
		return;
	}

	// Si le pseudo n'est pas rempli
	if(ps == "") {
		afficherToast("Vous devez saisir un pseudo", "error");
		return;
	}

	// Validation du pseudo (évite l'injection HTML et préserve le format "pseudo.tour.gagne.nbCarte.nbRemedes.nbEclosions")
	if(!PSEUDO_REGEX.test(ps)) {
		afficherToast("Pseudo invalide : utilisez 1 à 16 lettres, chiffres ou tirets bas (_).", "error");
		return;
	}

	// On vérifier qu'un bouton radio ait été coché
	if (document.getElementById('idGagne').checked) {
		gagnePerdue = 1;
		afficherToast("Félicitations " + ps + " !", "success");
	}
	if (document.getElementById('idPerdu').checked) {
		gagnePerdue = 0;
		afficherToast("Dommage " + ps + "...", "warning");
	}

	// Si le joueur n'a pas cliqué sur Gagné ou Perdu
	if (gagnePerdue == -1) {
		afficherToast("Vous devez cocher une case", "error");
		return;
	}
	pseudos[pseudos.length] = ps + "." + nbTours + "." + gagnePerdue + "." + nbCartesPropagationTournees + "." + document.getElementById('idNbRemedes').value + "." + document.getElementById('idNbEclosions').value;
	
	// On affiche le tableau récapitulatif si d'autres jouerus ont déjà joués cette partie
	if (pseudos.length >=2) {
		afficherHistoriquePartie();
		document.getElementById('idDebug').checked = true;
		debug();
	}
	genererLienPartie();
}


/** Échappe les caractères HTML pour éviter toute injection (XSS) */
function escapeHtml(str) {
	// Entités construites par concaténation (évite tout décodage prématuré du code source)
	var ENT = {
		'&': '&' + 'amp;',
		'<': '&' + 'lt;',
		'>': '&' + 'gt;',
		'"': '&' + 'quot;',
		"'": '&' + '#39;'
	};
	return String(str).replace(/[&<>"']/g, function(ch) { return ENT[ch]; });
}

/** Génère le lien de la partie */
function genererLienPartie() {
	// Lien sans pseudo si aucun joueur n'a encore été enregistré
	var lien = pseudos.length > 0 ? lienSansPseudo + "&pseudos=" + pseudos.join('*') : lienSansPseudo;
	document.getElementById('idLienPartie').href = lien;

	// Copie via l'API Clipboard, avec repli si indisponible ou en échec
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard.writeText(lien)
			.then(function() { afficherToast("Lien copié !"); })
			.catch(function(err) {
				console.error("Erreur lors de la copie : ", err);
				copierLienFallback(lien);
			});
	} else {
		copierLienFallback(lien);
	}
}

/** Repli de copie : zone de texte temporaire + execCommand, sinon lien visible */
function copierLienFallback(lien) {
	var textarea = document.createElement('textarea');
	textarea.value = lien;
	textarea.setAttribute('readonly', '');
	textarea.style.position = 'fixed';
	textarea.style.top = '0';
	textarea.style.left = '0';
	textarea.style.opacity = '0';
	document.body.appendChild(textarea);
	textarea.focus();
	textarea.select();
	var ok = false;
	try {
		ok = document.execCommand('copy');
	} catch (e) { /* ignoré */ }
	document.body.removeChild(textarea);

	if (ok) {
		afficherToast("Lien copié !");
	} else {
		// Dernier recours : afficher le lien sous forme cliquable
		var lienEl = document.getElementById('idLienPartie');
		if (lienEl) {
			lienEl.textContent = lien;
			lienEl.target = "_blank";
			document.getElementById('idSpanLienPartie').style.display = "block";
		}
		afficherToast("Copie impossible : cliquez sur le lien affiché ci-dessous");
	}
}

/** Ouvre / ferme le menu secondaire (☰) */
function toggleMenu() {
	var menu = document.getElementById('idMenuSecondaire');
	if (menu) {
		menu.style.display = menu.style.display == "block" ? "none" : "block";
	}
}

/** Affiche / masque le formulaire de fin de partie */
function toggleFinPartie() {
	var fp = document.getElementById('idFinPartie');
	if (fp) {
		fp.style.display = fp.style.display == "block" ? "none" : "block";
	}
}

/** Affiche / masque le panneau "À propos" (version / auteurs) */
function toggleInfo() {
	var info = document.getElementById('idInfo');
	if (info) {
		info.style.display = info.style.display == "block" ? "none" : "block";
	}
}


/** Affiche une notification temporaire (toast) qui disparaît d'elle-même
	type : 'info' (défaut), 'success', 'warning', 'error' */
var toastTimer = null;
function afficherToast(message, type) {
	var toast = document.getElementById('idToast');
	if (!toast) return;
	toast.textContent = message;
	toast.className = "toast" + (type ? " toast-" + type : "");
	toast.style.display = "block";
	toast.style.opacity = "1";
	if (toastTimer) clearTimeout(toastTimer);
	var duree = (type == "error") ? 6000 : 4000;
	toastTimer = setTimeout(function() {
		toast.style.opacity = "0";
		setTimeout(function() { toast.style.display = "none"; }, 300);
	}, duree);
}

/** Affiche une modale générique (remplace alert/confirm).
	boutons : tableau de { label, cls, onClick } — par défaut un seul bouton "OK" */
function afficherModal(titre, message, boutons) {
	var overlay = document.getElementById('idModal');
	if (!overlay) return;
	document.getElementById('idModalTitle').textContent = titre || "";
	document.getElementById('idModalMessage').textContent = message || "";
	var actions = document.getElementById('idModalActions');
	actions.innerHTML = "";
	var liste = (boutons && boutons.length) ? boutons : [{ label: "OK", cls: "primary" }];
	liste.forEach(function(b) {
		var btn = document.createElement('button');
		btn.type = "button";
		btn.className = "modal-btn " + (b.cls || "primary");
		btn.textContent = b.label;
		btn.onclick = function() {
			fermerModal();
			if (typeof b.onClick === "function") b.onClick();
		};
		actions.appendChild(btn);
	});
	overlay.style.display = "flex";
	var premier = actions.querySelector('button');
	if (premier) premier.focus();
}

/** Ferme la modale générique */
function fermerModal() {
	var overlay = document.getElementById('idModal');
	if (overlay) overlay.style.display = "none";
}

/** Enregistre l'écouteur délégué qui ouvre la description d'une carte au clic/tap ou au clavier */
function initialiserAideCartes() {
	if (window.aideCartesInitialisee) return;
	window.aideCartesInitialisee = true;

	document.addEventListener('click', function(e) {
		var cible = (e.target && e.target.closest) ? e.target.closest('[data-aide]') : null;
		if (!cible) return;
		e.preventDefault();
		afficherAideCarte(cible.getAttribute('data-aide'), cible.getAttribute('data-nom'));
	});

	document.addEventListener('keydown', function(e) {
		if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
		var cible = (e.target && e.target.closest) ? e.target.closest('[data-aide]') : null;
		if (!cible) return;
		e.preventDefault();
		afficherAideCarte(cible.getAttribute('data-aide'), cible.getAttribute('data-nom'));
	});
}

/** Affiche dans la modale la description d'une carte (événement, épidémie ou rôle) */
function afficherAideCarte(type, nom) {
	if (!nom) return;
	var prefixe = "";
	var desc = "";
	if (type === 'evenement') {
		prefixe = "🃏 Événement";
		desc = descriptionsEvenement[nom] || "";
	}
	else if (type === 'epidemie') {
		prefixe = "💀 Épidémie";
		desc = descriptionsEpidemie[nom] || "";
	}
	else if (type === 'role') {
		prefixe = "👤 Rôle";
		desc = descriptionsRole[nom] || "";
	}
	if (!desc) desc = "Aucune description disponible.";
	afficherModal(prefixe + " — " + nom, desc);
}

/** Contenu HTML de la main initiale distribuée (debug) */
var mainInitialeHtml = "";

/** Mémorise et construit le récap debug des cartes distribuées au départ */
function construireMainInitiale(main1, main2) {
	mainInitialeHtml = "";
	[main1, main2].forEach(function(m, index) {
		if (!m) return;
		var cartes = (m.cartes || []).map(function(c) { return escapeHtml(c); }).join(", ");
		mainInitialeHtml += "J" + (index + 1) + " — " + escapeHtml(m.role) + " : " + cartes + "<br />";
	});
	var el = document.getElementById('idMainInitiale');
	if (el) el.innerHTML = mainInitialeHtml;
}

/** Affiche / masque la main initiale distribuée (debug) */
function afficherMainInitiale() {
	var el = document.getElementById('idMainInitiale');
	if (!el) return;
	if (!mainInitialeHtml) {
		afficherModal("🃏 Main initiale", "Aucune distribution initiale disponible (la partie n'a pas encore démarré).");
		return;
	}
	cacherAfficherCartes('idMainInitiale', 'idLienMainInitiale');
}

/** Nouvelle partie (avec confirmation via modale) */
function nouvellePartie() {
	afficherModal("🔄 Nouvelle partie", "Voulez-vous démarrer une nouvelle partie ?", [
		{ label: "Annuler", cls: "secondary" },
		{ label: "Oui, nouvelle partie", cls: "primary", onClick: function() { window.location.replace("../views/index.html"); } }
	]);
}

/** Permet de rendre visible quelques données de débugage */
function debug() {
	document.getElementById('idDivDebug').style.display = document.getElementById('idDebug').checked ? "block" : "none";
}


/** Retourne la durée du chrono pour le tour courant (2 min tour 1, 1 min 20 ensuite) */
function dureeChronoTour() {
	return nbTours <= 1 ? 120 : 80;
}

/** Met à jour l'état (activé/désactivé) ET le libellé du bouton unique */
function mettreAJourBoutonUnique() {
	var btn = document.getElementById('idBoutonUnique');
	if (!btn) return;
	var actif = false;
	var icone = "⏸";
	var label = "Attente";

	// Menu de pause ouvert → le bouton principal est inactif (on utilise le menu)
	if (document.getElementById('idMenuChrono').style.display == "block") {
		actif = false;
		icone = "⏸";
		label = "En pause";
	}
	// Chrono en cours → le bouton affiche le décompte et sert à mettre en pause
	else if (isTimerRunning()) {
		actif = true;
		icone = "⏸";
		label = "Pause — " + getTempsFormate();
	}
	// IMPORTANT : vérifier les états des boutons AVANT le statut goJoueur,
	// car goJoueur est remis à "" après la 1ère carte joueur.

	// Tirer la 2nde carte joueur (bouton 2 visible)
	else if (document.getElementById('idButtonCarte2').style.display == "block") {
		actif = true;
		icone = "🎴";
		label = "Tirer carte J" + joueurActif;
	}
	// Propagation (initiale OU d'un tour) : bouton propagation actif
	else if (!document.getElementById('idTournePropagation').disabled) {
		actif = true;
		icone = "🦠";
		label = "Tirer propagation";
	}
	// Tirer la 1ère carte joueur (bouton 1 actif)
	else if (!document.getElementById('idButtonCarte1').disabled &&
			 document.getElementById('idButtonCarte1').style.display != "none") {
		actif = true;
		icone = "🎴";
		label = "Tirer carte J" + joueurActif;
	}
	// Nouveau tour à démarrer ("Tour : [Rôle]" affiché, rien à tirer)
	else if (document.getElementById('idGoJoueur').className == "goJoueur") {
		actif = true;
		icone = "▶";
		label = "Nouveau tour";
	}

	btn.disabled = !actif;
	btn.setAttribute('aria-label', label);
	btn.innerHTML = '<span class="bouton-unique-icone">' + icone + '</span>' +
					'<span class="bouton-unique-label">' + label + '</span>';
}


/** Bouton unique : tire automatiquement la bonne carte selon l'état du jeu */
function boutonUnique() {
	var btn = document.getElementById('idBoutonUnique');
	if (btn.disabled) return;

	// Chrono en cours → un clic met en pause et affiche le menu
	if (isTimerRunning()) {
		pauseTimer();
		document.getElementById('idMenuChrono').style.display = "block";
		mettreAJourBoutonUnique();
		return;
	}

	// Tirer la 2nde carte joueur (bouton 2 visible)
	if (document.getElementById('idButtonCarte2').style.display == "block") {
		tirerCartes('idCarte2');
	}
	// Propagation (initiale OU d'un tour) : bouton propagation actif
	else if (!document.getElementById('idTournePropagation').disabled) {
		tournePropogation();
	}
	// Tirer la 1ère carte joueur (bouton 1 actif)
	else if (!document.getElementById('idButtonCarte1').disabled &&
			 document.getElementById('idButtonCarte1').style.display != "none") {
		tirerCartes('idCarte1');
	}
	// Nouveau tour : démarre le tour ET lance le chrono
	else if (document.getElementById('idGoJoueur').className == "goJoueur") {
		nouveauTour();
		startTimerDuree(dureeChronoTour());
	}

	mettreAJourBoutonUnique();
}


/** Gère le choix dans le menu pause du chrono */
function choixChrono(choix) {
	document.getElementById('idMenuChrono').style.display = "none";
	if (choix == 'reset') {
		// Repartir du temps initial du tour courant
		startTimerDuree(dureeChronoTour());
	}
	else if (choix == 'reprise') {
		// Reprendre le décompte là où il en était
		resumeTimer();
	}
	else if (choix == 'stop' || choix == 'continue') {
		// Fin du chrono → on permet le tirage suivant
		stopTimer();
	}
	mettreAJourBoutonUnique();
}


/** Construit le tableau de l'historique des joueurs du scénario (sans changer la visibilité) */
function construireHistoriquePartie () {
	var el = document.getElementById('idSpoilHistoJoueurs');
	if (!el) return;

	if (pseudos.length === 0) {
		el.innerHTML = "<center>Aucun autre joueur n'a encore enregistré de résultat pour ce scénario (idUnique : " +
			escapeHtml(idUnique) + ").</center>";
		return;
	}

	var monTableau = "<center>Si une équipe perd <b>avant le " + MAX_TOURS + "° tour</b> : soit le nombre d'éclosions est à 8, soit il manquait des cubes.<table border='1'> "+
						"<tr> "+
						"	<th>Joueurs</th> "+
						"	<th>Status</th> "+
						"	<th>Nb tour (paquet joueur)</th> "+
						"	<th>Nb cartes Propagation</th> "+
						"	<th>Nb remèdes</th> "+
						"	<th>Nb éclosions</th> "+
						"</tr>";

	pseudos.forEach(function(item, index, array) {
		// item est du type = potaw.1.0.10 (pseudo . nbTour . gagnePerdu . nbCartePropa . nbRemedes . nbEclosions)
		var tab = item.split('.');
		monTableau += "<tr> "+
						"<td>" + escapeHtml(tab[0]) + "</td>"+
						"<td>" + (tab[2] == 0 ? "Perdu" : "Gagné") + "</td>"+
						"<td>" + escapeHtml(tab[1]) + "</td>"+
						"<td>" + escapeHtml(tab[3]) + "</td>"+
						"<td>" + escapeHtml(tab[4]) + "</td>"+
						"<td>" + escapeHtml(tab[5]) + "</td>"+
					"</tr>";
	});
	el.innerHTML = monTableau + "</table></center>";
}

/** Force l'affichage du tableau de l'historique des joueurs */
function afficherHistoriquePartie () {
	construireHistoriquePartie();
	var el = document.getElementById('idSpoilHistoJoueurs');
	var lien = document.getElementById('idLienSpoilHistoJoueurs');
	if (el) el.style.display = "block";
	if (lien) lien.innerHTML = "Cacher";
}

/** Affiche / masque le tableau de l'historique des joueurs */
function historiquePartie () {
	var el = document.getElementById('idSpoilHistoJoueurs');
	if (!el) return;
	if (el.style.display == "block") {
		el.style.display = "none";
		var lien = document.getElementById('idLienSpoilHistoJoueurs');
		if (lien) lien.innerHTML = "Afficher";
		return;
	}
	afficherHistoriquePartie();
}
