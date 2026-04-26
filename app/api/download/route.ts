// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرجاء إدخال الرابط" }, { status: 400 });
    }

    const cleanUrl = url.trim();
    
    // تحويل رابط YouTube Shorts إلى رابط عادي
    let finalUrl = cleanUrl;
    if (cleanUrl.includes('youtube.com/shorts/')) {
      const videoId = cleanUrl.split('/shorts/')[1]?.split('?')[0];
      if (videoId) {
        finalUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }
    }

    // المحاولة الأولى: tikwm (يدعم يوتيوب، تيك توك، انستغرام، فيسبوك)
    try {
      const res = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(finalUrl)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      
      const text = await res.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
        if (data.code === 0 && data.data) {
          const videoUrl = data.data.play || data.data.wmplay || data.data.hdplay;
          if (videoUrl && videoUrl.startsWith('http')) {
            return NextResponse.json({ success: true, downloadUrl: videoUrl });
          }
        }
      }
    } catch (err) {
      console.log("tikwm failed:", err);
    }

    // المحاولة الثانية: savetik (بديل يعمل)
    try {
      const res = await fetch(`https://savetik.co/api/ajaxSearch?q=${encodeURIComponent(finalUrl)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      
      const text = await res.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
        const videoUrl = data.video || data.url || data.images?.[0];
        if (videoUrl && videoUrl.startsWith('http')) {
          return NextResponse.json({ success: true, downloadUrl: videoUrl });
        }
      }
    } catch (err) {
      console.log("savetik failed:", err);
    }

    // المحاولة الثالثة: ssstik.io
    try {
      const res = await fetch(`https://ssstik.io/abc?url=${encodeURIComponent(finalUrl)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      
      const text = await res.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
        if (data.url) {
          return NextResponse.json({ success: true, downloadUrl: data.url });
        }
      }
    } catch (err) {
      console.log("ssstik failed:", err);
    }

    // إذا فشل كل شيء - إرجاع رابط بديل للمستخدم
    if (finalUrl.includes('youtube.com') || finalUrl.includes('youtu.be')) {
      const videoId = extractYouTubeId(finalUrl);
      if (videoId) {
        return NextResponse.json({ 
          success: true, 
          downloadUrl: `https://y2meta.app/en/youtube/${videoId}/`,
          note: "اضغط على الرابط ثم اختر جودة التحميل"
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