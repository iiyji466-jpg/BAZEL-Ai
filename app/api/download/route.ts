// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرجاء إدخال الرابط" }, { status: 400 });
    }

    const cleanUrl = url.trim();

    // محاولة عدة APIs بديلة (إذا فشل واحد جرب الثاني)
    const apis = [
      `https://p.oceansaver.in/ajax/download.php?url=${encodeURIComponent(cleanUrl)}`,
      `https://tikdown.org/api/ajaxSearch?q=${encodeURIComponent(cleanUrl)}`,
      `https://api.tikmate.app/api/lookup?url=${encodeURIComponent(cleanUrl)}`
    ];

    for (const apiUrl of apis) {
      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          next: { revalidate: 0 } // منع الكاش
        });

        if (!response.ok) continue;

        const data = await response.json();
        
        // استخراج رابط التحميل بطرق مختلفة حسب استجابة الـ API
        let downloadUrl = null;
        
        if (data.video) {
          downloadUrl = data.video.noWatermark || data.video.url || data.video;
        } else if (data.url) {
          downloadUrl = data.url;
        } else if (data.data && data.data[0]) {
          downloadUrl = data.data[0].url;
        } else if (typeof data === 'string' && data.includes('http')) {
          downloadUrl = data;
        }

        if (downloadUrl && downloadUrl.startsWith('http')) {
          return NextResponse.json({ 
            success: true,
            downloadUrl: downloadUrl,
            title: data.title || "فيديو",
            thumbnail: data.thumbnail || data.cover || null
          });
        }
      } catch (err) {
        console.log("API failed, trying next...");
        continue;
      }
    }

    // إذا فشلت كل المحاولات
    return NextResponse.json({ 
      error: "تعذر استخراج الرابط، تأكد من صحة الرابط وجرب مرة أخرى" 
    }, { status: 400 });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "خطأ في السيرفر ⚠️" }, { status: 500 });
  }
}