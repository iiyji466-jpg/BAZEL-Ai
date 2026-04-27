import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });

    const key = process.env.RAPIDAPI_KEY;
    if (!key) return NextResponse.json({ error: "مفتاح API غير موجود" }, { status: 500 });

    // ===== TikTok (مجاني بدون RapidAPI) =====
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

    // ===== Instagram =====
    if (url.includes("instagram.com")) {
      const res = await fetch(
        `https://instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com/get-info-rapidapi?url=${encodeURIComponent(url)}`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-key": key,
            "x-rapidapi-host": "instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com",
          },
        }
      );
      const data = await res.json();
      console.log("Instagram response:", JSON.stringify(data));

      const videoUrl =
        data?.video_url ||
        data?.url ||
        data?.[0]?.url ||
        data?.media?.[0]?.url;

      if (videoUrl) return NextResponse.json({ downloadUrl: videoUrl });
      throw new Error("تعذر تنزيل من Instagram");
    }

    // ===== YouTube & Shorts =====
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const res = await fetch(
        `https://youtube-video-fast-downloader.p.rapidapi.com/dl?id=${encodeURIComponent(url)}`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-key": key,
            "x-rapidapi-host": "youtube-video-fast-downloader.p.rapidapi.com",
          },
        }
      );
      const data = await res.json();
      console.log("YouTube response:", JSON.stringify(data));

      const videoUrl =
        data?.url ||
        data?.link ||
        data?.download_url ||
        data?.formats?.find((f: any) => f.ext === "mp4")?.url;

      if (videoUrl) return NextResponse.json({ downloadUrl: videoUrl });
      throw new Error("تعذر تنزيل من YouTube");
    }

    // ===== Facebook =====
    if (url.includes("facebook.com") || url.includes("fb.watch")) {
      const res = await fetch(
        `https://facebook-video-downloader6.p.rapidapi.com/fbdown/getLinks?url=${encodeURIComponent(url)}`,
        {
          headers: {
            "x-rapidapi-key": key,
            "x-rapidapi-host": "facebook-video-downloader6.p.rapidapi.com",
          },
        }
      );
      const data = await res.json();
      const videoUrl = data?.HD || data?.SD;
      if (videoUrl) return NextResponse.json({ downloadUrl: videoUrl });
      throw new Error("تعذر تنزيل من Facebook");
    }

    // ===== Twitter/X =====
    if (url.includes("twitter.com") || url.includes("x.com")) {
      const tweetId = url.split("/").pop()?.split("?")[0];
      const res = await fetch(
        `https://twitter-api45.p.rapidapi.com/tweet.php?id=${tweetId}`,
        {
          headers: {
            "x-rapidapi-key": key,
            "x-rapidapi-host": "twitter-api45.p.rapidapi.com",
          },
        }
      );
      const data = await res.json();
      const variants = data?.media?.video?.[0]?.variants;
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