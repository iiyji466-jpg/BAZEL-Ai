import { NextRequest, NextResponse } from 'next/server';

// ✅ تحسين دالة كشف المنصة
function detectPlatform(url: string): string {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook';
  return 'unknown';
}

export async function POST(req: NextRequest) {
  // ✅ فحص المفتاح أولاً
  if (!process.env.RAPIDAPI_KEY) {
    console.error('❌ RAPIDAPI_KEY غير موجود');
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

  if (platform === 'unknown') {
    return NextResponse.json(
      { error: 'المنصة غير مدعومة' },
      { status: 400 }
    );
  }

  try {
    // ✅ لكل منصة API خاص بها
    let apiUrl: string;
    let host: string;
    let videoUrl: string | undefined;
    let title: string;

    switch (platform) {
      // 📸 Instagram
      case 'instagram':
        apiUrl = `https://instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com/get-info-rapidapi?url=${encodeURIComponent(url)}`;
        host = 'instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com';

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

      // 🎵 TikTok
      case 'tiktok':
        apiUrl = `https://tiktok-video-no-watermark2.p.rapidapi.com/?url=${encodeURIComponent(url)}`;
        host = 'tiktok-video-no-watermark2.p.rapidapi.com';

        const tkRes = await fetch(apiUrl, {
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': host,
          },
        });

        const tkData = await tkRes.json();
        videoUrl = tkData?.video || tkData?.play;
        title = tkData?.title || 'TikTok Video';
        break;

      // ▶️ YouTube - Twitter - Facebook
      default:
        apiUrl = `https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=${encodeURIComponent(url)}`;
        host = 'social-media-video-downloader.p.rapidapi.com';

        const smRes = await fetch(apiUrl, {
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': host,
          },
        });

        const smData = await smRes.json();
        const videos = smData?.contents?.[0]?.videos;

        if (!videos || videos.length === 0) {
          return NextResponse.json(
            { error: 'لم يتم العثور على فيديو' },
            { status: 404 }
          );
        }

        // ✅ اختيار أفضل جودة متاحة
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

    return NextResponse.json({
      success: true,
      platform,
      title,
      url: videoUrl,
    });

  } catch (error) {
    console.error('❌ خطأ في الجلب:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم أثناء جلب الفيديو' },
      { status: 500 }
    );
  }
}