import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const PYTHON_BIN = process.env.PYTHON_BIN || "./.venv-speech/bin/python3";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const lang = (formData.get("lang") as string) || "fr";

    if (!audio) {
      return NextResponse.json({ error: "Aucun audio fourni" }, { status: 400 });
    }

    const tmpId = `stt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tmpFile = join(tmpdir(), `${tmpId}.webm`);

    try {
      const arrayBuffer = await audio.arrayBuffer();
      await writeFile(tmpFile, Buffer.from(arrayBuffer));

      const whisperModel = process.env.WHISPER_MODEL || "tiny";

      const pythonScript = `
import sys, json
try:
    from faster_whisper import WhisperModel
    model = WhisperModel("${whisperModel}", device="cpu", compute_type="int8")
    segments, info = model.transcribe("${tmpFile.replace(/\\/g, "\\\\")}", language="${lang}", beam_size=1)
    text = " ".join(s.text.strip() for s in segments)
    print(json.dumps({"text": text, "language": info.language}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
`;

      const result = await execAsync(
        `${PYTHON_BIN} -c ${JSON.stringify(pythonScript)}`,
        { timeout: 120_000, maxBuffer: 10 * 1024 * 1024 }
      );

      const output = JSON.parse(result.stdout.trim());
      if (output.error) {
        return NextResponse.json({ error: output.error }, { status: 500 });
      }
      return NextResponse.json({ text: output.text, language: output.language });
    } finally {
      await unlink(tmpFile).catch(() => {});
    }
  } catch (err) {
    console.error("STT error:", err);
    return NextResponse.json(
      { error: "Erreur de transcription. Vérifiez que Faster-Whisper est installé (scripts/setup-speech.sh)" },
      { status: 500 }
    );
  }
}
