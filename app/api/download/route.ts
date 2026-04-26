// app/api/download/route.js
import { NextRequest, NextResponse } from "next/server";

// تكوين Vercel: زيادة timeout إلى 60 ثانية كحد أقصى
export const maxDuration = 60; // Vercel Pro: حتى 300 ثانية
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });

    const key = process.env.RAPIDAPI_KEY;
    if (!key) return NextResponse.json({ error: "مفتاح API غير موجود" }, { status: 500 });

    // تحديد المنصة
    const platform = detectPlatform(url);
    let result = null;

    switch (platform) {
      case 'tiktok':
        result = await downloadTikTok(url);
        break;
      case 'youtube':
        result = await downloadYouTube(url, key);
        break;
      case 'instagram':
        result = await downloadInstagram(url, key);
        break;
      case 'twitter':
        result = await downloadTwitter(url, key);
        break;
      case 'facebook':
        result = await downloadFacebook(url, key);
        break;
      default:
        // للمنصات الأخرى - استخدام خدمة عامة
        result = await downloadGeneral(url, key);
    }

    if (result?.downloadUrl) {
      return NextResponse.json(result);
    }

    throw new Error("تعذر تنزيل الفيديو من هذا الرابط");

  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ" },
      { status: 500 }
    );
  }
}

// تحديد نوع المنصة
function detectPlatform(url) {
  if (url.includes("tiktok.com")) return 'tiktok';
  if (url.includes("youtube.com") || url.includes("youtu.be")) return 'youtube';
  if (url.includes("instagram.com")) return 'instagram';
  if (url.includes("twitter.com") || url.includes("x.com")) return 'twitter';
  if (url.includes("facebook.com") || url.includes("fb.watch")) return 'facebook';
  return 'other';
}

// TikTok - مجاني ولا يحتاج API Key
async function downloadTikTok(url) {
  const response = await fetch("https://tikwm.com/api/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `url=${encodeURIComponent(url)}&hd=1`,
  });
  
  const data = await response.json();
  
  if (data.code === 0 && data.data?.play) {
    return {
      downloadUrl: data.data.hdplay || data.data.play,
      platform: 'tiktok',
      title: data.data.title
    };
  }
  return null;
}

// YouTube مع RapidAPI
async function downloadYouTube(url, key) {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  const response = await fetch(
    `https://yt-api.p.rapidapi.com/dl?id=${videoId}`,
    {
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "yt-api.p.rapidapi.com",
      },
    }
  );
  
  const data = await response.json();
  const formats = (data.formats || []).filter(
    (f) => f.mimeType?.includes("video/mp4") && f.url
  );
  
  if (formats.length > 0) {
    const best = formats.find((f) => f.qualityLabel === "720p") || formats[0];
    return {
      downloadUrl: best.url,
      platform: 'youtube',
      title: data.title,
      quality: best.qualityLabel
    };
  }
  return null;
}

// Instagram مع RapidAPI
async function downloadInstagram(url, key) {
  const response = await fetch(
    `https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index?url=${encodeURIComponent(url)}`,
    {
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "instagram-downloader-download-instagram-videos-stories.p.rapidapi.com",
      },
    }
  );
  
  const data = await response.json();
  
  if (data.media) {
    return {
      downloadUrl: data.media,
      platform: 'instagram',
      title: data.title
    };
  }
  return null;
}

// Twitter مع RapidAPI
async function downloadTwitter(url, key) {
  const response = await fetch(
    `https://twitter-video-downloader1.p.rapidapi.com/api/download?url=${encodeURIComponent(url)}`,
    {
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "twitter-video-downloader1.p.rapidapi.com",
      },
    }
  );
  
  const data = await response.json();
  
  if (data.url) {
    return {
      downloadUrl: data.url,
      platform: 'twitter'
    };
  }
  return null;
}

// Facebook مع RapidAPI
async function downloadFacebook(url, key) {
  const response = await fetch(
    `https://facebook-video-downloader1.p.rapidapi.com/api/download?url=${encodeURIComponent(url)}`,
    {
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "facebook-video-downloader1.p.rapidapi.com",
      },
    }
  );
  
  const data = await response.json();
  
  if (data.url) {
    return {
      downloadUrl: data.url,
      platform: 'facebook'
    };
  }
  return null;
}

// تحميل عام لأي منصة
async function downloadGeneral(url, key) {
  // يمكنك استخدام خدمة عامة مثل all-in-one
  const response = await fetch(
    `https://all-in-one-video-downloader.p.rapidapi.com/download?url=${encodeURIComponent(url)}`,
    {
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "all-in-one-video-downloader.p.rapidapi.com",
      },
      signal: AbortSignal.timeout(8000) // timeout 8 ثواني
    }
  );
  
  if (!response.ok) return null;
  
  const data = await response.json();
  
  return {
    downloadUrl: data.download_url || data.url,
    platform: 'other'
  };
}

// استخراج ID من رابط YouTube
function extractYouTubeId(url) {
  const patterns = [
    /(?:v=|youtu\.be\/)([^&?/]+)/,
    /youtube\.com\/embed\/([^/?]+)/,
    /youtube\.com\/v\/([^/?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}