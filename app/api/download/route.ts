import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرجاء إدخال الرابط" }, { status: 400 });
    }

    const cleanUrl = url.trim();

    // سنستخدم هنا API مجاني تماماً لا يطلب مفتاح (Key)
    // هذا المحرك يدعم تيك توك، إنستغرام، وفيسبوك
    const apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(cleanUrl)}`;

    const response = await fetch(apiUrl, {
      method: "GET", // هذا الـ API يستخدم GET للسهولة
      headers: {
        "Accept": "application/json"
      }
    });

    const data = await response.json();

    // التحقق من استجابة المحرك المجاني
    if (data && data.video) {
      return NextResponse.json({ 
        success: true,
        downloadUrl: data.video.noWatermark || data.video.url, // جلب الفيديو بدون علامة مائية
        title: data.title || "Video",
        thumbnail: data.video.cover
      });
    } else if (data && data.url) { 
        // استجابة احتياطية لبعض المحركات الأخرى
        return NextResponse.json({ success: true, downloadUrl: data.url });
    } else {
      return NextResponse.json({ error: "تعذر استخراج الرابط، جرب رابطاً آخر" }, { status: 400 });
    }

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "خطأ في السيرفر ⚠️" }, { status: 500 });
  }
}
