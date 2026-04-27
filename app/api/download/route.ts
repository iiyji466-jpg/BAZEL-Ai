// app/api/download/route.ts
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

    if (!data.links || data.links.length === 0) {
      return NextResponse.json({ error: 'تعذر جلب الفيديو' }, { status: 400 });
    }

    return NextResponse.json({
      title: data.title,
      thumbnail: data.picture,
      links: data.links, // روابط تنزيل بجودات مختلفة
    });

  } catch (err) {
    return NextResponse.json({ error: 'خطأ في السيرفر' }, { status: 500 });
  }
}