import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });
    }

    // استخدام SaveFrom API
    const encoded = encodeURIComponent(url);
    const res = await fetch(
      `https://worker.sf-tools.com/savefrom.php?sf_url=${encoded}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://en.savefrom.net/",
        },
      }
    );

    const data = await res.json();

    if (!data.url || data.url.length === 0) {
      return NextResponse.json(
        { error: "تعذر تنزيل الرابط. جرب رابطاً آخر" },
        { status: 400 }
      );
    }

    // أفضل جودة متاحة
    const best = data.url.find((u: any) =>
      u.type?.includes("mp4") && u.id?.includes("137")
    ) || data.url[0];

    return NextResponse.json({
      downloadUrl: best.url,
      title: data.title || "فيديو",
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}