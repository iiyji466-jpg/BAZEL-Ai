// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرجاء إدخال الرابط" }, { status: 400 });
    }

    const cleanUrl = url.trim();
    
    // استخدم هذا ال API - يعمل مع يوتيوب، تيك توك، انستغرام، فيسبوك، تويتر
    const response = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`);
    const data = await response.json();

    if (data.code === 0 && data.data) {
      return NextResponse.json({
        success: true,
        downloadUrl: data.data.play
      });
    }

    return NextResponse.json({ error: "فشل التحميل" }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: "خطأ في السيرفر" }, { status: 500 });
  }
}