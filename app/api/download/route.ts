import { NextRequest, NextResponse } from 'next/server';

const APIS = [
  {
    url: 'https://social-media-video-downloader.p.rapidapi.com/smvd/get/all',
    host: 'social-media-video-downloader.p.rapidapi.com',
    key: process.env.RAPIDAPI_KEY1!,
  },
  {
    url: 'https://all-media-downloader.p.rapidapi.com/download',
    host: 'all-media-downloader.p.rapidapi.com',
    key: process.env.RAPIDAPI_KEY2!,
  },
  {
    url: 'https://youtube-video-download-info.p.rapidapi.com/dl',
    host: 'youtube-video-download-info.p.rapidapi.com',
    key: process.env.RAPIDAPI_KEY3!,
  },
];

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'URL مطلوب' }, { status: 400 });
  }

  for (const api of APIS) {
    try {
      const response = await fetch(`${api.url}?url=${encodeURIComponent(url)}`, {
        headers: {
          'x-rapidapi-key': api.key,
          'x-rapidapi-host': api.host,
        },
      });

      const data = await response.json();
      const videoUrl = data?.links?.[0]?.url || data?.url || data?.video;

      if (videoUrl) {
        return NextResponse.json({ url: videoUrl, title: data?.title });
      }
    } catch {}
  }

  return NextResponse.json({ error: 'تعذر جلب الفيديو' }, { status: 400 });
}