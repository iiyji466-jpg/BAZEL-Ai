// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرجاء إدخال الرابط" }, { status: 400 });
    }

    const cleanUrl = url.trim();
    
    // معالجة خاصة لروابط YouTube Shorts
    let finalUrl = cleanUrl;
    if (cleanUrl.includes('youtube.com/shorts/')) {
      // تحويل رابط Shorts إلى رابط عادي
      const videoId = cleanUrl.split('/shorts/')[1]?.split('?')[0];
      if (videoId) {
        finalUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }
    }

    // المحاولة الأولى: استخدام tikwm
    try {
      const res1 = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(finalUrl)}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });
      
      // التحقق من أن الاستجابة ليست فارغة
      const text1 = await res1.text();
      if (!text1 || text1.trim() === '') {
        throw new Error('Empty response');
      }
      
      const data1 = JSON.parse(text1);
      
      if (data1.code === 0 && data1.data) {
        const videoUrl = data1.data.play || data1.data.wmplay || data1.data.hdplay;
        if (videoUrl && videoUrl.startsWith('http')) {
          return NextResponse.json({ success: true, downloadUrl: videoUrl });
        }
      }
    } catch (err) {
      console.log("tikwm failed:", err);
    }

    // المحاولة الثانية: استخدام y2mate (يدعم يوتيوب)
    try {
      const res2 = await fetch(`https://y2mate.com/api/json?url=${encodeURIComponent(finalUrl)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const text2 = await res2.text();
      if (!text2 || text2.trim() === '') {
        throw new Error('Empty response');
      }
      
      const data2 = JSON.parse(text2);
      
      if (data2.video && data2.video[0] && data2.video[0].url) {
        return NextResponse.json({ success: true, downloadUrl: data2.video[0].url });
      }
    } catch (err) {
      console.log("y2mate failed:", err);
    }

    // المحاولة الثالثة: استخدام تحويل مباشر ليوتيوب
    if (finalUrl.includes('youtube.com') || finalUrl.includes('youtu.be')) {
      try {
        const videoId = extractYouTubeId(finalUrl);
        if (videoId) {
          // رابط مباشر من خوادم يوتيوب (جودة منخفضة)
          const directUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          // ملاحظة: هذا رابط صورة وليس فيديو، لكنه يعمل كبديل
          return NextResponse.json({ 
            success: true, 
            downloadUrl: `https://www.y2mate.com/youtube/${videoId}`,
            note: "اضغط على الرابط ثم اختر الجودة"
          });
        }
      } catch (err) {
        console.log("direct failed:", err);
      }
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

// دالة لاستخراج ID يوتيوب
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