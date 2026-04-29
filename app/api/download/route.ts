
import { NextRequest, NextResponse } from 'next/server'; // 👈 هذا هو السطر الناقص

function detectPlatform(url: string): string {
  const lowUrl = url.toLowerCase();
  if (lowUrl.includes('instagram.com') || lowUrl.includes('instagr.am')) return 'instagram';
  if (lowUrl.includes('tiktok.com')) return 'tiktok';
  if (lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be')) return 'youtube';
  if (lowUrl.includes('twitter.com') || lowUrl.includes('x.com')) return 'twitter';
  if (lowUrl.includes('facebook.com') || lowUrl.includes('fb.watch') || lowUrl.includes('fb.com')) return 'facebook';
  return 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    
    if (!body || !body.url) {
      return NextResponse.json({ error: 'الرابط مفقود في الطلب' }, { status: 400 });
    }

    let url = body.url.trim();
    
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    const platform = detectPlatform(url);
    if (platform === 'unknown') {
      return NextResponse.json({ error: 'هذا الموقع غير مدعوم حالياً' }, { status: 400 });
    }

    // هنا تضع بقية الكود الخاص بـ RapidAPI الذي استخدمناه سابقاً...
    
    return NextResponse.json({ success: true, message: "تم الاستلام" }); // مثال للاختبار

  } catch (error) {
    return NextResponse.json({ error: 'خطأ داخلي في السيرفر' }, { status: 500 });
  }
}
