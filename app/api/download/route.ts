import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرجاء إدخال الرابط" }, { status: 400 });
    }

    const cleanUrl = url.trim();
    
    // المحاولة الأولى: tikwm (يدعم تيك توك، انستغرام، يوتيوب، فيسبوك)
    try {
      const res1 = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const data1 = await res1.json();
      
      if (data1.code === 0 && data1.data) {
        const videoUrl = data1.data.play || data1.data.wmplay || data1.data.hdplay;
        if (videoUrl && videoUrl.startsWith('http')) {
          return NextResponse.json({ success: true, downloadUrl: videoUrl });
        }
      }
    } catch (err) {
      console.log("tikwm failed:", err);
    }

    // المحاولة الثانية: oceansaver
    try {
      const res2 = await fetch(`https://p.oceansaver.in/ajax/download.php?url=${encodeURIComponent(cleanUrl)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const data2 = await res2.json();
      
      if (data2.video) {
        const videoUrl = data2.video.noWatermark || data2.video.watermark || data2.video.url;
        if (videoUrl && videoUrl.startsWith('http')) {
          return NextResponse.json({ success: true, downloadUrl: videoUrl });
        }
      }
      if (data2.url && data2.url.startsWith('http')) {
        return NextResponse.json({ success: true, downloadUrl: data2.url });
      }
    } catch (err) {
      console.log("oceansaver failed:", err);
    }

    // المحاولة الثالثة: ssstik
    try {
      const res3 = await fetch(`https://ssstik.io/abc?url=${encodeURIComponent(cleanUrl)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const data3 = await res3.json();
      
      if (data3.url && data3.url.startsWith('http')) {
        return NextResponse.json({ success: true, downloadUrl: data3.url });
      }
      if (data3.video && data3.video.startsWith('http')) {
        return NextResponse.json({ success: true, downloadUrl: data3.video });
      }
    } catch (err) {
      console.log("ssstik failed:", err);
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