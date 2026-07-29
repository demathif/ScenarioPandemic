/** Fonction principale, affiche les personnages en grille de cartes modernes */
function run () {
	var myForm = document.getElementById("idBoxes");
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
	myForm.appendChild(grid);
}

/** onclick, on recupere les roles du form sinon on les choisit aléatoirement */
function get_roles (form) {
	var count = 0;
	var choice = [];
	var limit = 2; // FIXME: what if more that 2 players
	var random_roles = "";

	var checkboxes = form.querySelectorAll('input[type="checkbox"]');
	for (var i = 0; i < checkboxes.length; i++) {
		if (checkboxes[i].checked) {
			if (count < limit) {
				choice[count] = checkboxes[i].value;
				count++;
			} else if (count >= limit) {
				alert("Vous ne pouvez pas choisir plus de " + limit + " personnages");
				return;
			}
		}
	}
	if (count != limit) { // some roles would be random
		// Get a copy and remove the choosen roles if any
		var roles_copy = roles.slice();
		for (var k = 0; k < limit; k++) {
			roles_copy = roles_copy.filter(function(e) { return e !== choice[k]; });
		}
		shuffle(roles_copy);
		for (var j = 0; j < limit - count; j++) {
			choice[limit - j - 1] = roles_copy[j];
			random_roles += choice[limit - j - 1] + " ";
		}
	}
	if (random_roles) {
		alert("Les roles suivants ont été choisis aléatoirement:\n" + random_roles);
	}

	shuffle(choice);
	window.location.replace("../views/game.html?" +
					"&roleJoueur1=" +  encodeURI(choice[0]) +
					"&roleJoueur2=" +  encodeURI(choice[1]));
}
