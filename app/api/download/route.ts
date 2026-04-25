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
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({
        url: url,
        videoQuality: "720",
        filenameStyle: "pretty",
        downloadMode: "auto",
      }),
    });

    const data = await response.json();

    console.log("Cobalt response:", JSON.stringify(data));

    if (data.status === "error" || data.status === "rate-limit") {
      return NextResponse.json(
        { error: data?.error?.code || "تعذر تنزيل الرابط" },
        { status: 400 }
      );
    }

    const downloadUrl = data.url || data.tunnel;

    if (!downloadUrl) {
      return NextResponse.json(
        { error: "لم يتم العثور على رابط" },
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