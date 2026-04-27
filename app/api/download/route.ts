import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });

    // ===== TikTok =====
    if (url.includes("tiktok.com")) {
      const res = await fetch("https://tikwm.com/api/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `url=${encodeURIComponent(url)}&hd=1`,
      });
      const data = await res.json();
      if (data.code === 0 && data.data?.play) {
        return NextResponse.json({ downloadUrl: data.data.hdplay || data.data.play });
      }
      throw new Error("تعذر تنزيل TikTok");
    }

    // ===== YouTube & YouTube Shorts =====
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      // محاولة 1: cobalt.tools API (مجاني)
      try {
        const cobaltRes = await fetch("https://api.cobalt.tools/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            url: url,
            videoQuality: "720",
            filenameStyle: "basic",
          }),
        });
        const cobaltData = await cobaltRes.json();
        if (cobaltData?.url) {
          return NextResponse.json({ downloadUrl: cobaltData.url });
        }
      } catch (_) {}

      // محاولة 2: yt-dlp عبر API عام
      try {
        const ytdlRes = await fetch(
          `https://yt-dlp-api.vercel.app/api/info?url=${encodeURIComponent(url)}`
        );
        const ytdlData = await ytdlRes.json();
        const formats = ytdlData?.formats || [];
        const mp4 = formats
          .filter((f: any) => f.ext === "mp4" && f.vcodec !== "none")
          .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));
        if (mp4[0]?.url) {
          return NextResponse.json({ downloadUrl: mp4[0].url });
        }
      } catch (_) {}

      // محاولة 3: y2mate API
      try {
        const videoId = url.match(
          /(?:v=|shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/
        )?.[1];
        if (videoId) {
          const y2Res = await fetch("https://www.y2mate.com/mates/analyzeV2/ajax", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `k_query=https://www.youtube.com/watch?v=${videoId}&k_page=home&hl=en&q_auto=0`,
          });
          const y2Data = await y2Res.json();
          const links = y2Data?.links?.mp4;
          if (links) {
            const best = Object.values(links).find((l: any) => l.q === "720p") as any
              || Object.values(links)[0] as any;
            if (best?.k) {
              const convertRes = await fetch("https://www.y2mate.com/mates/convertV2/index", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `vid=${videoId}&k=${best.k}`,
              });
              const convertData = await convertRes.json();
              if (convertData?.dlink) {
                return NextResponse.json({ downloadUrl: convertData.dlink });
              }
            }
          }
        }
      } catch (_) {}

      throw new Error("تعذر تنزيل الفيديو من YouTube. جرب رابطاً آخر");
    }

    // ===== Instagram =====
    if (url.includes("instagram.com")) {
      try {
        const igRes = await fetch(
          `https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index?url=${encodeURIComponent(url)}`,
          {
            headers: {
              "x-rapidapi-key": process.env.RAPIDAPI_KEY || "",
              "x-rapidapi-host":
                "instagram-downloader-download-instagram-videos-stories.p.rapidapi.com",
            },
          }
        );
        const igData = await igRes.json();
        if (igData?.media) {
          return NextResponse.json({ downloadUrl: igData.media });
        }
      } catch (_) {}

      // بديل مجاني
      const igRes2 = await fetch("https://igdownloader.app/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const igData2 = await igRes2.json();
      if (igData2?.url) {
        return NextResponse.json({ downloadUrl: igData2.url });
      }
      throw new Error("تعذر تنزيل من Instagram");
    }

    // ===== Facebook =====
    if (url.includes("facebook.com") || url.includes("fb.watch")) {
      const fbRes = await fetch(
        `https://facebook-video-downloader6.p.rapidapi.com/fbdown/getLinks?url=${encodeURIComponent(url)}`,
        {
          headers: {
            "x-rapidapi-key": process.env.RAPIDAPI_KEY || "",
            "x-rapidapi-host": "facebook-video-downloader6.p.rapidapi.com",
          },
        }
      );
      const fbData = await fbRes.json();
      const videoUrl = fbData?.HD || fbData?.SD;
      if (videoUrl) return NextResponse.json({ downloadUrl: videoUrl });
      throw new Error("تعذر تنزيل من Facebook");
    }

    // ===== Twitter/X =====
    if (url.includes("twitter.com") || url.includes("x.com")) {
      const twRes = await fetch(
        `https://twitter-api45.p.rapidapi.com/tweet.php?id=${url.split("/").pop()?.split("?")[0]}`,
        {
          headers: {
            "x-rapidapi-key": process.env.RAPIDAPI_KEY || "",
            "x-rapidapi-host": "twitter-api45.p.rapidapi.com",
          },
        }
      );
      const twData = await twRes.json();
      const variants = twData?.media?.video?.[0]?.variants;
      if (variants?.length) {
        const best = variants
          .filter((v: any) => v.content_type === "video/mp4")
          .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
        if (best?.url) return NextResponse.json({ downloadUrl: best.url });
      }
      throw new Error("تعذر تنزيل من Twitter/X");
    }

    throw new Error("المنصة غير مدعومة");
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}