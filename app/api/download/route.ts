import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرجاء إدخال رابط صالح" }, { status: 400 });
    }

    // استخدام محرك Cobalt الشامل الذي يدعم (TikTok, Instagram, YouTube, Twitter)
    // هذا المحرك يغنيك عن عمل detectPlatform يدوياً
    const response = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        url: url,
        vQuality: "720",
      }),
    });

    const data = await response.json();

    if (data.url) {
      // إرجاع النتيجة بنفس الصيغة التي تتوقعها واجهتك
      return NextResponse.json({
        downloadUrl: data.url,
        title: "Video Downloaded",
        platform: "All-in-One"
      });
    } else {
      return NextResponse.json({ error: "تعذر جلب الفيديو من هذا الرابط" }, { status: 400 });
    }

  } catch (error) {
    console.error("Download Error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء الاتصال بالخادم" }, { status: 500 });
  }
}
