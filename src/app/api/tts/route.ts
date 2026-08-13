import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { readFile, writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const PROJECT_ROOT = resolve(process.cwd());
const PIPER_BIN = process.env.PIPER_BIN || join(PROJECT_ROOT, ".venv-speech/bin/piper");
const PIPER_MODEL = process.env.PIPER_MODEL || join(PROJECT_ROOT, "models/piper/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx");

export async function POST(req: NextRequest) {
  const tmpFiles: string[] = [];

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Texte requis" }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json({ error: "Texte trop long (max 5000 caractères)" }, { status: 400 });
    }

    const tmpId = `tts-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tmpText = join(tmpdir(), `${tmpId}.txt`);
    const tmpWav = join(tmpdir(), `${tmpId}.wav`);
    const tmpMp3 = join(tmpdir(), `${tmpId}.mp3`);
    tmpFiles.push(tmpText, tmpWav, tmpMp3);

    // Write the text to a temp file and pass it to piper by path. execFile
    // (not exec) avoids any shell interpretation; the user-controlled `text`
    // only ever exists as file contents, never as part of the command line.
    await writeFile(tmpText, text, "utf-8");

    await execFileAsync(
      PIPER_BIN,
      ["--model", PIPER_MODEL, "--output_file", tmpWav, "--input-file", tmpText],
      { timeout: 30_000, maxBuffer: 10 * 1024 * 1024 }
    );

    // Try WAV → MP3 via ffmpeg (also no shell).
    try {
      await execFileAsync(
        "ffmpeg",
        ["-y", "-i", tmpWav, "-codec:a", "libmp3lame", "-q:a", "4", tmpMp3],
        { timeout: 15_000 }
      );
      const audio = await readFile(tmpMp3);
      return new NextResponse(audio, {
        headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" },
      });
    } catch {
      // ffmpeg absent → servir le WAV directement
      const audio = await readFile(tmpWav);
      return new NextResponse(audio, {
        headers: { "Content-Type": "audio/wav", "Cache-Control": "public, max-age=3600" },
      });
    }
  } catch (err) {
    console.error("Piper TTS error:", err);
    return NextResponse.json(
      { error: "Erreur de synthèse vocale." },
      { status: 500 }
    );
  } finally {
    for (const f of tmpFiles) {
      await unlink(f).catch(() => {});
    }
  }
}
