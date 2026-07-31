/**
@author : ChatGPT
Remarque : merci !
*/

let timerDuration = 120; // durée par défaut (2 min)
let remainingTime = timerDuration;
let timerInterval = null;

// Retourne le temps restant formaté "MM:SS"
function getTempsFormate() {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  return String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0');
}

// Mettre à jour l'affichage du temps
function updateDisplay() {
  const txt = getTempsFormate();
  document.getElementById("timer").textContent = txt;
  // Affiche aussi le décompte dans le bouton unique quand le chrono tourne
  const btn = document.getElementById('idBoutonUnique');
  if (btn && isTimerRunning()) {
    btn.innerHTML = "⏸ " + txt;
  }
}

// Fonction commune de compte à rebours
function runTimer() {
  timerInterval = setInterval(() => {
    if (remainingTime > 0) {
      remainingTime--;
      updateDisplay();
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      document.getElementById("beep").play();
    }
  }, 1000);
}

// Démarrer le minuteur (depuis le temps initial choisi)
function startTimer() {
  resetTimer(); // toujours repartir de la valeur initiale
  runTimer();
}

// Démarrer le minuteur avec une durée précise (secondes)
function startTimerDuree(seconds) {
  pauseTimer();
  timerDuration = seconds;
  remainingTime = seconds;
  // Synchronise la radio correspondante si elle existe
  document.querySelectorAll('input[name="duration"]').forEach(radio => {
    radio.checked = (parseInt(radio.value, 10) === seconds);
  });
  updateDisplay();
  runTimer();
}

// Indique si le minuteur est en cours de décompte
function isTimerRunning() {
  return timerInterval != null;
}

// Arrête le minuteur et met le temps restant à 0
function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  remainingTime = 0;
  updateDisplay();
}

// Pause
function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

// Reprendre
function resumeTimer() {
  if (!timerInterval && remainingTime > 0) {
    runTimer();
  }
}

// Réinitialiser
function resetTimer() {
  pauseTimer();
  const radios = document.querySelectorAll('input[name="duration"]');
  radios.forEach(radio => {
    if (radio.checked) {
      timerDuration = parseInt(radio.value);
    }
  });
  remainingTime = timerDuration;
  updateDisplay();
}

// Quand on change de durée (radio)
document.querySelectorAll('input[name="duration"]').forEach(radio => {
  radio.addEventListener('change', resetTimer);
});

// Initialisation
resetTimer();
