import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });
    }

    // تحديد المنصة تلقائياً
    const platform = detectPlatform(url);

    // API الرئيسي - يدعم كل المنصات
    const response = await fetch(
      `https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=${encodeURIComponent(url)}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
          "x-rapidapi-host": "social-media-video-downloader.p.rapidapi.com",
        },
      }
    );

    const data = await response.json();

    if (data.success && data.links?.length > 0) {
      const best =
        data.links.find((l: any) => l.quality === "hd") ||
        data.links.find((l: any) => l.quality === "sd") ||
        data.links[0];

      return NextResponse.json({
        downloadUrl: best.link,
        title: data.title || "فيديو",
        platform,
        thumbnail: data.thumbnail || null,
      });
    }

    // API احتياطي - Instagram & TikTok
    if (platform === "instagram" || platform === "tiktok") {
      const fallback = await fetch(
        `https://instagram-tiktok-youtube-downloader.p.rapidapi.com/download?url=${encodeURIComponent(url)}`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
            "x-rapidapi-host":
              "instagram-tiktok-youtube-downloader.p.rapidapi.com",
          },
        }
      );

      const fallbackData = await fallback.json();

      if (fallbackData.url || fallbackData.video) {
        return NextResponse.json({
          downloadUrl: fallbackData.url || fallbackData.video,
          platform,
        });
      }
    }

    // API احتياطي - YouTube فقط
    if (platform === "youtube") {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        const ytFallback = await fetch(
          `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`,
          {
            method: "GET",
            headers: {
              "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
              "x-rapidapi-host": "youtube-mp36.p.rapidapi.com",
            },
          }
        );

        const ytData = await ytFallback.json();

        if (ytData.status === "ok" && ytData.link) {
          return NextResponse.json({
            downloadUrl: ytData.link,
            platform,
          });
        }
      }
    }

    return NextResponse.json(
      { error: "تعذر تنزيل الرابط، تأكد أن الرابط صحيح" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}

// تحديد المنصة من الرابط
function detectPlatform(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("facebook.com") || url.includes("fb.watch")) return "facebook";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  return "unknown";
}

// استخراج YouTube ID
function extractYouTubeId(url: string): string | null {
  if (url.includes("/shorts/")) return url.split("/shorts/")[1]?.split("?")[0];
  if (url.includes("watch?v=")) return url.split("watch?v=")[1]?.split("&")[0];
  if (url.includes("youtu.be/")) return url.split("youtu.be/")[1]?.split("?")[0];
  return null;
}