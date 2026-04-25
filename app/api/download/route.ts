import { NextRequest, NextResponse } from "next/server";

// instances مجانية بديلة لـ cobalt
const COBALT_INSTANCES = [
  "https://cobalt.api.lostfiles.org",
  "https://dwnld.nichlov.com",
  "https://cobalt.tools.yt",
];

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });
    }

    // جرب كل instance حتى يشتغل واحد
    for (const instance of COBALT_INSTANCES) {
      try {
        const response = await fetch(`${instance}/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            url,
            videoQuality: "720",
            filenameStyle: "pretty",
            downloadMode: "auto",
          }),
          signal: AbortSignal.timeout(8000),
        });

        const data = await response.json();
        console.log(`${instance} response:`, JSON.stringify(data));

        if (data.status === "tunnel" || data.status === "redirect") {
          const downloadUrl = data.url || data.tunnel;
          if (downloadUrl) {
            return NextResponse.json({
              downloadUrl,
              platform: detectPlatform(url),
            });
          }
        }
      } catch (e) {
        console.log(`${instance} failed, trying next...`);
        continue;
      }
    }

    return NextResponse.json(
      { error: "تعذر تنزيل الرابط، جرب لاحقاً" },
      { status: 400 }
    );

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