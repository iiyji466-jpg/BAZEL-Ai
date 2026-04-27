// app/api/download/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'URL مطلوب' }, { status: 400 });
  }

  try {
    const response = await fetch('https://co.wuk.sh/api/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        vQuality: 'max',
        filenamePattern: 'pretty',
      }),
    });

    const data = await response.json();

    if (data.status === 'error' || data.status === 'rate-limit') {
      return NextResponse.json({ error: 'تعذر جلب الفيديو' }, { status: 400 });
    }

    return NextResponse.json({
      url: data.url,
      status: data.status,
    });

  } catch (err) {
    return NextResponse.json({ error: 'خطأ في السيرفر' }, { status: 500 });
  }
}