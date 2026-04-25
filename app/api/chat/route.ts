import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { message, bot, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "الرسالة مطلوبة" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY غير موجود في المتغيرات البيئية" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompts: Record<string, string> = {
      translator: `أنت مترجم وموسوعة ذكية. مهامك:
- الترجمة بين العربية والإنجليزية والفرنسية وأي لغة أخرى
- تقديم معلومات موسوعية دقيقة
- شرح المصطلحات والمفاهيم
- الإجابة باللغة التي يستخدمها المستخدم
كن دقيقاً وموجزاً وواضحاً.`,

      files: `أنت مساعد ذكي للإنتاجية وتحويل الملفات. مهامك:
- توجيه المستخدمين لتحويل صيغ الملفات المختلفة
- تقديم أكواد Python/JavaScript لمعالجة الملفات
- شرح طرق ضغط وتحسين الملفات
- المساعدة في أتمتة المهام المكتبية
قدم كوداً قابلاً للتنفيذ عند الطلب.`,

      groups: `أنت مساعد إدارة المجموعات والمجتمعات. مهامك:
- تقديم قواعد وسياسات للمجموعات
- اقتراح رسائل تحذير وترحيب
- مساعدة في حل النزاعات
- تصميم هيكل إداري للمجموعات
- اقتراح محتوى ونشاطات للمجموعة
كن عملياً ومنظماً.`,

      media: `أنت صياد المقاطع الذكي. مهامك:
- إرشاد المستخدمين لأدوات تنزيل الفيديو والصوت
- شرح صيغ الوسائط المختلفة وجودتها
- تقديم أكواد yt-dlp وأدوات مشابهة
- المساعدة في معالجة وتحرير الوسائط
- شرح الفروق بين الصيغ (MP4, MKV, MP3, FLAC...)
قدم تعليمات تقنية دقيقة.`,

      ai: `أنت مساعد ذكاء اصطناعي شامل مبني على Gemini. مهامك:
- الإجابة على أي سؤال في أي مجال
- تحليل النصوص والمشاكل المعقدة
- كتابة الأكواد البرمجية بأي لغة
- إبداع المحتوى الأدبي والتسويقي
- التفكير النقدي وحل المشكلات
كن ذكياً وشاملاً ومفيداً قدر الإمكان.`,
    };

    const systemPrompt = systemPrompts[bot] || systemPrompts["ai"];

    const chatHistory =
      history?.map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })) || [];

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "فهمت. سأساعدك وفق مهامي المحددة." }],
        },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    if (error?.message?.includes("API_KEY_INVALID")) {
      return NextResponse.json(
        { error: "مفتاح API غير صالح. تحقق من GEMINI_API_KEY" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}