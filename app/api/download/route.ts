import { NextRequest, NextResponse } from 'next/server';

function detectPlatform(url: string) {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
  return 'other';
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'URL مطلوب' }, { status: 400 });
  }

  const platform = detectPlatform(url);

  try {
    // ✅ API مجاني يدعم كل المنصات
    const apiUrl = `https://api.cobalt.tools/api/json`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        vQuality: 'max',
        filenamePattern: 'basic',
        isNoTTWatermark: true,
        isTTFullAudio: false,
        isAudioOnly: false,
      }),
    });

    const data = await response.json();

    // cobalt يرجع status: "stream" أو "redirect" أو "picker"
    if (data.status === 'stream' || data.status === 'redirect') {
      return NextResponse.json({
        downloadUrl: data.url,
        title: platform,
      });
    }

    if (data.status === 'picker') {
      // يرجع قائمة - نأخذ أول فيديو
      const first = data.picker?.[0];
      if (first?.url) {
        return NextResponse.json({
          downloadUrl: first.url,
          title: platform,
        });
      }
    }

    // fallback: جرب savefrom
    const sfRes = await fetch(
      `https://worker.savedeo.com/api/savefrom?url=${encodeURIComponent(url)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (sfRes.ok) {
      const sfData = await sfRes.json();
      const videoUrl = sfData?.url?.[0]?.url || sfData?.media?.[0]?.url;
      if (videoUrl) {
        return NextResponse.json({ downloadUrl: videoUrl, title: platform });
      }
    }

    return NextResponse.json(
      { error: 'تعذر جلب الفيديو — تأكد من الرابط وحاول مجدداً' },
      { status: 400 }
    );

  } catch (err: any) {
    console.error('Download error:', err);
    return NextResponse.json(
      { error: 'خطأ في السيرفر — حاول لاحقاً' },
      { status: 500 }
    );
  }
}
