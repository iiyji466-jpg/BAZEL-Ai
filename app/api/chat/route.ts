import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, bot, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "الرسالة مطلوبة" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY غير موجود" },
        { status: 500 }
      );
    }

    const systemPrompts: Record<string, string> = {
      translator: `أنت مترجم وموسوعة ذكية. مهامك:
- الترجمة بين العربية والإنجليزية والفرنسية وأي لغة أخرى
- تقديم معلومات موسوعية دقيقة
- شرح المصطلحات والمفاهيم
كن دقيقاً وموجزاً وواضحاً.`,

      files: `أنت مساعد ذكي للإنتاجية وتحويل الملفات. مهامك:
- توجيه المستخدمين لتحويل صيغ الملفات المختلفة
- تقديم أكواد Python/JavaScript لمعالجة الملفات
- المساعدة في أتمتة المهام المكتبية`,

      groups: `أنت مساعد إدارة المجموعات. مهامك:
- تقديم قواعد وسياسات للمجموعات
- اقتراح رسائل تحذير وترحيب
- مساعدة في حل النزاعات`,

      media: `أنت صياد المقاطع الذكي. مهامك:
- إرشاد المستخدمين لأدوات تنزيل الفيديو والصوت
- تقديم أكواد yt-dlp وأدوات مشابهة
- شرح الفروق بين الصيغ (MP4, MKV, MP3, FLAC...)`,

      ai: `أنت مساعد ذكاء اصطناعي شامل. مهامك:
- الإجابة على أي سؤال في أي مجال
- تحليل النصوص والمشاكل المعقدة
- كتابة الأكواد البرمجية بأي لغة`,
    };

    const systemPrompt = systemPrompts[bot] || systemPrompts["ai"];

    const messages = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "فهمت. سأساعدك وفق مهامي المحددة." }] },
      ...(history?.map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })) || []),
      { role: "user", parts: [{ text: message }] },
    ];

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: messages }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error?.message || "خطأ من Gemini API");
    }

    const response = data.candidates?.[0]?.content?.parts?.[0]?.text || "لا يوجد رد";

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error?.message || "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
