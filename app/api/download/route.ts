import { NextRequest, NextResponse } from "next/server";

const COBALT_INSTANCES = [
  "https://cobalt.api.timelessnesses.me",
  "https://cobalt.urdnot.pw",
  "https://api.cobalt.tools",
];

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });
    }

    let lastError = "";

    for (const instance of COBALT_INSTANCES) {
      try {
        const response = await fetch(instance + "/", {
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

        if (data.status === "stream" || data.status === "redirect" || data.status === "tunnel") {
          return NextResponse.json({ downloadUrl: data.url });
        }

        if (data.status === "picker") {
          return NextResponse.json({ downloadUrl: data.picker[0]?.url });
        }

        lastError = data.error?.code || "فشل";
      } catch (e: any) {
        lastError = e.message;
        continue;
      }
    }

    return NextResponse.json(
      { error: "تعذر التنزيل من جميع الخوادم: " + lastError },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
