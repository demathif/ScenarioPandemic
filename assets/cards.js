/** Définition des constantes de l'ensemble des cartes */
const bleu = ['Atlanta', 'New York', 'Washington', 'Montreal', 'San Francisco', 'Londres', 'Paris', 'Essen', 'Madrid', 'Milan', 'Chicago', 'Saint Petersbourg'];
const jaune = ['Los Angeles', 'Mexico', 'Miami', 'Bogota', 'Lima', 'Santiago', 'Buenos Aires', 'Sao Paulo', 'Lagos', 'Khartoum', 'Kinshasa', 'Johannesburg'];
const noir = ['Alger', 'Le Caire', 'Istanbul', 'Moscou', 'Téhéran', 'Bagdad', 'Riyad', 'Karachi', 'Delhi', 'Mumbai', 'Calcutta', 'Chennai'];
const rouge = ['Jakarta', 'Sydney', 'Manille', 'Ho Chi Minh Ville', 'Bangkok', 'Hong Kong', 'Taipei', 'Osaka', 'Tokyo', 'Shanghai', 'Pékin', 'Séoul'];
const evenements = ['Pont aérien', 'Subvention publique', 'Hôpital mobile', 'Rééxaminer les recherches', 'Traitements à distance', 'Ordres spéciaux', 'Temps emprunté', 'Déploiement de vaccins rapides'];
const epidemies = ['Pente fatale', 'Structure moléculaire complexe', 'Pertes inacceptables', 'Effet chronique', 'Ingérence gouvernementale', 'Populations non calculées'];

/** Description de chaque épidémie */
const descriptionsEpidemie = {
	'Pente fatale': '⚡ Effet Immédiat — Chaque éclosion (outbreak) de la Souche Virulente fait avancer le marqueur d\'éclosion de 2 cases sur la piste au lieu d\'une seule. Cet effet reste actif jusqu\'à ce qu\'une nouvelle carte Épidémie soit piochée.',
	'Pertes inacceptables': '⚡ Effet Immédiat — Retirez immédiatement 4 cubes de la Souche Virulente de la réserve générale et remettez-les dans la boîte de jeu. Ces cubes ne pourront plus être utilisés, ce qui accélère le risque de défaite par pénurie de cubes.',
	'Populations non calculées': '⚡ Effet Immédiat — Ajoutez immédiatement 1 cube de la Souche Virulente dans chaque ville du plateau qui en possède déjà au moins un. Cet effet peut facilement déclencher des éclosions en chaîne si plusieurs villes avaient déjà 3 cubes.',
	'Structure moléculaire complexe': '🔄 Effet Permanent — Découvrir le remède de la Souche Virulente nécessite désormais 6 cartes Joueur de sa couleur (au lieu de 5). Exception officielle : Le Scientifique ignore cette pénalité. Grâce à sa compétence spéciale, il n\'a toujours besoin que de 4 cartes pour trouver le remède.',
	'Effet chronique': '🔄 Effet Permanent — Lorsque vous devez ajouter un cube de la Souche Virulente dans une ville saine (qui n\'en contient actuellement aucun), vous devez obligatoirement y placer 2 cubes d\'un coup au lieu d\'un seul.',
	'Ingérence gouvernementale': '🔄 Effet Permanent — Tant que cette carte est active, un joueur qui commence ou entre dans une ville contenant au moins un cube de la Souche Virulente doit obligatoirement utiliser une action pour traiter la maladie (enlever un cube) avant de pouvoir effectuer une action de déplacement pour quitter cette ville. Cet effet est écrasé et remplacé dès qu\'une nouvelle carte Épidémie est piochée.',
};
const roles = ['Scientifique', 'Epidémiologiste', 'Opérateur de terrain', 'Spécialiste en quarantaine', 'Généraliste', 'Chercheuse', 'Archiviste', 'Spécialiste en confinement', 'Expert aux opérations', 'Planificateur d\'urgence', 'Médecin'];


/** Description de chaque rôle */
const descriptionsRole = {
	'Médecin': 'Le Médecin : Retire tous les cubes d\'une maladie en une action (et gratuitement si elle est guérie).',
	'Scientifique': 'La Scientifique : Trouve un remède avec seulement 4 cartes de la même couleur au lieu de 5.',
	'Répartiteur': 'Le Répartiteur : Déplace les pions des autres joueurs à leur place ou les regroupe.',
	'Chercheuse': 'La Chercheuse : Donne n\'importe quelle carte Ville de sa main à un joueur sur la même case.',
	'Expert aux opérations': 'L\'Expert aux Opérations : Construit une station de recherche sans carte et peut s\'envoler depuis celle-ci.',
	'Spécialiste en quarantaine': 'La Spécialiste en Mise en Quarantaine : Sécurise sa ville et toutes les villes reliées en bloquant les cubes et éclosions.',
	'Planificateur d\'urgence': 'Le Planificateur d\'Urgence : Récupère une carte Événement de la défausse pour la réutiliser.',
	'Epidémiologiste': 'L\'Épidémiologiste : Une fois par tour, peut prendre (pendant son tour) une carte Ville d\'un joueur situé dans la même ville, sans restriction de couleur.',
	'Archiviste': 'L\'Archiviste : Possède une taille de main maximale de 8 cartes (au lieu de 7) et peut récupérer une carte Ville correspondant à sa position actuelle depuis la défausse.',
	'Spécialiste en confinement': 'Le Spécialiste en Confinement : Dès qu\'il entre dans une ville contenant au moins 2 cubes de maladie, il retire immédiatement 1 cube automatiquement (sans dépenser d\'action).',
	'Opérateur de terrain': 'L\'Agent de Terrain : Une fois par tour, lorsqu\'il traite une maladie, il peut placer un cube retiré sur sa carte de rôle. Il peut ensuite découvrir un remède avec 3 cartes seulement s\'il possède 3 cubes de la couleur correspondante sur sa carte.',
	'Généraliste': 'Le Généraliste : Dispose de 5 actions par tour au lieu de 4.',
};

/** Couleur du pion pour chaque rôle (couleurs Pandemic classiques) */
const couleurPion = {
	'Scientifique': '#e74c3c',        // rouge
	'Epidémiologiste': '#8e44ad',     // violet
	'Opérateur de terrain': '#2ecc71', // vert
	'Spécialiste en quarantaine': '#f1c40f', // jaune
	'Généraliste': '#3498db',         // bleu
	'Chercheuse': '#e67e22',          // orange
	'Archiviste': '#1abc9c',          // turquoise
	'Spécialiste en confinement': '#9b59b6', // pourpre
	'Expert aux opérations': '#2c3e50', // noir
	'Planificateur d\'urgence': '#e84393', // rose
	'Médecin': '#00b894'              // vert menthe
};

/** Retourne un nombre aléatoire entre min et max */
function randomInt (min, max) {
	return (min + Math.floor ((max - min + 1) * Math.random ()));
}

/** Mélange le tableau passer en paramètre */
function shuffle (items) {
	var i, j;
	var item;
	if ((!items.length) || (items.length == 1))
		return;
	for (i = items.length - 1; i != 0; i --) {
		j = randomInt (0, i);
		item = items[j];
		items[j] = items[i];
		items[i] = item;
	}
}
