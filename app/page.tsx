"use client";

import { useState, useRef, useEffect } from "react";

const BOTS = [
  { id: "translator", name: "مترجم وموسوعة", icon: "🌐", desc: "ترجمة فورية + معلومات موسوعية", color: "#6c63ff" },
  { id: "files", name: "الملفات والإنتاجية", icon: "📁", desc: "تحويل الملفات + أتمتة المهام", color: "#43e97b" },
  { id: "groups", name: "إدارة المجموعات", icon: "🛡️", desc: "قواعد + سياسات + محتوى", color: "#f093fb" },
  { id: "media", name: "صياد المقاطع", icon: "📥", desc: "تنزيل مقاطع من أي منصة", color: "#ff6584" },
  { id: "ai", name: "الذكاء الاصطناعي", icon: "🤖", desc: "مساعد شامل لكل شيء", color: "#ffd700" },
];

type Message = { role: "user" | "assistant"; content: string };

const formatMessage = (text: string): string => {
  let html = text;
  html = html.replace(/^### (.*$)/gm, '<h3 style="font-size:15px;font-weight:700;color:#fff;margin:16px 0 8px">$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2 style="font-size:17px;font-weight:700;color:#fff;margin:18px 0 8px">$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1 style="font-size:19px;font-weight:700;color:#fff;margin:20px 0 10px">$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700;color:#fff">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em style="font-style:italic">$1</em>');
  html = html.replace(/^(\d+)\. (.*$)/gm,
    '<div style="display:flex;gap:12px;margin:8px 0;align-items:flex-start;direction:rtl"><span style="color:#fff;font-weight:700;min-width:24px">$1.</span><span style="flex:1;color:#ececec">$2</span></div>');
  html = html.replace(/^[•\-\*] (.*$)/gm,
    '<div style="display:flex;gap:12px;margin:8px 0;align-items:flex-start;direction:rtl"><span style="color:#fff;font-size:20px;line-height:1;min-width:20px">•</span><span style="flex:1;color:#ececec">$1</span></div>');
  html = html.replace(/`(.*?)`/g,
    '<code style="background:#2a2a2a;padding:2px 8px;border-radius:5px;font-family:monospace;font-size:13px;color:#43e97b">$1</code>');
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #2a2a2a;margin:16px 0"/>');
  html = html.replace(/\n\n/g, '<div style="height:12px"></div>');
  html = html.replace(/\n/g, '<br/>');
  return html;
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
    setTimeout(() => inputRef.current?.focus(), 100);
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

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, bot: selectedBot, history: messages.slice(-10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (err: any) {
      setError(err.message || "فشل الاتصال بالخادم");
      setMessages((prev) => prev.slice(0, -1));
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
        html, body { background: #000 !important; color: #ececec; font-family: 'Segoe UI', 'Noto Kufi Arabic', sans-serif; direction: rtl; }
        
        .app { min-height: 100vh; display: flex; flex-direction: column; background: #000; }
        
        /* هيدر */
        .header { padding: 16px 20px; border-bottom: 1px solid #1c1c1c; display: flex; align-items: center; gap: 12px; background: #000; position: sticky; top: 0; z-index: 10; }
        .header-logo { font-size: 22px; }
        .header-text h1 { font-size: 16px; font-weight: 600; color: #fff; }
        .header-text p { font-size: 11px; color: #555; margin-top: 1px; }
        .badge { margin-right: auto; background: #111; border: 1px solid #222; color: #888; font-size: 11px; padding: 3px 10px; border-radius: 20px; }
        
        /* الصفحة الرئيسية */
        .home-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 16px; }
        .home-title { font-size: 13px; color: #555; margin-bottom: 24px; }
        .bots-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; width: 100%; max-width: 800px; }
        .bot-card { background: #0d0d0d; border: 1px solid #1c1c1c; border-radius: 14px; padding: 22px 14px; cursor: pointer; transition: all 0.2s; text-align: center; }
        .bot-card:hover { border-color: var(--cc); background: #111; transform: translateY(-2px); }
        .bot-icon { font-size: 32px; display: block; margin-bottom: 10px; }
        .bot-name { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 5px; }
        .bot-desc { font-size: 11px; color: #555; line-height: 1.5; }
        
        /* شاشة الشات */
        .chat-screen { flex: 1; display: flex; flex-direction: column; max-width: 760px; width: 100%; margin: 0 auto; padding: 0 16px; }
        .chat-header { display: flex; align-items: center; gap: 10px; padding: 14px 0; border-bottom: 1px solid #1c1c1c; position: sticky; top: 57px; background: #000; z-index: 9; }
        .back-btn { background: #111; border: 1px solid #222; color: #ccc; font-size: 13px; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .back-btn:hover { background: #1a1a1a; color: #fff; }
        .chat-bot-icon { font-size: 20px; width: 38px; height: 38px; background: #111; border: 1px solid #1c1c1c; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .chat-bot-name { font-size: 14px; font-weight: 600; color: #fff; }
        .chat-bot-status { font-size: 11px; color: #3a9e6a; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
        .status-dot { width: 6px; height: 6px; background: #3a9e6a; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        
        /* الرسائل */
        .messages-area { flex: 1; overflow-y: auto; padding: 24px 0 12px; display: flex; flex-direction: column; gap: 0; min-height: 0; max-height: calc(100vh - 200px); }
        .messages-area::-webkit-scrollbar { width: 3px; }
        .messages-area::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
        
        .empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #333; padding: 60px 0; }
        .empty-chat .big-icon { font-size: 48px; filter: grayscale(0.3); }
        .empty-chat p { font-size: 14px; color: #444; }
        
        /* رسالة المستخدم */
        .user-message-wrap { display: flex; justify-content: flex-end; margin: 4px 0 16px; animation: fadeIn 0.2s ease; }
        .user-bubble { background: #1c1c1c; color: #fff; padding: 10px 16px; border-radius: 18px 18px 4px 18px; font-size: 15px; line-height: 1.65; max-width: 75%; white-space: pre-wrap; word-break: break-word; }
        
        /* رسالة البوت */
        .bot-message-wrap { display: flex; gap: 12px; align-items: flex-start; margin: 4px 0 20px; animation: fadeIn 0.2s ease; }
        .bot-avatar { width: 32px; height: 32px; background: #111; border: 1px solid #1c1c1c; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; margin-top: 2px; }
        .bot-bubble { flex: 1; font-size: 15px; line-height: 1.8; color: #ececec; word-break: break-word; padding-top: 4px; }
        
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        
        /* مؤشر الكتابة */
        .typing-wrap { display: flex; gap: 12px; align-items: center; margin: 4px 0 20px; }
        .typing-dots { display: flex; gap: 5px; padding: 12px 14px; }
        .typing-dots span { width: 7px; height: 7px; background: #444; border-radius: 50%; animation: bounce 1.2s infinite; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.4} 40%{transform:scale(1.1);opacity:1} }
        
        .error-msg { background: rgba(255,60,60,0.08); border: 1px solid rgba(255,60,60,0.15); color: #ff6060; padding: 10px 14px; border-radius: 10px; font-size: 13px; margin: 8px 0; }
        
        /* منطقة الإدخال */
        .input-area { padding: 12px 0 20px; border-top: 1px solid #1c1c1c; }
        .input-box { display: flex; gap: 8px; background: #111; border: 1px solid #222; border-radius: 16px; padding: 10px 14px; transition: border-color 0.2s; }
        .input-box:focus-within { border-color: #333; }
        .input-box textarea { flex: 1; background: none; border: none; outline: none; color: #fff; font-size: 15px; font-family: inherit; resize: none; line-height: 1.6; max-height: 140px; padding: 0; }
        .input-box textarea::placeholder { color: #333; }
        .send-btn { background: #fff; border: none; color: #000; width: 34px; height: 34px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; transition: all 0.15s; flex-shrink: 0; align-self: flex-end; }
        .send-btn:hover:not(:disabled) { background: #ddd; }
        .send-btn:disabled { background: #222; color: #444; cursor: not-allowed; }
        .input-hint { font-size: 11px; color: #222; text-align: center; margin-top: 8px; }
        
        /* صياد المقاطع */
        .media-screen { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 32px 16px; gap: 16px; }
        .media-box { background: #0d0d0d; border: 1px solid #1c1c1c; border-radius: 18px; padding: 28px; width: 100%; max-width: 520px; display: flex; flex-direction: column; gap: 14px; }
        .media-box h2 { color: #fff; font-size: 17px; text-align: center; }
        .media-box p { color: #444; font-size: 12px; text-align: center; }
        .platforms { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; }
        .platform-tag { background: #111; border: 1px solid #1c1c1c; color: #666; padding: 3px 10px; border-radius: 20px; font-size: 11px; }
        .media-input { background: #080808; border: 1px solid #1c1c1c; border-radius: 10px; padding: 11px 14px; color: #fff; font-size: 14px; outline: none; width: 100%; transition: border-color 0.2s; direction: ltr; font-family: inherit; }
        .media-input:focus { border-color: #333; }
        .media-btn { background: #fff; border: none; color: #000; padding: 12px; border-radius: 10px; cursor: pointer; font-size: 14px; font-family: inherit; font-weight: 700; transition: all 0.2s; width: 100%; }
        .media-btn:hover:not(:disabled) { background: #ddd; }
        .media-btn:disabled { background: #111; color: #333; cursor: not-allowed; }
        .media-error { background: rgba(255,60,60,0.08); border: 1px solid rgba(255,60,60,0.15); color: #ff6060; padding: 10px 14px; border-radius: 10px; font-size: 13px; text-align: center; }
        .download-result { background: rgba(58,158,106,0.08); border: 1px solid rgba(58,158,106,0.2); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 10px; align-items: center; }
        .download-result p { color: #3a9e6a; font-size: 14px; }
        .download-link { background: #3a9e6a; color: #fff; padding: 11px 26px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; font-family: inherit; transition: all 0.2s; }
        .download-link:hover { background: #2d8a58; }
      `}</style>

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
            <p className="home-title">اختر البوت المناسب</p>
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
                <p>الصق رابط الفيديو من أي منصة وسننزله لك فوراً</p>
                <div className="platforms">
                  {["TikTok", "YouTube", "Instagram", "Twitter/X", "Facebook", "Pinterest"].map((p) => (
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
                    <div key={i} className="user-message-wrap">
                      <div className="user-bubble">{msg.content}</div>
                    </div>
                  ) : (
                    <div key={i} className="bot-message-wrap">
                      <div className="bot-avatar">{bot?.icon}</div>
                      <div className="bot-bubble"
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                    </div>
                  )
                ))
              )}

              {loading && (
                <div className="typing-wrap">
                  <div className="bot-avatar">{bot?.icon}</div>
                  <div className="typing-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}

              {error && <div className="error-msg">⚠️ {error}</div>}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
              <div className="input-box">
                <textarea ref={inputRef} value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={`اكتب رسالتك إلى ${bot?.name}...`}
                  rows={1} disabled={loading} />
                <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || loading}>
                  {loading ? "⌛" : "↑"}
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