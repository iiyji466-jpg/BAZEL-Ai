import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message, bot, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "الرسالة مطلوبة" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY غير موجود في المتغيرات البيئية" },
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
- المساعدة في أتمتة المهام المكتبية
قدم كوداً قابلاً للتنفيذ عند الطلب.`,

      groups: `أنت مساعد إدارة المجموعات والمجتمعات. مهامك:
- تقديم قواعد وسياسات للمجموعات
- اقتراح رسائل تحذير وترحيب
- مساعدة في حل النزاعات
كن عملياً ومنظماً.`,

      media: `أنت صياد المقاطع الذكي. مهامك:
- إرشاد المستخدمين لأدوات تنزيل الفيديو والصوت
- تقديم أكواد yt-dlp وأدوات مشابهة
- شرح الفروق بين الصيغ (MP4, MKV, MP3, FLAC...)
قدم تعليمات تقنية دقيقة.`,

      ai: `أنت مساعد ذكاء اصطناعي شامل. مهامك:
- الإجابة على أي سؤال في أي مجال
- تحليل النصوص والمشاكل المعقدة
- كتابة الأكواد البرمجية بأي لغة
كن ذكياً وشاملاً ومفيداً.`,
    };

    const systemPrompt = systemPrompts[bot] || systemPrompts["ai"];

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...(history?.map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })) || []),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || "لا يوجد رد";

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("OpenAI API Error:", error);

    if (error?.status === 401) {
      return NextResponse.json(
        { error: "مفتاح API غير صالح" },
        { status: 401 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: "تجاوزت الحد المسموح — حاول لاحقاً" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
