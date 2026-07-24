import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const PROJECT_ROOT = resolve(process.cwd());
const PYTHON_BIN = process.env.PYTHON_BIN || join(PROJECT_ROOT, ".venv-speech/bin/python3");
const WHISPER_MODEL = process.env.WHISPER_MODEL || "small";

const TRANSCRIBE_SCRIPT = `
import sys, json, os
try:
    from faster_whisper import WhisperModel
    audio_file = sys.argv[1]
    lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
    model_size = sys.argv[3] if len(sys.argv) > 3 else "small"
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    segments, info = model.transcribe(audio_file, language=lang, beam_size=5)
    text = " ".join(s.text.strip() for s in segments)
    print(json.dumps({"text": text, "language": info.language}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
`;

export async function POST(req: NextRequest) {
  const tmpFiles: string[] = [];

  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const lang = (formData.get("lang") as string) || "fr";

    if (!audio) {
      return NextResponse.json({ error: "Aucun audio fourni" }, { status: 400 });
    }

    const tmpId = `stt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tmpAudio = join(tmpdir(), `${tmpId}.webm`);
    const tmpScript = join(tmpdir(), `${tmpId}.py`);
    tmpFiles.push(tmpAudio, tmpScript);

    const arrayBuffer = await audio.arrayBuffer();
    await writeFile(tmpAudio, Buffer.from(arrayBuffer));
    await writeFile(tmpScript, TRANSCRIBE_SCRIPT);

    const cmd = `"${PYTHON_BIN}" "${tmpScript}" "${tmpAudio}" "${lang}" "${WHISPER_MODEL}"`;
    const result = await execAsync(cmd, {
      timeout: 120_000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const output = JSON.parse(result.stdout.trim());
    if (output.error) {
      console.error("Whisper error:", output.error);
      return NextResponse.json({ error: output.error }, { status: 500 });
    }
    return NextResponse.json({ text: output.text, language: output.language });
  } catch (err) {
    console.error("STT error:", err);
    return NextResponse.json(
      { error: "Erreur de transcription." },
      { status: 500 }
    );
  } finally {
    for (const f of tmpFiles) {
      await unlink(f).catch(() => {});
    }
  }
}
