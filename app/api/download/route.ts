import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    let { url } = await req.json();

    // 1. تنظيف الرابط تلقائياً (إزالة المسافات أو أي نص زائد قبل أو بعد الرابط)
    if (url) {
      // هذا السطر يستخرج الرابط فقط حتى لو نسخ المستخدم نصاً معه
      const urlMatch = url.match(/\bhttps?:\/\/\S+/gi);
      url = urlMatch ? urlMatch[0] : url.trim();
    }

    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "الرجاء لصق رابط صحيح" }, { status: 400 });
    }

    // 2. الاتصال بالمحرك العالمي (يدعم يوتيوب المختصر، تيك توك، انستقرام)
    const response = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        url: url, 
        vQuality: "720",
        vCodec: "h264",
        isNoTTWatermark: true, // يزيل علامة تيك توك تلقائياً
      }),
    });

    const data = await response.json();

    // 3. إرسال الرابط النهائي للمستخدم
    if (data && data.url) {
      return NextResponse.json({
        downloadUrl: data.url,
        title: "تم تجهيز الفيديو بنجاح"
      });
    } else {
      return NextResponse.json({ error: "عذراً، هذا الرابط غير مدعوم حالياً" }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ error: "fetch failed ⚠️" }, { status: 500 });
  }
}
