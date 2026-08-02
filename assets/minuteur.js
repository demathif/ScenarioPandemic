/**
@author : ChatGPT
Remarque : merci !
*/

let remainingTime = 120; // durée par défaut (2 min)
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
      // Garde-fou : l'élément audio peut être absent ou le son bloqué par le navigateur
      const beepEl = document.getElementById("beep");
      if (beepEl && typeof beepEl.play === "function") {
        try {
          const p = beepEl.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } catch (e) { /* audio bloqué */ }
      }
    }
  }, 1000);
}

// Démarrer le minuteur avec une durée précise (secondes)
function startTimerDuree(seconds) {
  pauseTimer();
  remainingTime = seconds;
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
