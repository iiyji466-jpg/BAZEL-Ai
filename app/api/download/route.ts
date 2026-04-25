import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });
    }

    const response = await fetch(
      `https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=${encodeURIComponent(url)}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
          "x-rapidapi-host": "social-media-video-downloader.p.rapidapi.com",
        },
      }
    );

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json(
        { error: "تعذر تنزيل الرابط" },
        { status: 400 }
      );
    }

    // أخذ أفضل جودة متاحة
    const links = data.links;
    const best = links.find((l: any) => l.quality === "hd") || links[0];

    return NextResponse.json({ downloadUrl: best.link });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
