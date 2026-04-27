// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرجاء إدخال الرابط" }, { status: 400 });
    }

    const cleanUrl = url.trim();

    // استخراج ID الفيديو من رابط YouTube
    function extractYouTubeId(url: string): string | null {
      const patterns = [
        /(?:youtube\.com\/watch\?v=)([\w-]+)/,
        /(?:youtu\.be\/)([\w-]+)/,
        /(?:youtube\.com\/shorts\/)([\w-]+)/,
        /(?:youtube\.com\/embed\/)([\w-]+)/,
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }

    // معالجة يوتيوب
    if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be")) {
      const videoId = extractYouTubeId(cleanUrl);
      if (videoId) {
        // رابط مباشر من خوادم جوجل (جودة متوسطة) - قد تحتاج لتحديثه ليعمل
        const directUrl = `https://rr2---sn-4g5ednls.googlevideo.com/videoplayback?expire=${Math.floor(
          Date.now() / 1000
        ) + 86400}&id=${videoId}&source=youtube&requiressl=yes&mime=video/mp4&ratebypass=yes&dur=0&lmt=0&fexp=24007246&c=WEB&txp=5432432&sparams=expire,id,source,requiressl,mime,ratebypass,dur,lmt&sig=ASJCg9IwRAIgT`;

        // بديل عملي يعمل غالباً (خدمة invidious)
        const fallbackUrl = `https://inv.riverside.rocks/api/v1/videos/${videoId}`;

        return NextResponse.json({
          success: true,
          downloadUrl: fallbackUrl, // نستخدم الرابط البديل حالياً
          note: "قد يستغرق التحميل بضع ثوان",
        });
      }
    }

    // معالجة تيك توك
    if (cleanUrl.includes("tiktok.com")) {
      const tiktokRegex = /video\/(\d+)/;
      const match = cleanUrl.match(tiktokRegex);
      if (match) {
        const videoId = match[1];
        return NextResponse.json({
          success: true,
          downloadUrl: `https://tikcdn.io/ssstik/${videoId}`,
        });
      }
    }

    // معالجة إنستغرام
    if (cleanUrl.includes("instagram.com")) {
      const postId = cleanUrl.split("/p/")[1]?.split("/")[0];
      if (postId) {
        return NextResponse.json({
          success: true,
          downloadUrl: `https://instagram.com/p/${postId}?__a=1&__d=1`,
        });
      }
    }

    // حل احتياطي: إعادة التوجيه إلى موقع تحميل خارجي
    return NextResponse.json({
      success: true,
      downloadUrl: `https://snapsave.app/en?url=${encodeURIComponent(cleanUrl)}`,
      note: "سيتم فتح رابط التحميل في نافذة جديدة",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "خطأ في السيرفر ⚠️" }, { status: 500 });
  }
}