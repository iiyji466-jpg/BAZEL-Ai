import { NextRequest, NextResponse } from 'next/server';

function detectPlatform(url: string) {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  return 'other';
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'URL مطلوب' }, { status: 400 });
  }

  const platform = detectPlatform(url);

  try {
    // Instagram و TikTok → API مختلف
    if (platform === 'instagram' || platform === 'tiktok') {
      const response = await fetch(
        `https://instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com/get-info-rapidapi?url=${encodeURIComponent(url)}`,
        {
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
            'x-rapidapi-host': 'instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com',
          },
        }
      );
      const data = await response.json();
      const videoUrl = data?.video_url || data?.url;

      if (!videoUrl) {
        return NextResponse.json({ error: 'تعذر جلب الفيديو' }, { status: 400 });
      }

      return NextResponse.json({ url: videoUrl, title: data?.title || 'فيديو' });
    }

    // YouTube و باقي المنصات
    const response = await fetch(
      `https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=${encodeURIComponent(url)}`,
      {
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
          'x-rapidapi-host': 'social-media-video-downloader.p.rapidapi.com',
        },
      }
    );

    const data = await response.json();
    const videos = data?.contents?.[0]?.videos;

    if (!videos || videos.length === 0) {
      return NextResponse.json({ error: 'تعذر جلب الفيديو' }, { status: 400 });
    }

    return NextResponse.json({
      url: videos[0].url,
      title: data?.contents?.[0]?.title || 'فيديو',
    });

  } catch (err) {
    return NextResponse.json({ error: 'خطأ في السيرفر' }, { status: 500 });
  }
}