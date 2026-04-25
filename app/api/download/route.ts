import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });
    }

    const response = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({
        url: url,
        videoQuality: "720",
        audioFormat: "mp3",
        filenameStyle: "pretty",
        downloadMode: "auto",
      }),
    });

    const data = await response.json();

    // إذا رجع رابط مباشر
    if (data.status === "stream" || data.status === "redirect") {
      return NextResponse.json({ downloadUrl: data.url });
    }

    // إذا رجع tunnel
    if (data.status === "tunnel") {
      return NextResponse.json({ downloadUrl: data.url });
    }

    // إذا رجع picker (منصات تحتوي أكثر من ملف)
    if (data.status === "picker") {
      return NextResponse.json({ downloadUrl: data.picker[0]?.url });
    }

    return NextResponse.json(
      { error: data.error?.code || "تعذر تنزيل الرابط" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
