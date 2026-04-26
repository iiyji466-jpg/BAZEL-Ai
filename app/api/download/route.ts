import { NextRequest, NextResponse } from "next/server";

// ============================================================
// تحديد المنصة من الرابط
// ============================================================
function detectPlatform(url: string): string {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/tiktok\.com/.test(url)) return "tiktok";
  if (/instagram\.com/.test(url)) return "instagram";
  if (/facebook\.com|fb\.watch/.test(url)) return "facebook";
  if (/twitter\.com|x\.com/.test(url)) return "twitter";
  if (/vimeo\.com/.test(url)) return "vimeo";
  if (/twitch\.tv/.test(url)) return "twitch";
  if (/reddit\.com/.test(url)) return "reddit";
  return "unknown";
}

// ============================================================
// 1. RapidAPI - ytdl-free (يوتيوب + كل المنصات)
// المفتاح: RAPIDAPI_KEY في Vercel Environment Variables
// ============================================================
async function tryRapidAPI(url: string): Promise<string | null> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    console.log("❌ RAPIDAPI_KEY غير موجود في Environment Variables");
    return null;
  }

  try {
    const res = await fetch(
      `https://ytdl-free.p.rapidapi.com/dl?url=${encodeURIComponent(url)}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": "ytdl-free.p.rapidapi.com",
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    const data = await res.json();
    console.log("RapidAPI response:", JSON.stringify(data).slice(0, 200));

    // استخراج رابط التحميل من أي شكل للرد
    const link =
      data?.url ||
      data?.download_url ||
      data?.link ||
      data?.formats?.[0]?.url ||
      data?.video?.url ||
      data?.data?.url ||
      null;

    return typeof link === "string" && link.startsWith("http") ? link : null;
  } catch (e) {
    console.log("RapidAPI failed:", e);
    return null;
  }
}

// ============================================================
// 2. RapidAPI - all-social-downloader (بديل)
// اشترك أيضاً في: https://rapidapi.com/social-download-api/api/all-social-downloader
// ============================================================
async function tryAllSocialDownloader(url: string): Promise<string | null> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      `https://all-social-downloader.p.rapidapi.com/download?url=${encodeURIComponent(url)}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": "all-social-downloader.p.rapidapi.com",
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    const data = await res.json();
    console.log("AllSocial response:", JSON.stringify(data).slice(0, 200));

    const link =
      data?.data?.[0]?.url ||
      data?.medias?.[0]?.url ||
      data?.url ||
      null;

    return typeof link === "string" && link.startsWith("http") ? link : null;
  } catch (e) {
    console.log("AllSocialDownloader failed:", e);
    return null;
  }
}

// ============================================================
// 3. tikwm - تيك توك بدون مفتاح (موثوق جداً)
// ============================================================
async function tryTikwm(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(10000),
      }
    );
    const data = await res.json();

    if (data.code === 0 && data.data) {
      const link = data.data.hdplay || data.data.play || data.data.wmplay;
      return typeof link === "string" && link.startsWith("http") ? link : null;
    }
    return null;
  } catch (e) {
    console.log("tikwm failed:", e);
    return null;
  }
}

// ============================================================
// 4. cobalt.tools - مجاني بدون مفتاح
// ============================================================
async function tryCobalt(url: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        url,
        videoQuality: "720",
        filenameStyle: "basic",
        downloadMode: "auto",
      }),
      signal: AbortSignal.timeout(12000),
    });

    const data = await res.json();
    const link = data?.url || data?.stream || null;
    return typeof link === "string" && link.startsWith("http") ? link : null;
  } catch (e) {
    console.log("cobalt failed:", e);
    return null;
  }
}

// ============================================================
// API الرئيسي - يجرب كل الطرق بالترتيب
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url?.trim();

    if (!url) {
      return NextResponse.json(
        { error: "الرجاء إدخال رابط صحيح" },
        { status: 400 }
      );
    }

    const platform = detectPlatform(url);
    console.log(`\n[download] platform: ${platform}`);
    console.log(`[download] url: ${url}`);
    console.log(`[download] RAPIDAPI_KEY موجود: ${!!process.env.RAPIDAPI_KEY}`);

    let downloadUrl: string | null = null;

    if (platform === "tiktok") {
      // تيك توك: tikwm الأقوى ثم RapidAPI
      downloadUrl =
        (await tryTikwm(url)) ||
        (await tryRapidAPI(url)) ||
        (await tryAllSocialDownloader(url)) ||
        (await tryCobalt(url));

    } else if (platform === "youtube") {
      // يوتيوب: RapidAPI أولاً ثم cobalt
      downloadUrl =
        (await tryRapidAPI(url)) ||
        (await tryAllSocialDownloader(url)) ||
        (await tryCobalt(url));

    } else {
      // بقية المنصات: RapidAPI أولاً
      downloadUrl =
        (await tryRapidAPI(url)) ||
        (await tryAllSocialDownloader(url)) ||
        (await tryTikwm(url)) ||
        (await tryCobalt(url));
    }

    if (!downloadUrl) {
      const noKey = !process.env.RAPIDAPI_KEY;
      return NextResponse.json(
        {
          error: noKey
            ? "⚠️ أضف RAPIDAPI_KEY في Vercel Environment Variables"
            : "تعذر تحميل الفيديو. جرب رابطاً آخر",
        },
        { status: 400 }
      );
    }

    console.log(`[download] ✅ نجح: ${downloadUrl.slice(0, 80)}...`);
    return NextResponse.json({ success: true, downloadUrl });

  } catch (error) {
    console.error("Download API error:", error);
    return NextResponse.json(
      { error: "خطأ في السيرفر ⚠️" },
      { status: 500 }
    );
  }
}