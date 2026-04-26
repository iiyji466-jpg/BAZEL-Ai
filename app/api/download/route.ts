import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });

    const key = process.env.RAPIDAPI_KEY;
    if (!key) return NextResponse.json({ error: "مفتاح API غير موجود" }, { status: 500 });

    const isTikTok = url.includes("tiktok.com");
    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    const isInstagram = url.includes("instagram.com");

    // TikTok
    if (isTikTok) {
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

    // YouTube
    if (isYoutube) {
      const videoId = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
      if (!videoId) throw new Error("رابط YouTube غير صحيح");
      const res = await fetch(`https://yt-api.p.rapidapi.com/dl?id=${videoId}`, {
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": "yt-api.p.rapidapi.com",
        },
      });
      const data = await res.json();
      const formats = (data.formats || []).filter((f: any) => f.mimeType?.includes("video/mp4") && f.url);
      if (formats.length > 0) {
        const best = formats.find((f: any) => f.qualityLabel === "720p") || formats[0];
        return NextResponse.json({ downloadUrl: best.url });
      }
      throw new Error("تعذر تنزيل YouTube");
    }

    // Instagram
    if (isInstagram) {
      const res = await fetch(
        `https://instagram-scraper-api2.p.rapidapi.com/v1/post_info?code_or_id_or_url=${encodeURIComponent(url)}`,
        {
          headers: {
            "x-rapidapi-key": key,
            "x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com",
          },
        }
      );
      const data = await res.json();
      const videoUrl = data?.data?.video_url || data?.data?.items?.[0]?.video_url;
      if (videoUrl) {
        return NextResponse.json({ downloadUrl: videoUrl });
      }
      throw new Error("تعذر تنزيل Instagram");
    }

    // Twitter/Facebook
    const res = await fetch(
      `https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=${encodeURIComponent(url)}`,
      {
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": "social-media-video-downloader.p.rapidapi.com",
        },
      }
    );
    const data = await res.json();
    if (data.success && data.links?.length > 0) {
      const best = data.links.find((l: any) => l.quality === "hd") || data.links[0];
      return NextResponse.json({ downloadUrl: best.link });
    }

    throw new Error("تعذر تنزيل الرابط");

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "حدث خطأ" }, { status: 500 });
  }
}