import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    const key = process.env.RAPIDAPI_KEY!;

    if (!url) {
      return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });
    }

    // ===== Instagram =====
    if (url.includes("instagram.com")) {
      try {
        const res = await fetch(
          "https://instagram-bulk-profile-scrapper.p.rapidapi.com/clients/api/ig/media_by_url?url=" +
            encodeURIComponent(url),
          {
            headers: {
              "x-rapidapi-key": key,
              "x-rapidapi-host": "instagram-bulk-profile-scrapper.p.rapidapi.com",
            },
          }
        );
        const data = await res.json();
        const item = data?.data?.xdt_shortcode_media || data?.items?.[0] || data?.[0];
        const videoUrl =
          item?.video_url ||
          item?.video_versions?.[0]?.url ||
          item?.carousel_media?.[0]?.video_versions?.[0]?.url ||
          data?.video_url;
        if (videoUrl) return NextResponse.json({ downloadUrl: videoUrl });
      } catch (e) {
        console.log("IG API1 failed:", e);
      }

      try {
        const res = await fetch(
          "https://instagram-looter2.p.rapidapi.com/post?link=" +
            encodeURIComponent(url),
          {
            headers: {
              "x-rapidapi-key": key,
              "x-rapidapi-host": "instagram-looter2.p.rapidapi.com",
            },
          }
        );
        const data = await res.json();
        const videoUrl =
          data?.media?.[0]?.url ||
          data?.url ||
          data?.video_url ||
          data?.[0]?.url;
        if (videoUrl) return NextResponse.json({ downloadUrl: videoUrl });
      } catch (e) {
        console.log("IG API2 failed:", e);
      }

      try {
        const res = await fetch(
          "https://reel-download.p.rapidapi.com/insta?url=" +
            encodeURIComponent(url),
          {
            headers: {
              "x-rapidapi-key": key,
              "x-rapidapi-host": "reel-download.p.rapidapi.com",
            },
          }
        );
        const data = await res.json();
        const videoUrl = data?.download_url || data?.url || data?.video;
        if (videoUrl) return NextResponse.json({ downloadUrl: videoUrl });
      } catch (e) {
        console.log("IG API3 failed:", e);
      }

      return NextResponse.json(
        { error: "تعذر تنزيل من Instagram. تأكد أن المنشور عام" },
        { status: 400 }
      );
    }

    // ===== YouTube =====
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      try {
        const res = await fetch(
          "https://youtube-media-downloader.p.rapidapi.com/v2/video/details?videoId=" +
            extractYouTubeId(url),
          {
            headers: {
              "x-rapidapi-key": key,
              "x-rapidapi-host": "youtube-media-downloader.p.rapidapi.com",
            },
          }
        );
        const data = await res.json();
        const videoUrl = data?.videos?.items?.[0]?.url;
        if (videoUrl) return NextResponse.json({ downloadUrl: videoUrl });
      } catch (e) {
        console.log("YT failed:", e);
      }

      return NextResponse.json(
        { error: "تعذر تنزيل من YouTube" },
        { status: 400 }
      );
    }

    // ===== TikTok =====
    if (url.includes("tiktok.com")) {
      try {
        const res = await fetch(
          "https://tiktok-download-without-watermark.p.rapidapi.com/analysis?url=" +
            encodeURIComponent(url) +
            "&hd=1",
          {
            headers: {
              "x-rapidapi-key": key,
              "x-rapidapi-host": "tiktok-download-without-watermark.p.rapidapi.com",
            },
          }
        );
        const data = await res.json();
        const videoUrl = data?.data?.hdplay || data?.data?.play;
        if (videoUrl) return NextResponse.json({ downloadUrl: videoUrl });
      } catch (e) {
        console.log("TikTok failed:", e);
      }

      return NextResponse.json(
        { error: "تعذر تنزيل من TikTok" },
        { status: 400 }
      );
    }

    // ===== Facebook =====
    if (url.includes("facebook.com") || url.includes("fb.watch")) {
      try {
        const res = await fetch(
          "https://facebook-video-and-reels-downloader.p.rapidapi.com/app/main.php?url=" +
            encodeURIComponent(url),
          {
            headers: {
              "x-rapidapi-key": key,
              "x-rapidapi-host": "facebook-video-and-reels-downloader.p.rapidapi.com",
            },
          }
        );
        const data = await res.json();
        const videoUrl = data?.hd || data?.sd || data?.url;
        if (videoUrl) return NextResponse.json({ downloadUrl: videoUrl });
      } catch (e) {
        console.log("FB failed:", e);
      }

      return NextResponse.json(
        { error: "تعذر تنزيل من Facebook" },
        { status: 400 }
      );
    }

    // ===== Twitter/X =====
    if (url.includes("twitter.com") || url.includes("x.com")) {
      try {
        const res = await fetch(
          "https://twitter-api45.p.rapidapi.com/tweet.php?id=" +
            extractTwitterId(url),
          {
            headers: {
              "x-rapidapi-key": key,
              "x-rapidapi-host": "twitter-api45.p.rapidapi.com",
            },
          }
        );
        const data = await res.json();
        const videoUrl = data?.media?.video?.[0]?.media_url_https || 
                         data?.videos?.[0]?.url;
        if (videoUrl) return NextResponse.json({ downloadUrl: videoUrl });
      } catch (e) {
        console.log("Twitter failed:", e);
      }

      return NextResponse.json(
        { error: "تعذر تنزيل من Twitter/X" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "منصة غير مدعومة" },
      { status: 400 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}

// Helper functions
function extractYouTubeId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/);
  return match?.[1] || "";
}

function extractTwitterId(url: string): string {
  const match = url.match(/status\/(\d+)/);
  return match?.[1] || "";
}