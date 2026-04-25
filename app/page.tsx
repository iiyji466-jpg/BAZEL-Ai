"use client";

import { useState, useRef, useEffect } from "react";

const BOTS = [
  { id: "translator", name: "مترجم وموسوعة", icon: "🌐", desc: "ترجمة فورية + معلومات موسوعية", color: "#6c63ff" },
  { id: "files", name: "الملفات والإنتاجية", icon: "📁", desc: "تحويل الملفات + أتمتة المهام", color: "#43e97b" },
  { id: "groups", name: "إدارة المجموعات", icon: "🛡️", desc: "قواعد + سياسات + محتوى", color: "#f093fb" },
  { id: "media", name: "صياد المقاطع", icon: "📥", desc: "تنزيل مقاطع من أي منصة", color: "#ff6584" },
  { id: "ai", name: "الذكاء الاصطناعي", icon: "🤖", desc: "مساعد شامل + إنشاء صور", color: "#ffd700" },
];

const SUGGESTIONS = [
  { icon: "🎨", text: "ارسم لي صورة قطة فضائية" },
  { icon: "💡", text: "احصل على نصائح" },
  { icon: "📝", text: "لخص النص" },
  { icon: "🌍", text: "ترجم جملة" },
];

type Message = {
  role: "user" | "assistant";
  content: string;
  image?: string;
  generatedImage?: string;
};

const formatMessage = (text: string): string => {
  let html = text;
  html = html.replace(/^### (.*$)/gm, '<div style="font-size:18px;font-weight:700;color:#fff;margin:22px 0 10px;text-align:right">$1</div>');
  html = html.replace(/^## (.*$)/gm, '<div style="font-size:20px;font-weight:700;color:#fff;margin:24px 0 12px;text-align:right">$1</div>');
  html = html.replace(/^# (.*$)/gm, '<div style="font-size:22px;font-weight:700;color:#fff;margin:26px 0 14px;text-align:right">$1</div>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700;color:#fff">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em style="font-style:italic;color:#ccc">$1</em>');
  html = html.replace(/^(\d+)\. (.*$)/gm,
    '<div style="margin:18px 0 6px;text-align:right"><span style="font-size:17px;font-weight:700;color:#fff">$1. $2</span></div>');
  html = html.replace(/^[•\-\*] (.*$)/gm,
    '<div style="display:flex;gap:14px;margin:10px 0;align-items:flex-start;direction:rtl"><span style="color:#fff;font-size:20px;line-height:1.3;flex-shrink:0">•</span><span style="flex:1;color:#e0e0e0;font-size:16px;line-height:1.8">$1</span></div>');
  html = html.replace(/`(.*?)`/g, '<code style="background:#1a1a1a;padding:2px 8px;border-radius:5px;font-family:monospace;font-size:13px;color:#43e97b">$1</code>');
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #1e1e1e;margin:18px 0"/>');
  html = html.replace(/\n\n/g, '<div style="height:14px"></div>');
  html = html.replace(/\n/g, '<br/>');
  return html;
};

const isImageRequest = (text: string): boolean => {
  const keywords = ["ارسم", "صورة", "اصنع صورة", "انشئ صورة", "generate image", "draw", "image of", "رسم", "صور لي", "صمم صورة"];
  return keywords.some(k => text.toLowerCase().includes(k));
};

export default function Home() {
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const bot = BOTS.find((b) => b.id === selectedBot);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectBot = (id: string) => {
    setSelectedBot(id);
    setMessages([]);
    setError("");
    setMediaUrl("");
    setMediaError("");
    setDownloadUrl("");
    setSelectedImage(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      alert("لا يمكن الوصول إلى الميكروفون");
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setInput(prev => prev + (prev ? " " : "") + "🎤 رسالة صوتية");
  };

  const copyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const generateImage = async (prompt: string): Promise<string> => {
    const res = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.imageUrl;
  };

  const handleDownload = async () => {
    if (!mediaUrl.trim()) return;
    setMediaLoading(true);
    setMediaError("");
    setDownloadUrl("");
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: mediaUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "فشل التنزيل");
      setDownloadUrl(data.downloadUrl);
    } catch (err: any) {
      setMediaError(err.message || "حدث خطأ أثناء التنزيل");
    } finally {
      setMediaLoading(false);
    }
  };

  const sendMessage = async (customMsg?: string) => {
    const userMsg = customMsg || input.trim();
    if (!userMsg || loading) return;
    setInput("");
    setError("");
    const newMsg: Message = { role: "user", content: userMsg };
    if (selectedImage) { newMsg.image = selectedImage; setSelectedImage(null); }
    setMessages(prev => [...prev, newMsg]);
    setLoading(true);

    // إنشاء صورة
    if (isImageRequest(userMsg)) {
      setImageLoading(true);
      try {
        const imageUrl = await generateImage(userMsg);
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "تفضل! هذه الصورة التي طلبتها 🎨",
          generatedImage: imageUrl
        }]);
      } catch (err: any) {
        setMessages(prev => [...prev, { role: "assistant", content: "عذراً، لم أتمكن من إنشاء الصورة. حاول مجدداً." }]);
      } finally {
        setLoading(false);
        setImageLoading(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, bot: selectedBot, history: messages.slice(-10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (err: any) {
      setError(err.message || "فشل الاتصال بالخادم");
      setMessages(prev => prev.slice(0, -1));
      setInput(userMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #000 !important; color: #ececec; font-family: 'Noto Kufi Arabic', 'Segoe UI', Arial, sans-serif; direction: rtl; font-size: 16px; line-height: 1.8; -webkit-font-smoothing: antialiased; }

        .app { min-height: 100vh; display: flex; flex-direction: column; background: #000; }

        .header { padding: 14px 20px; border-bottom: 1px solid #111; display: flex; align-items: center; gap: 12px; background: #000; position: sticky; top: 0; z-index: 10; }
        .header-logo { font-size: 22px; }
        .header-text h1 { font-size: 16px; font-weight: 700; color: #fff; }
        .header-text p { font-size: 11px; color: #444; margin-top: 1px; }
        .badge { margin-right: auto; background: #0d0d0d; border: 1px solid #1a1a1a; color: #555; font-size: 11px; padding: 4px 12px; border-radius: 20px; }

        /* الصفحة الرئيسية */
        .home-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; gap: 36px; }
        .welcome-title { font-size: 28px; font-weight: 700; color: #fff; text-align: center; }
        .suggestions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; max-width: 480px; }
        .suggestion-btn { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 16px; padding: 16px 18px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 14px; color: #bbb; font-family: inherit; transition: all 0.2s; text-align: right; }
        .suggestion-btn:hover { background: #111; border-color: #2a2a2a; color: #fff; transform: translateY(-1px); }
        .suggestion-icon { font-size: 20px; flex-shrink: 0; }
        .bots-section { width: 100%; max-width: 640px; }
        .bots-label { font-size: 12px; color: #333; margin-bottom: 12px; text-align: center; }
        .bots-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
        .bot-card { background: #0a0a0a; border: 1px solid #141414; border-radius: 16px; padding: 20px 12px; cursor: pointer; transition: all 0.2s; text-align: center; }
        .bot-card:hover { border-color: var(--cc); background: #0f0f0f; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
        .bot-icon { font-size: 28px; display: block; margin-bottom: 8px; }
        .bot-name { font-size: 12px; font-weight: 600; color: #ddd; margin-bottom: 4px; }
        .bot-desc { font-size: 10px; color: #333; line-height: 1.5; }

        /* شاشة الشات */
        .chat-screen { flex: 1; display: flex; flex-direction: column; max-width: 700px; width: 100%; margin: 0 auto; padding: 0 16px; }
        .chat-header { display: flex; align-items: center; gap: 10px; padding: 12px 0; border-bottom: 1px solid #111; position: sticky; top: 53px; background: #000; z-index: 9; }
        .back-btn { background: #0d0d0d; border: 1px solid #1a1a1a; color: #888; font-size: 13px; padding: 6px 14px; border-radius: 10px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .back-btn:hover { background: #141414; color: #fff; }
        .chat-bot-icon { font-size: 18px; width: 36px; height: 36px; background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .chat-bot-name { font-size: 14px; font-weight: 600; color: #fff; }
        .chat-bot-status { font-size: 11px; color: #2d8a58; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
        .status-dot { width: 6px; height: 6px; background: #2d8a58; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* الرسائل */
        .messages-area { flex: 1; overflow-y: auto; padding: 24px 0 12px; display: flex; flex-direction: column; min-height: 0; max-height: calc(100vh - 200px); }
        .messages-area::-webkit-scrollbar { width: 2px; }
        .messages-area::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 4px; }

        .empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 60px 0; }
        .empty-chat .big-icon { font-size: 48px; filter: grayscale(0.5); }
        .empty-chat p { font-size: 14px; color: #2a2a2a; }

        /* رسالة المستخدم */
        .user-msg-wrap { display: flex; justify-content: flex-end; margin: 6px 0; animation: fadeIn 0.2s ease; }
        .user-bubble { background: #1a1a1a; color: #fff; padding: 12px 18px; border-radius: 20px 20px 4px 20px; font-size: 16px; line-height: 1.75; max-width: 80%; white-space: pre-wrap; word-break: break-word; text-align: right; }
        .user-image-preview { max-width: 180px; border-radius: 12px; margin-bottom: 8px; display: block; }

        /* رسالة البوت */
        .bot-msg-wrap { display: flex; gap: 12px; align-items: flex-start; margin: 6px 0 2px; animation: fadeIn 0.2s ease; }
        .bot-avatar { width: 30px; height: 30px; background: #0d0d0d; border: 1px solid #141414; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; margin-top: 4px; }
        .bot-bubble { flex: 1; font-size: 16px; line-height: 1.85; color: #e0e0e0; word-break: break-word; text-align: right; padding-top: 2px; }
        .generated-image { max-width: 100%; border-radius: 16px; margin-top: 12px; display: block; border: 1px solid #1a1a1a; }

        /* أيقونات التفاعل */
        .msg-actions { display: flex; gap: 14px; margin: 6px 0 18px; padding-right: 42px; }
        .action-btn { background: none; border: none; color: #2a2a2a; cursor: pointer; font-size: 17px; padding: 4px 6px; border-radius: 8px; transition: all 0.15s; }
        .action-btn:hover { color: #666; }
        .action-btn.active { color: #43e97b; }

        @keyframes fadeIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

        /* مؤشر الكتابة */
        .typing-wrap { display: flex; gap: 12px; align-items: center; margin: 6px 0 18px; }
        .typing-dots { display: flex; gap: 5px; padding: 8px 4px; }
        .typing-dots span { width: 7px; height: 7px; background: #2a2a2a; border-radius: 50%; animation: bounce 1.2s infinite; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.4} 40%{transform:scale(1.1);opacity:1} }

        .error-msg { background: rgba(255,50,50,0.06); border: 1px solid rgba(255,50,50,0.12); color: #ff5555; padding: 10px 14px; border-radius: 10px; font-size: 14px; margin: 8px 0; }

        /* معاينة الصورة المرفقة */
        .img-preview-bar { display: flex; align-items: center; gap: 10px; background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 12px; padding: 8px 12px; margin-bottom: 8px; }
        .img-preview-bar img { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; }
        .img-preview-bar span { font-size: 12px; color: #555; flex: 1; }
        .remove-img-btn { background: none; border: none; color: #333; cursor: pointer; font-size: 18px; line-height: 1; transition: color 0.15s; }
        .remove-img-btn:hover { color: #ff5555; }

        /* منطقة الإدخال */
        .input-area { padding: 10px 0 20px; }
        .input-wrap { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 28px; padding: 10px 12px 10px 12px; display: flex; align-items: flex-end; gap: 8px; transition: border-color 0.2s; }
        .input-wrap:focus-within { border-color: #2a2a2a; }
        .send-btn { background: #fff; border: none; color: #000; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; transition: all 0.15s; flex-shrink: 0; }
        .send-btn:hover:not(:disabled) { background: #ddd; }
        .send-btn:disabled { background: #141414; color: #2a2a2a; cursor: not-allowed; }
        .input-wrap textarea { flex: 1; background: none; border: none; outline: none; color: #fff; font-size: 15px; font-family: inherit; resize: none; line-height: 1.6; max-height: 130px; padding: 2px 0; text-align: right; }
        .input-wrap textarea::placeholder { color: #2a2a2a; }
        .mic-btn { background: none; border: none; cursor: pointer; font-size: 20px; padding: 4px; border-radius: 8px; transition: all 0.15s; flex-shrink: 0; opacity: 0.5; }
        .mic-btn:hover { opacity: 1; }
        .mic-btn.rec { opacity: 1; animation: pulse 1s infinite; filter: drop-shadow(0 0 6px red); }
        .img-btn { background: none; border: none; cursor: pointer; font-size: 20px; padding: 4px; border-radius: 8px; transition: all 0.15s; flex-shrink: 0; opacity: 0.5; }
        .img-btn:hover { opacity: 1; }
        .input-hint { font-size: 11px; color: #1a1a1a; text-align: center; margin-top: 8px; }

        /* صياد المقاطع */
        .media-screen { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 32px 16px; }
        .media-box { background: #0a0a0a; border: 1px solid #141414; border-radius: 20px; padding: 28px; width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 14px; }
        .media-box h2 { color: #fff; font-size: 17px; text-align: center; font-weight: 700; }
        .media-box > p { color: #333; font-size: 12px; text-align: center; }
        .platforms { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; }
        .platform-tag { background: #0d0d0d; border: 1px solid #141414; color: #444; padding: 3px 10px; border-radius: 20px; font-size: 11px; }
        .media-input { background: #060606; border: 1px solid #141414; border-radius: 12px; padding: 12px 14px; color: #fff; font-size: 14px; outline: none; width: 100%; transition: border-color 0.2s; direction: ltr; font-family: inherit; }
        .media-input:focus { border-color: #2a2a2a; }
        .media-btn { background: #fff; border: none; color: #000; padding: 13px; border-radius: 12px; cursor: pointer; font-size: 14px; font-family: inherit; font-weight: 700; transition: all 0.2s; width: 100%; }
        .media-btn:hover:not(:disabled) { background: #ddd; }
        .media-btn:disabled { background: #0d0d0d; color: #222; cursor: not-allowed; }
        .media-error { background: rgba(255,50,50,0.06); border: 1px solid rgba(255,50,50,0.12); color: #ff5555; padding: 10px 14px; border-radius: 10px; font-size: 13px; text-align: center; }
        .download-result { background: rgba(45,138,88,0.08); border: 1px solid rgba(45,138,88,0.2); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 10px; align-items: center; }
        .download-result p { color: #2d8a58; font-size: 14px; }
        .download-link { background: #2d8a58; color: #fff; padding: 11px 26px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; font-family: inherit; transition: all 0.2s; }
        .download-link:hover { background: #256e47; }

        /* تحميل الصورة */
        .image-generating { display: flex; align-items: center; gap: 10px; color: #555; font-size: 14px; margin: 8px 0; }
        .img-spinner { width: 18px; height: 18px; border: 2px solid #1a1a1a; border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />

      <div className="app">
        <header className="header">
          <div className="header-logo">⚡</div>
          <div className="header-text">
            <h1>مجموعة البوتات الذكية</h1>
            <p>مدعوم بـ Groq AI</p>
          </div>
          <div className="badge">Llama 3.3 70B</div>
        </header>

        {!selectedBot ? (
          <div className="home-screen">
            <div className="welcome-title">كيف يمكنني المساعدة؟</div>
            <div className="suggestions-grid">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="suggestion-btn"
                  onClick={() => { selectBot("ai"); setTimeout(() => sendMessage(s.text), 400); }}>
                  <span className="suggestion-icon">{s.icon}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
            <div className="bots-section">
              <p className="bots-label">أو اختر بوتاً متخصصاً</p>
              <div className="bots-grid">
                {BOTS.map((b) => (
                  <div key={b.id} className="bot-card"
                    style={{ "--cc": b.color } as React.CSSProperties}
                    onClick={() => selectBot(b.id)}>
                    <span className="bot-icon">{b.icon}</span>
                    <div className="bot-name">{b.name}</div>
                    <div className="bot-desc">{b.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        ) : selectedBot === "media" ? (
          <div className="chat-screen">
            <div className="chat-header">
              <button className="back-btn" onClick={() => setSelectedBot(null)}>← رجوع</button>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="chat-bot-icon">📥</div>
                <div>
                  <div className="chat-bot-name">صياد المقاطع</div>
                  <div className="chat-bot-status"><div className="status-dot"></div>متصل</div>
                </div>
              </div>
            </div>
            <div className="media-screen">
              <div className="media-box">
                <h2>📥 تنزيل المقاطع</h2>
                <p>الصق رابط الفيديو من أي منصة</p>
                <div className="platforms">
                  {["TikTok", "YouTube", "Instagram", "Twitter/X", "Facebook"].map((p) => (
                    <span key={p} className="platform-tag">{p}</span>
                  ))}
                </div>
                <input className="media-input" type="url" placeholder="https://..."
                  value={mediaUrl}
                  onChange={(e) => { setMediaUrl(e.target.value); setDownloadUrl(""); setMediaError(""); }} />
                <button className="media-btn" onClick={handleDownload} disabled={mediaLoading || !mediaUrl.trim()}>
                  {mediaLoading ? "⌛ جاري التنزيل..." : "⬇️ تنزيل الآن"}
                </button>
                {mediaError && <div className="media-error">⚠️ {mediaError}</div>}
                {downloadUrl && (
                  <div className="download-result">
                    <p>✅ جاهز للتنزيل!</p>
                    <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="download-link">⬇️ اضغط هنا للتنزيل</a>
                  </div>
                )}
              </div>
            </div>
          </div>

        ) : (
          <div className="chat-screen">
            <div className="chat-header">
              <button className="back-btn" onClick={() => setSelectedBot(null)}>← رجوع</button>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="chat-bot-icon">{bot?.icon}</div>
                <div>
                  <div className="chat-bot-name">{bot?.name}</div>
                  <div className="chat-bot-status"><div className="status-dot"></div>متصل</div>
                </div>
              </div>
            </div>

            <div className="messages-area">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <div className="big-icon">{bot?.icon}</div>
                  <p>ابدأ المحادثة مع {bot?.name}</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  msg.role === "user" ? (
                    <div key={i} className="user-msg-wrap">
                      <div className="user-bubble">
                        {msg.image && <img src={msg.image} alt="uploaded" className="user-image-preview" />}
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div key={i}>
                      <div className="bot-msg-wrap">
                        <div className="bot-avatar">{bot?.icon}</div>
                        <div className="bot-bubble">
                          <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                          {msg.generatedImage && (
                            <img src={msg.generatedImage} alt="generated" className="generated-image"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          )}
                        </div>
                      </div>
                      <div className="msg-actions">
                        <button className={`action-btn ${copiedIndex === i ? "active" : ""}`}
                          onClick={() => copyMessage(msg.content, i)} title="نسخ">
                          {copiedIndex === i ? "✓" : "⧉"}
                        </button>
                        <button className="action-btn" title="إعجاب">👍</button>
                        <button className="action-btn" title="لا إعجاب">👎</button>
                        <button className="action-btn" title="مشاركة">↑</button>
                        <button className="action-btn" title="المزيد">•••</button>
                      </div>
                    </div>
                  )
                ))
              )}

              {loading && (
                <div className="typing-wrap">
                  <div className="bot-avatar">{bot?.icon}</div>
                  {imageLoading ? (
                    <div className="image-generating">
                      <div className="img-spinner"></div>
                      <span>جاري إنشاء الصورة...</span>
                    </div>
                  ) : (
                    <div className="typing-dots">
                      <span></span><span></span><span></span>
                    </div>
                  )}
                </div>
              )}

              {error && <div className="error-msg">⚠️ {error}</div>}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
              {selectedImage && (
                <div className="img-preview-bar">
                  <img src={selectedImage} alt="preview" />
                  <span>صورة مرفقة</span>
                  <button className="remove-img-btn" onClick={() => setSelectedImage(null)}>✕</button>
                </div>
              )}
              <div className="input-wrap">
                <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading}>
                  {loading ? "⌛" : "↑"}
                </button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="اكتب رسالتك..."
                  rows={1}
                  disabled={loading}
                />
                <button className="mic-btn" title="تسجيل صوت"
                  onPointerDown={startRecording}
                  onPointerUp={stopRecording}
                  onPointerLeave={stopRecording}>
                  🎤
                </button>
                <button className="img-btn" title="رفع صورة"
                  onClick={() => fileInputRef.current?.click()}>
                  🖼
                </button>
              </div>
              <p className="input-hint">Enter للإرسال • Shift+Enter لسطر جديد</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}