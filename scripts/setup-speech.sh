#!/bin/bash
# ============================================================
# Setup Piper TTS + Faster-Whisper STT (open-source)
# Pour Pharmacie v2.0 — Ubuntu/Debian
# ============================================================
set -e

echo "=== Installation des dépendances système ==="
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv espeak-ng ffmpeg

echo ""
echo "=== Création de l'environnement Python ==="
python3 -m venv .venv-speech
source .venv-speech/bin/activate

echo ""
echo "=== Installation de Piper TTS ==="
pip install piper-tts

echo ""
echo "=== Installation de Faster-Whisper (STT open-source) ==="
pip install faster-whisper

echo ""
echo "=== Téléchargement du modèle Piper français (siwis medium) ==="
mkdir -p models/piper
cd models/piper
python3 -c "
from huggingface_hub import hf_hub_download
import os
os.makedirs('fr/fr_FR/siwis/medium', exist_ok=True)
hf_hub_download('rhasspy/piper-voices', 'fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx', local_dir='.')
hf_hub_download('rhasspy/piper-voices', 'fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json', local_dir='.')
print('Modèle Piper téléchargé.')
"
cd ../..

echo ""
echo "=== Téléchargement du modèle Whisper small ==="
echo "Le modèle sera téléchargé automatiquement au premier lancement."
echo "Taille : ~500 Mo (modèle small, bonne précision en français)"

echo ""
echo "=== Création du fichier .env.local ==="
if [ ! -f .env.local ]; then
  cat > .env.local << 'EOF'
# --- Speech (open-source, local) ---
SPEECH_ENGINE=local
PIPER_MODEL=./models/piper/fr_FR-medium.onnx
WHISPER_MODEL=tiny
# Pour utiliser OpenAI au lieu du local, décommentez :
# SPEECH_ENGINE=openai
# OPENAI_API_KEY=sk-...
EOF
  echo "Fichier .env.local créé."
else
  echo ".env.local existe déjà, ignoré."
fi

echo ""
echo "=== Test Piper ==="
echo "Bonjour, ceci est un test." | .venv-speech/bin/piper \
  --model models/piper/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx \
  --output_file /tmp/test-piper.wav
if [ -f /tmp/test-piper.wav ]; then
  echo "✅ Piper fonctionne ! Fichier : /tmp/test-piper.wav"
  ls -lh /tmp/test-piper.wav
else
  echo "❌ Erreur Piper"
fi

echo ""
echo "=== Installation terminée !"
echo "   Piper TTS  : models/piper/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx"
echo "   Whisper STT: modèle small (auto-download au 1er lancement)"
echo "   Lancer : npm run dev"
