import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'URL مطلوب' }, { status: 400 });
  }

  try {
    const response = await fetch('https://YOUR_RENDER_URL.onrender.com/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: 'تعذر جلب الفيديو' }, { status: 400 });
    }

    return NextResponse.json({
      url: data.url,
      title: data.title,
      thumbnail: data.thumbnail,
    });

  } catch (err) {
    return NextResponse.json({ error: 'خطأ في السيرفر' }, { status: 500 });
  }
}