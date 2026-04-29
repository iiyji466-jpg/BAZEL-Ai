import { NextRequest, NextResponse } from 'next/server';

function detectPlatform(url: string): string {
  const lowUrl = url.toLowerCase();
  if (lowUrl.includes('instagram.com') || lowUrl.includes('instagr.am')) return 'instagram';
  if (lowUrl.includes('tiktok.com')) return 'tiktok';
  if (lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be')) return 'youtube';
  if (lowUrl.includes('twitter.com') || lowUrl.includes('x.com')) return 'twitter';
  if (lowUrl.includes('facebook.com') || lowUrl.includes('fb.watch') || lowUrl.includes('fb.com')) return 'facebook';
  return 'general'; // تغيير من unknown إلى general لمحاولة المعالجة بأي حال
}

export async function POST(req: NextRequest) {
  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json({ error: 'خطأ في إعدادات الخادم' }, { status: 500 });
  }

  let { url }: { url: string } = await req.json().catch(() => ({ url: '' }));

  if (!url) return NextResponse.json({ error: 'الرابط مطلوب' }, { status: 400 });

  // 1. إصلاح الرابط إذا كان ينقصه البروتوكول (حل مشكلة الصورة)
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  const platform = detectPlatform(url);

  try {
    let apiUrl: string;
    let host: string;
    let videoUrl: string | undefined;
    let title: string = 'Video';

    switch (platform) {
      case 'instagram':
        host = 'instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com';
        apiUrl = `https://${host}/get-info-rapidapi?url=${encodeURIComponent(url)}`;
        break;

      case 'tiktok':
        host = 'tiktok-video-no-watermark2.p.rapidapi.com';
        apiUrl = `https://${host}/?url=${encodeURIComponent(url)}`;
        break;

      default:
        // 2. تحديث الـ Endpoint للـ API العام (هذا غالباً سبب الـ 404)
        host = 'social-media-video-downloader.p.rapidapi.com';
        apiUrl = `https://${host}/smvd/get/all?url=${encodeURIComponent(url)}`; 
        break;
    }

    const response = await fetch(apiUrl, {
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': host,
      },
    });

    // 3. فحص الحالة قبل محاولة القراءة
    if (!response.ok) {
        // إذا فشل الـ API العام، جرب API بديل أو أبلغ المستخدم بوضوح
        return NextResponse.json({ 
            error: `فشل المصدر (${response.status}). تأكد من أن الرابط صحيح وعام.` 
        }, { status: response.status });
    }

    const data = await response.json();

    // 4. استخراج الرابط بناءً على هيكلة البيانات (تختلف من API لآخر)
    if (platform === 'instagram') {
        videoUrl = data.video_url || data.url;
    } else if (platform === 'tiktok') {
        videoUrl = data.data?.play || data.video;
    } else {
        videoUrl = data.contents?.[0]?.videos?.[0]?.url || data.links?.[0]?.url;
    }

    if (!videoUrl) {
      return NextResponse.json({ error: 'لم يتم العثور على ملف فيديو' }, { status: 404 });
    }

    return NextResponse.json({ success: true, url: videoUrl, title });

  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
