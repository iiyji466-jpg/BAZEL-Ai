import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });
    }

    if (!process.env.RAPIDAPI_KEY) {
      return NextResponse.json({ error: "مفتاح API غير موجود" }, { status: 500 });
    }

    const response = await fetch(
      `https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=${encodeURIComponent(url)}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "social-media-video-downloader.p.rapidapi.com",
        },
      }
    );

    const data = await response.json();
    console.log("[تنزيل] رد API:", JSON.stringify(data));

    if (!data.success || !data.links || data.links.length === 0) {
      return NextResponse.json(
        { error: "تعذر تحميل الفيديو. جرب رابطاً آخر" },
        { status: 400 }
      );
    }

    const best =
      data.links.find((l: any) => l.quality === "hd") ||
      data.links.find((l: any) => l.quality === "sd") ||
      data.links[0];

    return NextResponse.json({ downloadUrl: best.link });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}