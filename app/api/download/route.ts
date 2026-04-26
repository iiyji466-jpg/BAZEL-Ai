import { NextRequest, NextResponse } from "next/server";

function detectPlatform(url: string): string {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/tiktok\.com/.test(url)) return "tiktok";
  if (/instagram\.com/.test(url)) return "instagram";
  if (/facebook\.com|fb\.watch/.test(url)) return "facebook";
  if (/twitter\.com|x\.com/.test(url)) return "twitter";
  if (/twitch\.tv/.test(url)) return "twitch";
  if (/vimeo\.com/.test(url)) return "vimeo";
  if (/reddit\.com/.test(url)) return "reddit";
  if (/soundcloud\.com/.test(url)) return "soundcloud";
  return "unknown";
}

// ===== cobalt.tools - يدعم 20+ منصة =====
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
    });

    const data = await res.json();
    const link = data?.url || data?.stream || null;
    return link?.startsWith("http") ? link : null;
  } catch (e) {
    console.log("cobalt failed:", e);
    return null;
  }
}

// ===== tikwm - تيك توك + انستغرام + يوتيوب =====
async function tryTikwm(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const data = await res.json();
    if (data.code === 0 && data.data) {
      const link = data.data.hdplay || data.data.play || data.data.wmplay;
      return link?.startsWith("http") ? link : null;
    }
    return null;
  } catch (e) {
    console.log("tikwm failed:", e);
    return null;
  }
}

// ===== SnapSave - انستغرام + فيسبوك =====
async function trySnapSave(url: string): Promise<string | null> {
  try {
    const res = await fetch("https://snapsave.app/action.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://snapsave.app/",
      },
      body: `url=${encodeURIComponent(url)}`,
    });
    const data = await res.json();
    const link = data?.data?.[0]?.url || data?.url || null;
    return link?.startsWith("http") ? link : null;
  } catch (e) {
    console.log("snapsave failed:", e);
    return null;
  }
}

// ===== SaveFrom - يوتيوب + فيسبوك + انستغرام =====
async function trySaveFrom(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://worker.sf-tools.com/savefrom.php?sf_url=${encodeURIComponent(url)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://en.savefrom.net/",
        },
      }
    );
    const data = await res.json();
    const link = data?.url?.[0]?.url || data?.urls?.[0]?.url || null;
    return link?.startsWith("http") ? link : null;
  } catch (e) {
    console.log("savefrom failed:", e);
    return null;
  }
}

// ===== yt1s - يوتيوب فقط =====
async function tryYt1s(url: string): Promise<string | null> {
  try {
    const r1 = await fetch("https://yt1s.is/api/ajaxSearch/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
      },
      body: `q=${encodeURIComponent(url)}&vt=homevideo`,
    });
    const d1 = await r1.json();
    if (!d1?.vid || !d1?.kc) return null;

    const r2 = await fetch("https://yt1s.is/api/ajaxConvert/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
      },
      body: `vid=${d1.vid}&k=${d1.kc}`,
    });
    const d2 = await r2.json();
    const link = d2?.dlink;
    return link?.startsWith("http") ? link : null;
  } catch (e) {
    console.log("yt1s failed:", e);
    return null;
  }
}

// ===== API الرئيسي =====
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url?.trim()) {
      return NextResponse.json(
        { error: "الرجاء إدخال رابط صحيح" },
        { status: 400 }
      );
    }

    const cleanUrl = url.trim();
    const platform = detectPlatform(cleanUrl);
    console.log(`[download] platform: ${platform}`);

    let downloadUrl: string | null = null;

    if (platform === "youtube") {
      downloadUrl =
        (await tryCobalt(cleanUrl)) ||
        (await tryYt1s(cleanUrl)) ||
        (await trySaveFrom(cleanUrl));

    } else if (platform === "tiktok") {
      downloadUrl =
        (await tryTikwm(cleanUrl)) ||
        (await tryCobalt(cleanUrl));

    } else if (platform === "instagram") {
      downloadUrl =
        (await tryCobalt(cleanUrl)) ||
        (await tryTikwm(cleanUrl)) ||
        (await trySnapSave(cleanUrl));

    } else if (platform === "facebook") {
      downloadUrl =
        (await tryCobalt(cleanUrl)) ||
        (await trySnapSave(cleanUrl)) ||
        (await trySaveFrom(cleanUrl));

    } else if (platform === "twitter") {
      downloadUrl =
        (await tryCobalt(cleanUrl)) ||
        (await trySaveFrom(cleanUrl));

    } else {
      // أي منصة أخرى: vimeo, twitch, reddit, soundcloud...
      downloadUrl =
        (await tryCobalt(cleanUrl)) ||
        (await tryTikwm(cleanUrl)) ||
        (await trySaveFrom(cleanUrl));
    }

    if (!downloadUrl) {
      return NextResponse.json(
        {
          error: "تعذر تحميل الفيديو من هذا الرابط. جرب رابطاً آخر",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, downloadUrl });

  } catch (error) {
    console.error("Download API error:", error);
    return NextResponse.json(
      { error: "خطأ في السيرفر ⚠️" },
      { status: 500 }
    );
  }
}