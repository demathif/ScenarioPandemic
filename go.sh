#!/bin/bash
# ============================================
# go.sh — Serveur local (sans cache) pour tester le jeu
#
# Usage :
#   ./go.sh             → lance le serveur sur le 1er port libre (8080 par défaut)
#   ./go.sh 9090        → force le port 9090
#   ./go.sh --stop      → arrête l'instance en cours sur le port 8080
#   ./go.sh --stop 9090 → arrête l'instance en cours sur le port 9090
#
# Accès : http://localhost:8080/views/
# Ctrl+C pour arrêter
# ============================================

# --- Option --stop : arrête l'instance qui écoute sur le port donné ---
if [ "$1" = "--stop" ]; then
	TARGET="${2:-8080}"
	PID=$(ss -tlnp 2>/dev/null | grep ":$TARGET " | grep -oP 'pid=\K[0-9]+' | head -n1)
	if [ -n "$PID" ]; then
		kill "$PID" && echo "Instance sur le port $TARGET arrêtée (pid $PID)."
	else
		echo "Aucune instance détectée sur le port $TARGET."
	fi
	exit 0
fi

PORT="${1:-8080}"
cd "$(dirname "$0")"

# --- Recherche du 1er port libre (évite "Address already in use") ---
free_port="$PORT"
while ss -tln 2>/dev/null | grep -q ":$free_port "; do
	free_port=$((free_port + 1))
done

if [ "$free_port" != "$PORT" ]; then
	echo "⚠️  Port $PORT déjà occupé → utilisation du port $free_port"
	echo "   (pour libérer $PORT : ./go.sh --stop $PORT)"
fi

echo "==================================="
echo " Scénario Pandemic — Serveur Local"
echo " Accès : http://localhost:$free_port/views/"
echo " (Ctrl+C pour arrêter)"
echo "==================================="

# Serveur HTTP anti-cache (les fichiers sont toujours rechargés à jour)
python3 - "$free_port" <<'PY'
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

port = int(sys.argv[1])
print('Serveur anti-cache sur le port', port)
ThreadingHTTPServer(('', port), NoCacheHandler).serve_forever()
PY
