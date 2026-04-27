// ===== Instagram فقط - استبدل هذا الجزء =====
if (url.includes("instagram.com")) {
  
  // API الأقوى لـ Instagram حالياً
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
    console.log("IG:", JSON.stringify(data).slice(0, 500));

    // استخراج الرابط من أي شكل ممكن
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

  // بديل ثاني موثوق
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
    console.log("IG2:", JSON.stringify(data).slice(0, 500));

    const videoUrl =
      data?.media?.[0]?.url ||
      data?.url ||
      data?.video_url ||
      data?.[0]?.url;

    if (videoUrl) return NextResponse.json({ downloadUrl: videoUrl });
  } catch (e) {
    console.log("IG API2 failed:", e);
  }

  // بديل ثالث
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
    console.log("IG3:", JSON.stringify(data).slice(0, 500));

    const videoUrl = data?.download_url || data?.url || data?.video;
    if (videoUrl) return NextResponse.json({ downloadUrl: videoUrl });
  } catch (e) {
    console.log("IG API3 failed:", e);
  }

  throw new Error("تعذر تنزيل من Instagram. تأكد أن المنشور عام");
}