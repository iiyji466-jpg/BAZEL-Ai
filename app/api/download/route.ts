const data = await res.json();
console.log("Media Downloader full response:", JSON.stringify(data, null, 2));

// استخراج آمن من أي مكان محتمل
let videoUrl = null;

// البحث في المستوى الأول
if (typeof data === 'string') {
  videoUrl = data; // بعض APIs ترجع الرابط مباشرة كنص
} else if (data?.url) {
  videoUrl = data.url;
} else if (data?.video_url) {
  videoUrl = data.video_url;
} else if (data?.download_url) {
  videoUrl = data.download_url;
}

// البحث داخل data.data (حالتك في الصورة)
if (!videoUrl && data?.data) {
  const d = data.data;
  videoUrl = d.video_url || d.download_url || d.video || d.download || d.url;
}

// البحث داخل وسائط متعددة
if (!videoUrl && data?.medias) {
  const media = data.medias.find((m: any) => m.type === 'video' || m.url?.endsWith('.mp4'));
  videoUrl = media?.url || data.medias[0]?.url;
}

// محاولة من أي قائمة روابط
if (!videoUrl && data?.links) {
  videoUrl = data.links[0]?.url;
}

if (videoUrl) {
  return NextResponse.json({ downloadUrl: videoUrl });
}

throw new Error("تعذر تنزيل الرابط. تأكد أن الفيديو عام");