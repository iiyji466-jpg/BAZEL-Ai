import { NextRequest, NextResponse } from 'next/server';

function detectPlatform(url: string): string {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook';
  return 'unknown';
}

export async function POST(req: NextRequest) {
  // ✅ فحص المفتاح
  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json(
      { error: 'خطأ في إعدادات الخادم - المفتاح غير موجود' },
      { status: 500 }
    );
  }

  let url: string;
  try {
    const body = await req.json();
    url = body.url;
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ error: 'الرابط مطلوب' }, { status: 400 });
  }

  const platform = detectPlatform(url);
  console.log(`🔗 الرابط: ${url}, المنصة: ${platform}`);

  if (platform === 'unknown') {
    return NextResponse.json({ error: 'المنصة غير مدعومة' }, { status: 400 });
  }

  try {
    let apiUrl: string;
    let host: string;
    let videoUrl: string | undefined;
    let title: string;

    switch (platform) {
      // 📸 Instagram
      case 'instagram':
        host = 'instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com';
        apiUrl = `https://${host}/get-info-rapidapi?url=${encodeURIComponent(url)}`;

        const igRes = await fetch(apiUrl, {
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': host,
          },
        });
        const igData = await igRes.json();
        videoUrl = igData?.video_url || igData?.url;
        title = igData?.title || 'Instagram Video';
        break;

      // 🎵 TikTok - استخدام API عام
      case 'tiktok':
        host = 'tiktok-video-no-watermark2.p.rapidapi.com';
        apiUrl = `https://${host}/?url=${encodeURIComponent(url)}`;

        const tkRes = await fetch(apiUrl, {
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': host,
          },
        });

        if (!tkRes.ok) {
          console.error('❌ TikTok API فشل بحالة:', tkRes.status);
          return NextResponse.json(
            { error: 'تعذر تحميل فيديو TikTok. تأكد من الاشتراك في TikTok API على RapidAPI' },
            { status: 400 }
          );
        }

        const tkData = await tkRes.json();
        videoUrl = tkData?.video || tkData?.play;
        title = tkData?.title || 'TikTok Video';
        break;

      // ▶️ YouTube - Twitter - Facebook
      default:
        host = 'social-media-video-downloader.p.rapidapi.com';
        apiUrl = `https://${host}/smvd/get/all?url=${encodeURIComponent(url)}`;

        const smRes = await fetch(apiUrl, {
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': host,
          },
        });

        if (!smRes.ok) {
          console.error('❌ API العام فشل بحالة:', smRes.status);
          return NextResponse.json(
            { error: `فشل الاتصال بالخدمة (${smRes.status})` },
            { status: 400 }
          );
        }

        const smData = await smRes.json();
        const videos = smData?.contents?.[0]?.videos;

        if (!videos || videos.length === 0) {
          return NextResponse.json(
            { error: 'لم يتم العثور على فيديو' },
            { status: 404 }
          );
        }

        const bestVideo = videos.find((v: any) =>
          v.label?.includes('1080p') || v.label?.includes('720p')
        ) || videos[0];

        videoUrl = bestVideo.url;
        title = smData?.contents?.[0]?.title || 'Video';
        break;
    }

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'تعذر استخراج رابط الفيديو' },
        { status: 400 }
      );
    }

    console.log('✅ تم استخراج الفيديو بنجاح');
    return NextResponse.json({
      success: true,
      platform,
      title,
      url: videoUrl,
    });

  } catch (error) {
    console.error('❌ خطأ غير متوقع:', error);
    return NextResponse.json(
      { error: 'خطأ في السيرفر — حاول لاحقاً' },
      { status: 500 }
    );
  }
}