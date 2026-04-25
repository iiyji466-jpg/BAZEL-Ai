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
      },
      body: JSON.stringify({
        url: url,
        videoQuality: "1080",
        audioFormat: "mp3",
        filenameStyle: "pretty",
      }),
    });

    const data = await response.json();

    if (data.status === "error") {
      return NextResponse.json(
        { error: "تعذر تنزيل الرابط" },
        { status: 400 }
      );
    }

    return NextResponse.json({ downloadUrl: data.url, status: data.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
