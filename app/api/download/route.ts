import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });
    }

    // استخدام y2mate API
    const formData = new URLSearchParams();
    formData.append("url", url);
    formData.append("q_auto", "1");
    formData.append("ajax", "1");

    const res = await fetch("https://www.y2mate.com/mates/analyzeV2/ajax", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
        "Referer": "https://www.y2mate.com/",
        "Origin": "https://www.y2mate.com",
      },
      body: formData.toString(),
    });

    const text = await res.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "تعذر قراءة رد الخادم" },
        { status: 400 }
      );
    }

    if (!data || data.status !== "ok") {
      return NextResponse.json(
        { error: "تعذر تنزيل الرابط. جرب رابطاً آخر" },
        { status: 400 }
      );
    }

    // الحصول على أفضل رابط
    const links = data.links?.mp4 || data.links?.mp3 || {};
    const qualities = Object.values(links) as any[];
    
    if (qualities.length === 0) {
      return NextResponse.json(
        { error: "لا توجد روابط متاحة" },
        { status: 400 }
      );
    }

    const best = qualities.find(q => q.q === "720p") || 
                 qualities.find(q => q.q === "480p") || 
                 qualities[0];

    // الحصول على الرابط المباشر
    const convertForm = new URLSearchParams();
    convertForm.append("vid", data.vid);
    convertForm.append("k", best.k);

    const convertRes = await fetch("https://www.y2mate.com/mates/convertV2/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.y2mate.com/",
      },
      body: convertForm.toString(),
    });

    const convertData = await convertRes.json();

    if (!convertData.dlink) {
      return NextResponse.json(
        { error: "تعذر إنشاء رابط التنزيل" },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      downloadUrl: convertData.dlink,
      title: data.title || "فيديو"
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}