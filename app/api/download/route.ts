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

    // المحاولة الأولى: tikwm
    try {
      const res = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(finalUrl)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      
      const data = await res.json();
      
      if (data.code === 0 && data.data) {
        const videoUrl = data.data.play || data.data.wmplay || data.data.hdplay;
        if (videoUrl && videoUrl.startsWith('http')) {
          return NextResponse.json({ success: true, downloadUrl: videoUrl });
        }
      }
    } catch (err) {
      console.log("tikwm failed");
    }

    // المحاولة الثانية: snapsave (بديل ممتاز)
    try {
      const res = await fetch(`https://snapsave.app/api/ajaxSearch?q=${encodeURIComponent(finalUrl)}`, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: new URLSearchParams({ q: finalUrl })
      });
      
      const data = await res.json();
      
      if (data.video) {
        const videoUrl = data.video.noWatermark || data.video.url;
        if (videoUrl && videoUrl.startsWith('http')) {
          return NextResponse.json({ success: true, downloadUrl: videoUrl });
        }
      }
      if (data.url && data.url.startsWith('http')) {
        return NextResponse.json({ success: true, downloadUrl: data.url });
      }
    } catch (err) {
      console.log("snapsave failed");
    }

    // المحاولة الثالثة: savefrom
    try {
      const res = await fetch(`https://savefrom.net/api/convert?url=${encodeURIComponent(finalUrl)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      
      const data = await res.json();
      
      if (data.downloadUrl && data.downloadUrl.startsWith('http')) {
        return NextResponse.json({ success: true, downloadUrl: data.downloadUrl });
      }
    } catch (err) {
      console.log("savefrom failed");
    }

    // إذا فشل كل شيء
    return NextResponse.json({ 
      error: "تعذر تحميل الفيديو. تأكد من الرابط وجرب مرة أخرى" 
    }, { status: 400 });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "خطأ في السيرفر ⚠️" }, { status: 500 });
  }
}