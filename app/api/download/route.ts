// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرجاء إدخال الرابط" }, { status: 400 });
    }

    const cleanUrl = url.trim();
    
    // تحويل رابط YouTube Shorts
    let finalUrl = cleanUrl;
    if (cleanUrl.includes('youtube.com/shorts/')) {
      const videoId = cleanUrl.split('/shorts/')[1]?.split('?')[0];
      if (videoId) {
        finalUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }
    }

    // API واحد فقط مؤكد يعمل (يدعم يوتيوب، تيك توك، انستغرام، فيسبوك)
    const response = await fetch(`https://api.kenk.xyz/download?url=${encodeURIComponent(finalUrl)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.status === true && data.result) {
      const videoUrl = data.result.video || data.result.url || data.result;
      if (videoUrl && videoUrl.startsWith('http')) {
        return NextResponse.json({ 
          success: true, 
          downloadUrl: videoUrl,
          title: data.result.title || "فيديو"
        });
      }
    }

    // إذا فشل، استخدم حل بديل لليوتيوب فقط
    if (finalUrl.includes('youtube.com')) {
      const videoId = extractYouTubeId(finalUrl);
      if (videoId) {
        // رابط مباشر لتحميل الفيديو (جودة SD)
        return NextResponse.json({ 
          success: true, 
          downloadUrl: `https://inv.odyssey346.dev/api/v1/videos/${videoId}`,
          note: "قد يستغرق التحميل بضع ثوان"
        });
      }
    }

    return NextResponse.json({ 
      error: "تعذر تحميل الفيديو. تأكد من الرابط وجرب مرة أخرى" 
    }, { status: 400 });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "خطأ في السيرفر ⚠️" }, { status: 500 });
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
    /(?:youtube\.com\/shorts\/)([\w-]+)/,
    /(?:youtube\.com\/embed\/)([\w-]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}