#!/bin/bash
# ============================================
# go.sh — Lancement du serveur local + Chrome
# Pour tester Scénario Pandemic en local
# ============================================

PORT=8080
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==================================="
echo " Scénario Pandemic — Serveur Local"
echo "==================================="
echo " Projet : $PROJECT_DIR"
echo " Port   : $PORT"
echo ""
echo " Accès : http://localhost:$PORT/views/"
echo ""

# Détection du navigateur Chrome/Chromium
CHROME=""
if command -v google-chrome &>/dev/null; then
    CHROME="google-chrome"
elif command -v google-chrome-stable &>/dev/null; then
    CHROME="google-chrome-stable"
elif command -v chromium-browser &>/dev/null; then
    CHROME="chromium-browser"
elif command -v chromium &>/dev/null; then
    CHROME="chromium"
else
    echo "⚠️  Chrome/Chromium non trouvé."
    echo "   Installez-le ou ouvrez http://localhost:$PORT/views/ manuellement."
fi

# Lancement du serveur HTTP Python (léger, sans cache)
echo " Démarrage du serveur HTTP..."
echo " (Ctrl+C pour arrêter)"
echo ""

# Ouvrir Chrome si trouvé
if [ -n "$CHROME" ]; then
    # --new-window : nouvelle fenêtre
    # --incognito : évite le cache navigateur
    "$CHROME" --new-window "http://localhost:$PORT/views/" 2>/dev/null &
fi

# Lancer le serveur Python dans le répertoire du projet
cd "$PROJECT_DIR"
python3 -m http.server $PORT
