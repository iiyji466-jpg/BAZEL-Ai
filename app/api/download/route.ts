// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });

    const key = process.env.RAPIDAPI_KEY;
    if (!key) return NextResponse.json({ error: "مفتاح API غير موجود" }, { status: 500 });

    // باقي الكود كما هو...

  } catch (error: unknown) { // تحديد النوع كـ unknown
    console.error("Download error:", error);
    
    // استخراج رسالة الخطأ بطريقة آمنة
    let errorMessage = "حدث خطأ أثناء معالجة الطلب";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}