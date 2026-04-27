import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'URL مطلوب' }, { status: 400 });
  }

  try {
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