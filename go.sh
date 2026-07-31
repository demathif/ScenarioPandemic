#!/bin/bash
# ============================================
# go.sh — Lancement du serveur local + Chrome
# Pour tester Scénario Pandemic en local
# Ctrl+C arrête le serveur ET ferme Chrome
# ============================================

PORT=8080
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHROME_PID=""
CHROME_PROFILE=""

echo "==================================="
echo " Scénario Pandemic — Serveur Local"
echo "==================================="
echo " Projet : $PROJECT_DIR"
echo " Port   : $PORT"
echo ""
echo " Accès : http://localhost:$PORT/views/"
echo " (Ctrl+C pour arrêter et fermer Chrome)"
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

# Fonction de nettoyage : ferme Chrome et supprime le profil temporaire
cleanup() {
    echo ""
    echo " Arrêt du serveur : fermeture de Chrome..."
    if [ -n "$CHROME_PID" ] && kill -0 "$CHROME_PID" 2>/dev/null; then
        # Ferme la fenêtre Chrome (instance isolée)
        kill "$CHROME_PID" 2>/dev/null
        # Attend un court instant puis force si nécessaire
        sleep 1
        kill -9 "$CHROME_PID" 2>/dev/null
    fi
    if [ -n "$CHROME_PROFILE" ] && [ -d "$CHROME_PROFILE" ]; then
        rm -rf "$CHROME_PROFILE" 2>/dev/null
    fi
    echo " ✔ Fermé."
    exit 0
}

# Au Ctrl+C (SIGINT) ou kill (SIGTERM) : on ferme Chrome puis on sort
trap cleanup INT TERM

# Lancement du serveur HTTP Python (léger, avec en-têtes anti-cache)
echo " Démarrage du serveur HTTP..."
echo ""

# Ouvrir Chrome si trouvé (profil temporaire isolé pour pouvoir le fermer)
if [ -n "$CHROME" ]; then
    CHROME_PROFILE="$(mktemp -d)"
    # --new-window : nouvelle fenêtre
    # --user-data-dir : instance isolée (facilite la fermeture)
    "$CHROME" --new-window --user-data-dir="$CHROME_PROFILE" "http://localhost:$PORT/views/" >/dev/null 2>&1 &
    CHROME_PID=$!
fi

# Lancer le serveur Python avec en-têtes anti-cache (désactive le cache navigateur)
cd "$PROJECT_DIR"
python3 -c "
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
print('Serveur anti-cache sur le port', port)
ThreadingHTTPServer(('', port), NoCacheHandler).serve_forever()
" $PORT

# Si le serveur s'arrête d'une autre manière, on ferme quand même Chrome
cleanup
