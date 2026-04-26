// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرجاء إدخال الرابط" }, { status: 400 });
    }

    const cleanUrl = url.trim();
    
    // استخراج ID الفيديو من رابط يوتيوب
    let videoId = "";
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([\w-]+)/,
      /(?:youtu\.be\/)([\w-]+)/,
      /(?:youtube\.com\/shorts\/)([\w-]+)/
    ];
    
    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) {
        videoId = match[1];
        break;
      }
    }
    
    if (!videoId) {
      // إذا لم يكن يوتيوب، جرب TikWM للمنصات الأخرى
      const tiktokRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`);
      const tiktokData = await tiktokRes.json();
      
      if (tiktokData.code === 0 && tiktokData.data) {
        return NextResponse.json({
          success: true,
          downloadUrl: tiktokData.data.play
        });
      }
      
      return NextResponse.json({ error: "رابط غير مدعوم" }, { status: 400 });
    }
    
    // ليوتيوب - استخدم رابط مباشر من خوادم جوجل
    // هذه الطريقة تعمل مع الفيديوهات العامة فقط
    const directUrl = `https://inv.riverside.rocks/watch?v=${videoId}`;
    
    // جلب صفحة الفيديو لاستخراج الرابط المباشر
    const pageRes = await fetch(directUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await pageRes.text();
    
    // استخراج رابط الفيديو من الصفحة
    const videoMatch = html.match(/https?:\/\/[^\s"']+\.mp4[^\s"']*/i);
    
    if (videoMatch) {
      return NextResponse.json({
        success: true,
        downloadUrl: videoMatch[0],
        title: "فيديو يوتيوب"
      });
    }
    
    // حل بديل: استخدام yewtu.be (بديل يوتيوب يعمل على Vercel)
    const yewtuUrl = `https://yewtu.be/latest_version?id=${videoId}&itag=18`;
    const yewtuRes = await fetch(yewtuUrl);
    const data = await yewtuRes.text();
    
    const urlMatch = data.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/i);
    
    if (urlMatch) {
      return NextResponse.json({
        success: true,
        downloadUrl: urlMatch[0]
      });
    }

    return NextResponse.json({ error: "فشل تحميل الفيديو من يوتيوب" }, { status: 400 });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "خطأ في السيرفر" }, { status: 500 });
  }
}