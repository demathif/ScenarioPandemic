#!/bin/bash
# ============================================
# go.sh — Serveur local (sans cache) pour tester le jeu
# Ouvre ensuite http://localhost:8080/views/ dans votre navigateur
# Ctrl+C pour arrêter
# ============================================

PORT=8080
cd "$(dirname "$0")"

echo "==================================="
echo " Scénario Pandemic — Serveur Local"
echo " Accès : http://localhost:$PORT/views/"
echo " (Ctrl+C pour arrêter)"
echo "==================================="

# Serveur HTTP anti-cache (les fichiers sont toujours rechargés à jour)
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
