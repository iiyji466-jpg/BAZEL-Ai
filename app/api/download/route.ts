import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });
    }

    const response = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        url,
        videoQuality: "1080",
        filenameStyle: "pretty",
      }),
    });

    const data = await response.json();

    if (data.status === "error") {
      return NextResponse.json(
        { error: "تعذر تنزيل الرابط" },
        { status: 400 }
      );
    }

    const downloadUrl = data.url || data.tunnel;

    if (!downloadUrl) {
      return NextResponse.json(
        { error: "لم يتم العثور على رابط التحميل" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      downloadUrl,
      platform: detectPlatform(url),
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}

function detectPlatform(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("facebook.com") || url.includes("fb.watch")) return "facebook";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  return "unknown";
}