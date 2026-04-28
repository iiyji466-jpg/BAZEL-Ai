import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "الوصف مطلوب" }, { status: 400 });

    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&enhance=true`;

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "حدث خطأ" }, { status: 500 });
  }
}
