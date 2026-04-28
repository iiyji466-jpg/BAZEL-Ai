import { NextRequest, NextResponse } from 'next/server';

function detectPlatform(url: string) {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook';
  return 'other';
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'URL مطلوب' }, { status: 400 });
  }

  const platform = detectPlatform(url);

  try {
    let apiUrl: string;
    let host: string;

    // اختيار API المناسب لكل منصة
    switch (platform) {
      case 'instagram':
        apiUrl = `https://instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com/get-info-rapidapi?url=${encodeURIComponent(url)}`;
        host = 'instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com';
        break;
        
      case 'tiktok':
        // استخدام API مخصص لـ TikTok
        apiUrl = `https://tiktok-video-no-watermark2.p.rapidapi.com/?url=${encodeURIComponent(url)}`;
        host = 'tiktok-video-no-watermark2.p.rapidapi.com';
        break;
        
      default:
        // YouTube, Twitter, Facebook
        apiUrl = `https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=${encodeURIComponent(url)}`;
        host = 'social-media-video-downloader.p.rapidapi.com';
    }

    const response = await fetch(apiUrl, {
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
        'x-rapidapi-host': host,
      },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // استخراج الفيديو حسب المنصة
    let videoUrl: string | undefined;
    let title: string;

    if (platform === 'instagram') {
      videoUrl = data?.video_url || data?.url;
      title = data?.title || 'Instagram Video';
    } else if (platform === 'tiktok') {
      videoUrl = data?.video || data?.play;
      title = data?.title || 'TikTok Video';
    } else {
      const videos = data?.contents?.[0]?.videos;
      videoUrl = videos?.[0]?.url;
      title = data?.contents?.[0]?.title || 'Video';
    }

    if (!videoUrl) {
      return NextResponse.json({ error: 'تعذر جلب الفيديو' }, { status: 400 });
    }

    return NextResponse.json({ url: videoUrl, title });

  } catch (err) {
    console.error('Download error:', err);
    return NextResponse.json(
      { error: 'خطأ في السيرفر: ' + (err as Error).message },
      { status: 500 }
    );
  }
}