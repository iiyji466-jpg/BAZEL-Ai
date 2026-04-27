import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });

    const key = process.env.RAPIDAPI_KEY;
    if (!key) return NextResponse.json({ error: "مفتاح API غير موجود" }, { status: 500 });

    // TikTok (مجاني)
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

    // باقي المنصات عبر RapidAPI
    const apiUrl = `https://media-downloader.p.rapidapi.com/api/download?url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "media-downloader.p.rapidapi.com",
      },
    });

    const data = await res.json();
    console.log("RapidAPI response:", JSON.stringify(data));

    let videoUrl: string | null = null;

    // محاولة استخراج الرابط من أي شكل ممكن
    if (typeof data === "string" && (data.includes(".mp4") || data.startsWith("http"))) {
      videoUrl = data;
    } else if (data?.url && (data.url.includes(".mp4") || data.url.includes("video"))) {
      videoUrl = data.url;
    } else if (data?.video_url) {
      videoUrl = data.video_url;
    } else if (data?.download_url) {
      videoUrl = data.download_url;
    } else if (data?.data?.medias) {
      const media = data.data.medias.find((m: any) => m.type === "video");
      videoUrl = media?.url;
    } else if (data?.medias) {
      const media = data.medias.find((m: any) => m.type === "video");
      videoUrl = media?.url;
    } else if (data?.links?.[0]?.url) {
      videoUrl = data.links[0].url;
    }

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