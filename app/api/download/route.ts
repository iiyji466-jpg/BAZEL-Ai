// تأكد من أن هذا هو المسار الصحيح في Vercel (مثلاً /api/v1/download)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    
    // إذا لم تكن هناك بيانات، أرسل خطأ 400 واضح
    if (!body || !body.url) {
      return NextResponse.json({ error: 'الرابط مفقود في الطلب' }, { status: 400 });
    }

    let url = body.url.trim();
    
    // إضافة البروتوكول إذا كان مفقوداً (حل مشكلة الروابط المختصرة)
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    const platform = detectPlatform(url);
    if (platform === 'unknown') {
      return NextResponse.json({ error: 'هذا الموقع غير مدعوم حالياً' }, { status: 400 });
    }

    // ... تكملة كود الاتصال بـ RapidAPI ...

  } catch (error) {
    console.error("Vercel Error Log:", error);
    return NextResponse.json({ error: 'خطأ داخلي في السيرفر' }, { status: 500 });
  }
}
