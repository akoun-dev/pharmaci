import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

const PIPER_BIN = process.env.PIPER_BIN || "./.venv-speech/bin/piper";
const PIPER_MODEL = process.env.PIPER_MODEL || "./models/piper/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx";

export async function POST(req: NextRequest) {
  try {
    const { text, lang = "fr" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Texte requis" }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json({ error: "Texte trop long (max 5000 caractères)" }, { status: 400 });
    }

    const tmpId = `tts-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tmpWav = join(tmpdir(), `${tmpId}.wav`);
    const tmpMp3 = join(tmpdir(), `${tmpId}.mp3`);

    try {
      // Piper TTS → WAV (via stdin pipe)
      await execAsync(
        `echo ${JSON.stringify(text)} | ${PIPER_BIN} --model ${PIPER_MODEL} --output_file ${tmpWav}`,
        { timeout: 30_000, maxBuffer: 10 * 1024 * 1024 }
      );

      // Convertir WAV → MP3 via ffmpeg (plus léger pour le client)
      try {
        await execAsync(
          `ffmpeg -y -i ${tmpWav} -codec:a libmp3lame -q:a 4 ${tmpMp3}`,
          { timeout: 15_000 }
        );

        const audio = await readFile(tmpMp3);
        return new NextResponse(audio, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=3600",
          },
        });
      } catch {
        // ffmpeg absent → servir le WAV directement
        const audio = await readFile(tmpWav);
        return new NextResponse(audio, {
          headers: {
            "Content-Type": "audio/wav",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    } finally {
      // Nettoyage
      await unlink(tmpWav).catch(() => {});
      await unlink(tmpMp3).catch(() => {});
    }
  } catch (err) {
    console.error("Piper TTS error:", err);
    return NextResponse.json(
      { error: "Erreur de synthèse vocale. Vérifiez que Piper est installé (scripts/setup-speech.sh)" },
      { status: 500 }
    );
  }
}
