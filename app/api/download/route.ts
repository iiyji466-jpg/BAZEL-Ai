import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "أدخل الرابط أولاً" }, { status: 400 });
    }

    // 1. تنظيف الرابط من أي حروف زائدة قد يضعها المستخدم بالخطأ
    const cleanUrl = url.trim().match(/https?:\/\/[^\s]+/g)?.[0] || url.trim();

    // 2. طلب الفيديو من محرك Cobalt المخصص لتجاوز الحظر
    const response = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        url: cleanUrl,
        vQuality: "720", 
        vCodec: "h264",
        isNoTTWatermark: true // إزالة علامة تيك توك المائية
      }),
    });

    const data = await response.json();

    // 3. التحقق من النتيجة
    if (data.status === "error" || !data.url) {
      console.error("خطأ من المحرك:", data.text);
      return NextResponse.json({ error: "هذا الرابط محمي أو غير مدعوم حالياً" }, { status: 400 });
    }

    // إرجاع رابط التحميل المباشر
    return NextResponse.json({ downloadUrl: data.url });

  } catch (error) {
    return NextResponse.json({ error: "فشل الاتصال بمحرك التحميل" }, { status: 500 });
  }
}
