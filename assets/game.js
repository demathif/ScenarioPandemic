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

// Permet de bien compter le nombre de tour
var isChronoDejaTourne = false;

/** Mapping rôle → numéro de joueur (1 ou 2) */
var joueurDuRole = {};

/** Joueur actif (1 ou 2) */
var joueurActif = 1;

/** Suivi des propagations */
var nbEpidemiesTombees = 0;
var cubesParVille = {};
var cartesPropagationTirees = [];

/** Noms des épidémies dans l'ordre où elles sont rencontrées */
var epidemiesNom = [];

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
	ainsi que les roles des 2 joueurs */
function miseEnPlaceJoueur(idJoueur) {
	var cartesHtml = "";
	var carte = "";
	var role = rolesShuffle.shift();
	for (var i = 0; i <= 3; i++) {
		carte = paquetJoueur.shift();
		var descEvt = descriptionsEvenement[carte];
		cartesHtml += "<span class='carte-joueur-item'><span class='carte-color' data-color='" + getCouleur(carte) + "'" +
			(descEvt ? ' title="' + descEvt + '"' : "") + ">" + carte + "</span></span>";
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
			'<img src="../images/' + encodeURI(role) + '.png" width="100" height="130" class="zoomA" alt="' + role + '" title="' + (descriptionsRole[role] || role) + '">' +
		'</div>';
}


/** Fonction principale */
function run () {
	// S'il existe des paramètres dans la requête, on s'en sert
	var vars = {};
	vars['roleJoueur1'] = "";
	vars['roleJoueur2'] = "";
	vars['paquetJoueur'] = "";
	vars['paquetPropagationEntier'] = "";
	vars['pseudos'] = "";
	vars['idUnique'] = "";
	var idUnique = 0;

	window.location.href.replace(location.hash, '').replace( 
		/[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
		function( m, key, value ) { // callback
			vars[key] = value !== undefined ? value : '';
		}
	);

	if (vars['idUnique'].length >= 1) {
		idUnique = vars['idUnique'];
	}

	// Si les rôles sont passés en paramètre, on les prend
	if(vars['roleJoueur1'].length >= 1 && vars['roleJoueur2'].length >= 1) {
		rolesShuffle[0] = decodeURI(vars['roleJoueur1']);
		rolesShuffle[1] = decodeURI(vars['roleJoueur2']);
	}
	// Sinon, on mélange les rôles existants
	else {
		rolesShuffle = roles.slice();
		shuffle(rolesShuffle);
	}

	// Si le paquetJoueur est passé en paramètre, on le prend
	if(vars['paquetJoueur'].length >= 1) {
		paquetJoueur = decodeURI(vars['paquetJoueur']).split('*');
	}
	// Sinon, on le génère
	else {
		// Tableau temporaire d'évènements
		var evenementsHasard = evenements;

		// Mélange du tableau d'évènements
		shuffle(evenementsHasard);

		// Création du paquet joueur, avec que 5 évènements
		paquetJoueur = bleu.concat(jaune).concat(noir).concat(rouge).concat(evenementsHasard.slice(3));

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
		alert("Nombre de personnes ayant joué ce scénario (" + idUnique + ") : " +pseudos.length + "\n - " + joueurs.join("\n - "));
	}
	else {
		idUnique = Date.now();
		alert("Vous êtes le 1er à jouer ce scénario (" + idUnique + ").\n\"Bon chance !\"");
	}


	// On génère le lien de la partie
	lienSansPseudo = "game.html?" +
					(idUnique == 0 ? "" : "idUnique=" + idUnique) +
					"&roleJoueur1=" +  encodeURI(rolesShuffle[0]) +
					"&roleJoueur2=" +  encodeURI(rolesShuffle[1]) +
					"&paquetJoueur=" + encodeURI(paquetJoueur.join('*')) +
					"&paquetPropagationEntier=" + encodeURI(paquetPropagationEntier.join('*'));

	// Permet de tirer les 4 cartes pour les 2 joueurs
	miseEnPlaceJoueur('idJoueur1');
	miseEnPlaceJoueur('idJoueur2');

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
	// On affiche les idCarte au cas où elles étaients masquées
	document.getElementById('idCarte1').style.display = "block";
	document.getElementById('idCarte2').style.display = "block";

	document.getElementById('idCarteJoueurs').className = 'enCours carteJoueur';
	document.getElementById('idDivCartesPropagation').className = 'pasEnCours';

	var isIdCarte1 = idCarte == 'idCarte1';
	if (isIdCarte1) {
		isChronoDejaTourne = false;
		document.getElementById('idGoJoueur').className = "";
		document.getElementById('idCartesPropagation').innerHTML = "";
		isPseudoGagnePerduCeTour("J");
		document.getElementById('idCarte2').innerHTML = "...";
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
		alert("Désolé, il ne reste plus de carte... vous avez perdu !");
		document.getElementById('idTournePropagation').disabled = true;
		return;
	}

	// On prend la prochaine carte du paquet
	var carte = paquetJoueur.shift();
	// Si c'est une carte événement, on affiche sa description au survol
	var descEvt = descriptionsEvenement[carte];
	var htmlCarte = "<span class='carte-color' data-color='" + getCouleur(carte) + "'" +
		(descEvt ? ' title="' + descEvt + '"' : "") + ">" + carte + "</span>";
	document.getElementById(idCarte).innerHTML = htmlCarte;
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
		if (paquetJoueur.length == 1 && nbTours == 26 && nbTours == tab[1]) {
			alert("Le joueur " + tab[0] + " a perdu aussi par manque de carte dans le paquet joueur.");
		}

		// Cas général
		// Si on tire une carte Propagation, on regarde si quelqu'un a perdu
		if (typeCarte == "P" && tab[1] <= 25 ) {
			// Si la partie était perdue et qu'on a tournée le même nombre de cartes
			if (tab[2] == '0' && nbCartesPropagationTournees == tab[3]) {
				alert("Le joueur " + tab[0] + " a perdu sur cette prochaine carte propagation.");
				}
			}

		// Si on tire une carte Joueur, on regarde si un quelqu'un a gagné
		if (typeCarte == "J") {
			// Si la partie était gagnée et qu'on est on même nombre
			if (tab[2] == '1' && nbTours == tab[1]) {
				alert("Le joueur " + tab[0] + " a gagné au tour précédent.");
			}
		}
	});
}


/** Retourne le nombre de cubes à ajouter selon la position dans les 9 initiales */
function getNbCubesPourCarte(carteStr, indexGlobal) {
	if (carteStr.indexOf("Epidemie") >= 0) {
		return 0;
	}
	// Pour les 9 premières cartes (initial infection)
	if (indexGlobal < 9) {
		if (indexGlobal < 3) return 3;
		if (indexGlobal < 6) return 2;
		return 1;
	}
	// Pour toutes les cartes suivantes : 1 cube
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
			html += '<span class="propa-card-epidemic-name" title="' + descEpi + '">' + nomEpidemie + '</span>';
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

	document.getElementById('idCartesPropagation').style.display = "block";
	document.getElementById('idCarteJoueurs').className = 'pasEnCours';
	document.getElementById('idDivCartesPropagation').className = 'enCours cartePropagation';

	// On récupère 1ère carte du paquet propagation
	var carte = paquetPropagationEntier.shift();
	cartesPropagationTirees.push(carte);

	// Détection épidémie
	if (carte.indexOf("Epidemie") >= 0) {
		nbEpidemiesTombees++;
	}

	// Ajout au panneau visuel
	ajouterCarteAuPanel(carte);
	mettreAJourPanelPropagation();
	mettreAJourCartesATirer(carte);

	// On coupe la carte au '-' pour récupérer la 2° partie (qui ne contient que la ville)
	var ville = carte.split('-');

	document.getElementById('idCartesPropagation').innerHTML += ville[0] + "<span class='carte-color' data-color='" + getCouleur(ville[1].substring(1)) + "'>" + ville[1].substring(1) + "</span><br />";
	document.getElementById('idRecap').innerHTML += carte + "<br />";

	// Ici, on tire la X° carte sur X cartes à tirer du paquet propagation
	if (carte.charAt(0) == carte.charAt(2)) {
		var joueur = (paquetJoueur.length + 1) % 4 == 0 ? 1 : 2;
		document.getElementById('idTournePropagation').disabled = true;
		document.getElementById('idOneClick').disabled = true;
		document.getElementById('idOneClick').innerHTML = document.getElementById('idButtonCarte1').innerHTML;
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


/** Réaffiche le tour en cours */
function reAfficher() {
	document.getElementById('idButtonCarte1').disabled = true;
	document.getElementById('idCarte1').style.display = "block";
	document.getElementById('idCarte2').style.display = "block";
	document.getElementById('idCartesPropagation').style.display = "block";
	document.getElementById('idDivCartesPropagation').className = 'enCours cartePropagation';
}


/** Lorqu'on est en survol du chrono */
function nouveauTour() {
	if (document.getElementById('idGoJoueur').className == "goJoueur") {
		document.getElementById('idDivCartesPropagation').className = 'enCours';
		document.getElementById('idButtonCarte1').disabled = false;
		document.getElementById('idCarte1').style.display = "none";
		document.getElementById('idCarte2').style.display = "none";
		document.getElementById('idCartesPropagation').style.display = "none";
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
		alert("Vous devez saisir un pseudo");
		return;
	}

	// On vérifier qu'un bouton radio ait été coché
	if (document.getElementById('idGagne').checked) {
		gagnePerdue = 1;
		alert("Félicitations " + ps + " !");
	}
	if (document.getElementById('idPerdu').checked) {
		gagnePerdue = 0;
		alert("Dommage " + ps + "...");
	}

	// Si le joueur n'a pas cliqué sur Gagné ou Perdu
	if (gagnePerdue == -1) {
		alert("Vous devez cocher une case");
		return;
	}
	pseudos[pseudos.length] = ps + "." + nbTours + "." + gagnePerdue + "." + nbCartesPropagationTournees + "." + document.getElementById('idNbRemedes').value + "." + document.getElementById('idNbEclosions').value;
	
	// On affiche le tableau récapitulatif si d'autres jouerus ont déjà joués cette partie
	if (pseudos.length >=2) {
		historiquePartie();
		document.getElementById('idDebug').checked = true;
		debug();
	}
	genererLienPartie();
}


/** Génère le lien de la partie */
function genererLienPartie() {
	// Lien sans pseudo si aucun joueur n'a encore été enregistré
	var lien = pseudos.length > 0 ? lienSansPseudo + "&pseudos=" + pseudos.join('*') : lienSansPseudo;
	document.getElementById('idLienPartie').href = lien;
	navigator.clipboard.writeText(lien)
      .then(() => {
        alert("Lien copié !");
      })
      .catch(err => {
        console.error("Erreur lors de la copie : ", err);
      });
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

/** */
function nouvellePartie() {
	if(confirm("Voulez-vous démarrer une nouvelle partie ?")) {
		window.location.replace("../views/index.html");
	}
}

/** Permet de rendre visible quelques données de débugage */
function debug() {
	document.getElementById('idDivDebug').style.display = document.getElementById('idDebug').checked ? "block" : "none";
}


/** Rend actif le bouton oneClick */
function rendVisibleOneClick() {
	document.getElementById('idOneClick').disabled = false;
}


/** Bouton unique pour gagner du temps :) */
function oneClick() {
	if (document.getElementById('idButtonCarte2').style.display == "block") {
		tirerCartes('idCarte2');
		document.getElementById('idOneClick').innerHTML = document.getElementById('idTournePropagation').innerHTML;
	}
	else if (document.getElementById('idTournePropagation').disabled == false) {
		tournePropogation();
	}
	else if (document.getElementById('idGoJoueur').className == "goJoueur") {
		nouveauTour();
	}
	else if (document.getElementById('idButtonCarte1').style.display == "block") {
		tirerCartes('idCarte1');
		document.getElementById('idOneClick').innerHTML = document.getElementById('idButtonCarte2').innerHTML;
	}
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
	var label = "⏸ Attente";

	// Menu de pause ouvert → le bouton principal est inactif (on utilise le menu)
	if (document.getElementById('idMenuChrono').style.display == "block") {
		actif = false;
		label = "⏸ En pause";
	}
	// Chrono en cours → le bouton affiche le décompte et sert à mettre en pause
	else if (isTimerRunning()) {
		actif = true;
		label = "⏸ " + getTempsFormate();
	}
	// IMPORTANT : vérifier les états des boutons AVANT le statut goJoueur,
	// car goJoueur est remis à "" après la 1ère carte joueur.

	// Tirer la 2nde carte joueur (bouton 2 visible)
	else if (document.getElementById('idButtonCarte2').style.display == "block") {
		actif = true;
		label = "J" + joueurActif;
	}
	// Propagation (initiale OU d'un tour) : bouton propagation actif
	else if (!document.getElementById('idTournePropagation').disabled) {
		actif = true;
		label = "🦠 Propagation";
	}
	// Tirer la 1ère carte joueur (bouton 1 actif)
	else if (!document.getElementById('idButtonCarte1').disabled &&
			 document.getElementById('idButtonCarte1').style.display != "none") {
		actif = true;
		label = "J" + joueurActif;
	}
	// Nouveau tour à démarrer ("Tour : [Rôle]" affiché, rien à tirer)
	else if (document.getElementById('idGoJoueur').className == "goJoueur") {
		actif = true;
		label = "▶ Nouveau tour";
	}

	btn.disabled = !actif;
	btn.innerHTML = label;
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


/** Rempli le tableau de l'historique des joueurs de la partie */
function historiquePartie () {
	cacherAfficherCartes('idSpoilHistoJoueurs', 'idLienSpoilHistoJoueurs');
	var monTableau = "<center>Si une équipe perd <b>avant le 26° tour</b> : soit le nombre d'éclosions est à 8, soit il manquait des cubes.<table border='1'> "+
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
						"<td>" + tab[0] + "</td>"+
						"<td>" + (tab[2] == 0 ? "Perdu" : "Gagné") + "</td>"+
						"<td>" + tab[1] + "</td>"+
						"<td>" + tab[3] + "</td>"+
						"<td>" + tab[4] + "</td>"+
						"<td>" + tab[5] + "</td>"+
					"</tr>";
	});
	document.getElementById('idSpoilHistoJoueurs').innerHTML = monTableau + "</table></center>";
}
