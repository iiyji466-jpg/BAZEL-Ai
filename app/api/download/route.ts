import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });
    }

    const platform = detectPlatform(url);

    // ===== TikTok =====
    if (platform === "tiktok") {
      const res = await fetch("https://www.tikwm.com/api/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `url=${encodeURIComponent(url)}&hd=1`,
      });
      const data = await res.json();
      if (data.code === 0 && data.data?.play) {
        return NextResponse.json({
          downloadUrl: data.data.hdplay || data.data.play,
          title: data.data.title,
          thumbnail: data.data.cover,
          platform,
        });
      }
    }

    // ===== Instagram =====
    if (platform === "instagram") {
      const res = await fetch(
        `https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index?url=${encodeURIComponent(url)}`,
        {
          headers: {
            "x-rapidapi-key": process.env.RAPIDAPI_KEY || "",
            "x-rapidapi-host": "instagram-downloader-download-instagram-videos-stories.p.rapidapi.com",
          },
        }
      );
      const data = await res.json();
      if (data.media) {
        return NextResponse.json({ downloadUrl: data.media, platform });
      }
    }

    // ===== YouTube =====
    if (platform === "youtube") {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        // الخطوة 1: احصل على معلومات الفيديو
        const analyzeRes = await fetch("https://www.y2mate.com/mates/analyzeV2/ajax", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `k_query=${encodeURIComponent(url)}&k_page=home&hl=en&q_auto=0`,
        });
        const analyzeData = await analyzeRes.json();
        const key = analyzeData?.links?.mp4?.["137"]?.k || 
                    analyzeData?.links?.mp4?.["22"]?.k;

        if (key) {
          // الخطوة 2: احصل على رابط التحميل
          const convertRes = await fetch("https://www.y2mate.com/mates/convertV2/index", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `vid=${videoId}&k=${key}`,
          });
          const convertData = await convertRes.json();
          if (convertData?.dlink) {
            return NextResponse.json({
              downloadUrl: convertData.dlink,
              title: analyzeData.title,
              platform,
            });
          }
        }
      }
    }

    // ===== Twitter/X =====
    if (platform === "twitter") {
      const res = await fetch(
        `https://twitsave.com/info?url=${encodeURIComponent(url)}`
      );
      const text = await res.text();
      const match = text.match(/https:\/\/video\.twimg\.com[^"]+\.mp4[^"]*/);
      if (match) {
        return NextResponse.json({ downloadUrl: match[0], platform });
      }
    }

    return NextResponse.json(
      { error: "تعذر تنزيل الرابط، تأكد أن الرابط صحيح" },
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
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  return "unknown";
}

function extractYouTubeId(url: string): string | null {
  if (url.includes("/shorts/")) return url.split("/shorts/")[1]?.split("?")[0];
  if (url.includes("watch?v=")) return url.split("watch?v=")[1]?.split("&")[0];
  if (url.includes("youtu.be/")) return url.split("youtu.be/")[1]?.split("?")[0];
  return null;
}