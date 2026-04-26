// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

export const runtime = 'nodejs'; // مهم جداً - yt-dlp يحتاج Node.js runtime
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرجاء إدخال الرابط" }, { status: 400 });
    }

    const cleanUrl = url.trim();
    
    // إنشاء مجلد مؤقت للتحميلات
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputPath = path.join(tempDir, `video_${Date.now()}.mp4`);
    
    // استخدام yt-dlp لاستخراج رابط التحميل المباشر
    // هذا الأمر يجلب أفضل رابط فيديو متاح بدون تحميل الملف
    const command = `yt-dlp -g --no-warnings "${cleanUrl}"`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stdout) {
      throw new Error(stderr);
    }
    
    const directUrl = stdout.trim();
    
    if (directUrl && directUrl.startsWith('http')) {
      return NextResponse.json({
        success: true,
        downloadUrl: directUrl,
        title: "فيديو",
        message: "تم استخراج رابط التحميل بنجاح"
      });
    }
    
    return NextResponse.json({ 
      error: "تعذر استخراج رابط التحميل" 
    }, { status: 400 });

  } catch (error: any) {
    console.error("Error:", error);
    
    // رسائل خطأ مفهومة للمستخدم
    if (error.message?.includes("UNSUPPORTED_URL") || error.message?.includes("Unsupported URL")) {
      return NextResponse.json({ 
        error: "⚠️ هذا الموقع غير مدعوم حالياً. المواقع المدعومة: يوتيوب، تيك توك، إنستغرام، فيسبوك، تويتر، وأكثر من 1000 موقع آخر" 
      }, { status: 400 });
    }
    
    if (error.message?.includes("Video unavailable")) {
      return NextResponse.json({ 
        error: "❌ هذا الفيديو غير متاح (قد يكون خاصاً أو محذوفاً)" 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: "خطأ في السيرفر ⚠️ تأكد من تثبيت yt-dlp على الخادم" 
    }, { status: 500 });
  }
}