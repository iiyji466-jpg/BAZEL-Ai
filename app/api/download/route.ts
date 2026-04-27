import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });

    const key = process.env.RAPIDAPI_KEY;
    if (!key) return NextResponse.json({ error: "مفتاح API غير موجود" }, { status: 500 });

    // TikTok مجاني 100%
    if (url.includes("tiktok.com")) {
      const res = await fetch("https://tikwm.com/api/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `url=${encodeURIComponent(url)}&hd=1`,
      });
      const data = await res.json();
      if (data.code === 0 && data.data?.play) {
        return NextResponse.json({ downloadUrl: data.data.hdplay || data.data.play });
      }
      throw new Error("تعذر تنزيل TikTok");
    }

    // كل المنصات - Instagram, YouTube, Twitter, Facebook, Pinterest...
    const res = await fetch(
      `https://media-downloader.p.rapidapi.com/api/download?url=${encodeURIComponent(url)}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": "media-downloader.p.rapidapi.com",
        },
      }
    );

    const data = await res.json();
    console.log("Media Downloader response:", JSON.stringify(data));

    // محاولة استخراج الرابط من أي شكل للرد
    const videoUrl =
      data?.url ||
      data?.video_url ||
      data?.download_url ||
      data?.data?.url ||
      data?.data?.video_url ||
      data?.medias?.[0]?.url ||
      data?.links?.[0]?.url ||
      data?.result?.url;

    if (videoUrl) {
      return NextResponse.json({ downloadUrl: videoUrl });
    }

    throw new Error("تعذر تنزيل الرابط. تأكد أن الفيديو عام");

  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "حدث خطأ" },
      { status: 500 }
    );
  }
}