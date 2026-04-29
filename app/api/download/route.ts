import { NextRequest, NextResponse } from 'next/server';

/**
 * الدالة detectPlatform لا تزال تعمل بشكل ممتاز،
 * سنبقي عليها كما هي لاكتشاف مصدر الرابط.
 */
function detectPlatform(url: string) {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
  return 'other';
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    // 1. التحقق من وجود الرابط (لم يتغير)
    if (!url) {
      return NextResponse.json({ error: 'URL مطلوب' }, { status: 400 });
    }

    const platform = detectPlatform(url);
    console.log(`طلب تحميل لمنصة: ${platform}, الرابط: ${url}`);

    // --- بداية الجزء الذي تم تغييره وإصلاحه ---

    // 2. استخدام api.allorigins.win كطبقة وسيطة لتجاوز قيود CORS وجلب المحتوى
    // نقوم بتمرير الرابط الذي نريد تحميله إلى allorigins.
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    // 3. إرسال طلب إلى خادم Node.js وسيط أو استدعاء مباشر لـ yt-dlp.
    //    أفضل وأسهل طريقة هي استخدام خدمة وسيطة جاهزة تقوم بتشغيل yt-dlp.
    //    سنستخدم هنا خدمة `yt-dlp-api` وهي خدمة مجانية ومفتوحة المصدر.
    //    نقوم بإرسال الرابط الأصلي للفيديو وليس رابط allorigins.
    const apiResponse = await fetch('https://yt-dlp-api.vercel.app/api/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url }),
    });

    // 4. معالجة الرد من خدمة yt-dlp
    if (!apiResponse.ok) {
      console.error('فشل الاتصال بخدمة yt-dlp:', apiResponse.status);
      throw new Error('فشل في جلب بيانات التحميل من الخدمة الجديدة.');
    }

    const data = await apiResponse.json();

    // 5. هيكلة البيانات المُستلمة وتجهيزها للواجهة الأمامية
    //    تختلف هيكلة الرد من خدمة لأخرى، وهنا نفترض أن الخدمة ترجع
    //    { success: true, downloadUrl: '...', title: '...' }
    if (data.success && data.downloadUrl) {
      return NextResponse.json({
        downloadUrl: data.downloadUrl,
        title: data.title || `فيديو من ${platform}`, // نستخدم الاسم المُسترجع أو اسم المنصة
      });
    }

    // --- خطة احتياطية أكثر قوة ---
    // 6. في حال فشلت الخدمة الأولى، نستخدم طريقة مباشرة عبر allorigins
    //    نجرب الحصول على رابط التحميل من خلال تحليل صفحة ويب بسيطة (ينجح مع بعض المنصات).
    console.log('البحث عن رابط تحميل مباشر باستخدام allorigins...');
    const rawResponse = await fetch(proxyUrl);
    if (!rawResponse.ok) throw new Error('فشل في جلب الصفحة الأصلية عبر الوسيط.');

    const html = await rawResponse.text();
    // محاولة بدائية للعثور على رابط فيديو مباشر داخل كود HTML (ينجح أحياناً مع فيسبوك وتويتر)
    const videoMatch = html.match(/(?:https?:\/\/[^"']+\.(?:mp4|avi|mov)[^"']*)/i);
    if (videoMatch && videoMatch[0]) {
      console.log('تم العثور على رابط فيديو مباشر بنجاح.');
      return NextResponse.json({
        downloadUrl: videoMatch[0],
        title: `فيديو من ${platform}`,
      });
    }

    // إذا وصلنا إلى هنا، فكل المحاولات باءت بالفشل.
    return NextResponse.json(
      { error: 'تعذر جلب الفيديو — تأكد من الرابط وحاول مجدداً' },
      { status: 400 }
    );
    // --- نهاية الجزء الذي تم تغييره وإصلاحه ---

  } catch (err: any) {
    // 7. معالجة الأخطاء (لم يتغير)
    console.error('حدث خطأ غير متوقع:', err);
    return NextResponse.json(
      { error: 'خطأ في السيرفر — حاول لاحقاً' },
      { status: 500 }
    );
  }
}