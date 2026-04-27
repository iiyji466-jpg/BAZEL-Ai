import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });

    const key = process.env.RAPIDAPI_KEY;
    if (!key) return NextResponse.json({ error: "مفتاح API غير موجود" }, { status: 500 });

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

    // ===== Instagram =====
    if (url.includes("instagram.com")) {
      // محاولة 1: API الأول
      try {
        const res = await fetch(
          "https://instagram-scraper-api2.p.rapidapi.com/v1/post_info?code_or_id_or_url=" +
            encodeURIComponent(url),
          {
            headers: {
              "x-rapidapi-key": key,
              "x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com",
            },
          }
        );
        const data = await res.json();
        console.log("IG API1:", JSON.stringify(data).slice(0, 300));

        const videoUrl =
          data?.data?.video_url ||
          data?.data?.versions?.items?.[0]?.url ||
          data?.data?.carousel_media?.[0]?.video_versions?.[0]?.url;

        if (videoUrl) return NextResponse.json({ downloadUrl: videoUrl });
      } catch (_) {}

      // محاولة 2: API الثاني
      try {
        const res = await fetch(
          "https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=" +
            encodeURIComponent(url),
          {
            headers: {
              "x-rapidapi-key": key,
              "x-rapidapi-host": "social-media-video-downloader.p.rapidapi.com",
            },
          }
        );
        const data = await res.json();
        console.log("IG API2:", JSON.stringify(data).slice(0, 300));

        const links = data?.links;
        if (links?.length) {
          const video = links.find((l: any) =>
            l.quality?.includes("720") || l.quality?.includes("hd") || l.type === "mp4"
          ) || links[0];
          if (video?.link) return NextResponse.json({ downloadUrl: video.link });
        }
      } catch (_) {}

      // محاولة 3: API الثالث
      try {
        const res = await fetch(
          "https://all-in-one-social-media-downloader.p.rapidapi.com/downloader?url=" +
            encodeURIComponent(url),
          {
            headers: {
              "x-rapidapi-key": key,
              "x-rapidapi-host": "all-in-one-social-media-downloader.p.rapidapi.com",
            },
          }
        );
        const data = await res.json();
        console.log("IG API3:", JSON.stringify(data).slice(0, 300));

        const media = data?.medias || data?.data;
        if (Array.isArray(media) && media.length) {
          const video = media.find((m: any) => m.type === "video" || m.extension === "mp4");
          if (video?.url) return NextResponse.json({ downloadUrl: video.url });
        }
      } catch (_) {}

      throw new Error("تعذر تنزيل من Instagram. تأكد أن المنشور عام");
    }

    // ===== YouTube & Shorts =====
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const res = await fetch(
        "https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=" +
          encodeURIComponent(url),
        {
          headers: {
            "x-rapidapi-key": key,
            "x-rapidapi-host": "social-media-video-downloader.p.rapidapi.com",
          },
        }
      );
      const data = await res.json();
      const links = data?.links;
      if (links?.length) {
        const video =
          links.find((l: any) => l.quality === "720p") ||
          links.find((l: any) => l.quality === "480p") ||
          links[0];
        if (video?.link) return NextResponse.json({ downloadUrl: video.link });
      }
      throw new Error("تعذر تنزيل من YouTube");
    }

    // ===== Facebook =====
    if (url.includes("facebook.com") || url.includes("fb.watch")) {
      const res = await fetch(
        "https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=" +
          encodeURIComponent(url),
        {
          headers: {
            "x-rapidapi-key": key,
            "x-rapidapi-host": "social-media-video-downloader.p.rapidapi.com",
          },
        }
      );
      const data = await res.json();
      const links = data?.links;
      if (links?.length) {
        const video = links.find((l: any) => l.quality?.includes("hd")) || links[0];
        if (video?.link) return NextResponse.json({ downloadUrl: video.link });
      }
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