import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile)
      return NextResponse.json({ error: "الملف الصوتي مطلوب" }, { status: 400 });

    if (!process.env.GROQ_API_KEY)
      return NextResponse.json({ error: "GROQ_API_KEY غير موجود" }, { status: 500 });

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3-turbo",
      language: "ar",
      response_format: "json",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error: any) {
    console.error("Whisper Error:", error);
    return NextResponse.json({ error: error?.message || "فشل تحويل الصوت إلى نص" }, { status: 500 });
  }
}
