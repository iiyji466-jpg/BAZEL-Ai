"use client";

import { useState, useRef, useEffect } from "react";

const BOTS = [
  {
    id: "translator",
    name: "مترجم وموسوعة",
    icon: "🌐",
    desc: "ترجمة فورية + معلومات موسوعية",
    color: "#6c63ff",
  },
  {
    id: "files",
    name: "الملفات والإنتاجية",
    icon: "📁",
    desc: "تحويل الملفات + أتمتة المهام",
    color: "#43e97b",
  },
  {
    id: "groups",
    name: "إدارة المجموعات",
    icon: "🛡️",
    desc: "قواعد + سياسات + محتوى",
    color: "#f093fb",
  },
  {
    id: "media",
    name: "صياد المقاطع",
    icon: "📥",
    desc: "تنزيل مقاطع من أي منصة",
    color: "#ff6584",
  },
  {
    id: "ai",
    name: "الذكاء الاصطناعي",
    icon: "🤖",
    desc: "مساعد شامل لكل شيء",
    color: "#ffd700",
  },
];

type Message = {
  role: "user" | "assistant";
  content: string;
};

const formatMessage = (text: string): string => {
  let html = text;

  // عناوين
  html = html.replace(/^### (.*$)/gm, '<h3 style="font-size:14px;font-weight:700;color:#e8e8f0;margin:14px 0 6px;padding:0">$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2 style="font-size:15px;font-weight:700;color:#e8e8f0;margin:16px 0 6px;padding:0">$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1 style="font-size:17px;font-weight:700;color:#e8e8f0;margin:18px 0 8px;padding:0">$1</h1>');

  // خط عريض
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700;color:#ffffff">$1</strong>');

  // خط مائل
  html = html.replace(/\*(.*?)\*/g, '<em style="font-style:italic;color:#c8c8d8">$1</em>');

  // نقاط مرقمة  1. 2. 3.
  html = html.replace(/^(\d+)\. (.*$)/gm,
    '<div style="display:flex;gap:10px;margin:6px 0;align-items:flex-start"><span style="color:#6c63ff;font-weight:700;min-width:22px;text-align:right">$1.</span><span style="flex:1">$2</span></div>'
  );

  // نقاط عادية
  html = html.replace(/^[•\-\*] (.*$)/gm,
    '<div style="display:flex;gap:10px;margin:6px 0;align-items:flex-start"><span style="color:#6c63ff;font-size:18px;line-height:1.2;min-width:16px">•</span><span style="flex:1">$1</span></div>'
  );

  // كود inline
  html = html.replace(/`(.*?)`/g,
    '<code style="background:#1a1a2e;padding:2px 8px;border-radius:5px;font-family:monospace;font-size:12px;color:#43e97b;border:1px solid #2a2a3a">$1</code>'
  );

  // خط فاصل
  html = html.replace(/^---$/gm,
    '<hr style="border:none;border-top:1px solid #2a2a3a;margin:14px 0"/>'
  );

  // أسطر فارغة وأسطر عادية
  html = html.replace(/\n\n/g, '<div style="height:10px"></div>');
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

      if (!res.ok || data.error) {
        throw new Error(data.error || "فشل التنزيل");
      }

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
        body: JSON.stringify({
          message: userMsg,
          bot: selectedBot,
          history: messages.slice(-10),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (err: any) {
      setError(err.message || "فشل الاتصال بالخادم");
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #000000 !important; }
        .app {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #000000;
        }
        .header {
          padding: 20px 24px;
          border-bottom: 1px solid #1a1a1a;
          display: flex;
          align-items: center;
          gap: 16px;
          background: #000000;
        }
        .header-logo { font-size: 26px; line-height: 1; }
        .header-text h1 { font-size: 17px; font-weight: 600; color: #ffffff; }
        .header-text p { font-size: 12px; color: #555566; margin-top: 2px; }
        .badge {
          margin-right: auto;
          background: rgba(108,99,255,0.12);
          border: 1px solid rgba(108,99,255,0.25);
          color: #6c63ff;
          font-size: 11px;
          padding: 4px 12px;
          border-radius: 20px;
        }
        .home-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: #000000;
        }
        .home-title {
          font-size: 13px;
          color: #555566;
          margin-bottom: 28px;
          letter-spacing: 1px;
        }
        .bots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          width: 100%;
          max-width: 860px;
        }
        .bot-card {
          background: #0a0a0a;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          padding: 24px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        .bot-card:hover {
          border-color: var(--card-color);
          transform: translateY(-2px);
          box-shadow: 0 6px 24px var(--card-shadow);
          background: #0f0f0f;
        }
        .bot-icon { font-size: 36px; display: block; margin-bottom: 10px; }
        .bot-name { font-size: 14px; font-weight: 600; color: #e8e8f0; margin-bottom: 5px; }
        .bot-desc { font-size: 11px; color: #555566; line-height: 1.5; }
        .bot-arrow {
          margin-top: 12px;
          font-size: 16px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .bot-card:hover .bot-arrow { opacity: 1; }
        .chat-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          max-width: 800px;
          width: 100%;
          margin: 0 auto;
          padding: 0 16px;
          background: #000000;
        }
        .chat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 0;
          border-bottom: 1px solid #1a1a1a;
        }
        .back-btn {
          background: #0f0f0f;
          border: 1px solid #1e1e1e;
          color: #e8e8f0;
          font-size: 13px;
          padding: 7px 14px;
          border-radius: 10px;
          cursor: pointer;
          font-family: 'Noto Kufi Arabic', sans-serif;
          transition: all 0.15s;
        }
        .back-btn:hover { background: #1a1a1a; }
        .chat-bot-info { display: flex; align-items: center; gap: 10px; }
        .chat-bot-icon {
          font-size: 22px;
          width: 40px; height: 40px;
          background: #0f0f0f;
          border: 1px solid #1e1e1e;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chat-bot-name { font-size: 14px; font-weight: 600; color: #ffffff; }
        .chat-bot-status { font-size: 11px; color: #43e97b; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
        .status-dot {
          width: 6px; height: 6px;
          background: #43e97b;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: 0;
          max-height: calc(100vh - 240px);
        }
        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-track { background: transparent; }
        .messages-area::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 4px; }
        .empty-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #444455;
          padding: 40px 0;
        }
        .empty-chat .big-icon { font-size: 44px; }
        .empty-chat p { font-size: 13px; }
        .message { display: flex; gap: 10px; animation: fadeSlide 0.2s ease; }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .message.user { flex-direction: row-reverse; }
        .msg-avatar {
          width: 30px; height: 30px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .msg-avatar.bot-av { background: #0f0f0f; border: 1px solid #1e1e1e; }
        .msg-avatar.user-av {
          background: rgba(108,99,255,0.15);
          border: 1px solid rgba(108,99,255,0.25);
          font-size: 11px;
          color: #6c63ff;
          font-weight: 700;
        }
        .msg-bubble {
          max-width: 78%;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 14px;
          line-height: 1.75;
          word-break: break-word;
          text-align: right;
        }
        .message.assistant .msg-bubble {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          color: #e0e0e8;
          border-radius: 4px 14px 14px 14px;
        }
        .message.user .msg-bubble {
          background: rgba(108,99,255,0.12);
          border: 1px solid rgba(108,99,255,0.2);
          color: #e8e8f0;
          border-radius: 14px 4px 14px 14px;
          white-space: pre-wrap;
        }
        .typing-indicator {
          display: flex;
          gap: 5px;
          padding: 14px 16px;
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          border-radius: 4px 14px 14px 14px;
          width: fit-content;
        }
        .typing-indicator span {
          width: 6px; height: 6px;
          background: #444455;
          border-radius: 50%;
          animation: bounce 1.2s infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
          40% { transform: scale(1.1); opacity: 1; }
        }
        .error-msg {
          background: rgba(255,80,80,0.08);
          border: 1px solid rgba(255,80,80,0.2);
          color: #ff6060;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
        }
        .input-area { padding: 12px 0 20px; border-top: 1px solid #1a1a1a; }
        .input-box {
          display: flex;
          gap: 10px;
          background: #0a0a0a;
          border: 1px solid #1e1e1e;
          border-radius: 14px;
          padding: 10px 14px;
          transition: border-color 0.2s;
        }
        .input-box:focus-within {
          border-color: rgba(108,99,255,0.4);
          box-shadow: 0 0 0 3px rgba(108,99,255,0.06);
        }
        .input-box textarea {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #e8e8f0;
          font-size: 14px;
          font-family: 'Noto Kufi Arabic', sans-serif;
          resize: none;
          line-height: 1.6;
          max-height: 120px;
          padding: 2px 0;
        }
        .input-box textarea::placeholder { color: #333344; }
        .send-btn {
          background: #6c63ff;
          border: none;
          color: white;
          width: 36px; height: 36px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          transition: all 0.15s;
          flex-shrink: 0;
          align-self: flex-end;
        }
        .send-btn:hover:not(:disabled) { background: #7c74ff; }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .input-hint {
          font-size: 11px;
          color: #222233;
          text-align: center;
          margin-top: 8px;
        }
        /* صياد المقاطع */
        .media-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px 16px;
          gap: 20px;
          background: #000000;
        }
        .media-box {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          border-radius: 20px;
          padding: 28px;
          width: 100%;
          max-width: 560px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .media-box h2 { color: #ffffff; font-size: 17px; text-align: center; }
        .media-box p { color: #444455; font-size: 12px; text-align: center; }
        .media-input {
          background: #050505;
          border: 1px solid #1e1e1e;
          border-radius: 12px;
          padding: 12px 14px;
          color: #e8e8f0;
          font-size: 14px;
          outline: none;
          width: 100%;
          transition: border-color 0.2s;
          direction: ltr;
        }
        .media-input:focus { border-color: #ff6584; }
        .media-btn {
          background: #ff6584;
          border: none;
          color: white;
          padding: 13px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 15px;
          font-family: 'Noto Kufi Arabic', sans-serif;
          font-weight: 600;
          transition: all 0.2s;
          width: 100%;
        }
        .media-btn:hover:not(:disabled) { background: #ff4f72; }
        .media-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .media-error {
          background: rgba(255,80,80,0.08);
          border: 1px solid rgba(255,80,80,0.2);
          color: #ff6060;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          text-align: center;
        }
        .download-result {
          background: rgba(67,233,123,0.06);
          border: 1px solid rgba(67,233,123,0.2);
          border-radius: 12px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
        }
        .download-result p { color: #43e97b; font-size: 14px; }
        .download-link {
          background: #43e97b;
          color: #000000;
          padding: 11px 26px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          font-family: 'Noto Kufi Arabic', sans-serif;
          transition: all 0.2s;
        }
        .download-link:hover { background: #2ecc71; }
        .platforms {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          justify-content: center;
        }
        .platform-tag {
          background: rgba(255,101,132,0.08);
          border: 1px solid rgba(255,101,132,0.15);
          color: #ff6584;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
        }
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
                <div
                  key={b.id}
                  className="bot-card"
                  style={{
                    "--card-color": b.color,
                    "--card-shadow": `${b.color}15`,
                  } as React.CSSProperties}
                  onClick={() => selectBot(b.id)}
                >
                  <span className="bot-icon">{b.icon}</span>
                  <div className="bot-name">{b.name}</div>
                  <div className="bot-desc">{b.desc}</div>
                  <div className="bot-arrow" style={{ color: b.color }}>←</div>
                </div>
              ))}
            </div>
          </div>
        ) : selectedBot === "media" ? (
          <div className="chat-screen">
            <div className="chat-header">
              <button className="back-btn" onClick={() => setSelectedBot(null)}>← رجوع</button>
              <div className="chat-bot-info">
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
                <input
                  className="media-input"
                  type="url"
                  placeholder="https://www.tiktok.com/..."
                  value={mediaUrl}
                  onChange={(e) => { setMediaUrl(e.target.value); setDownloadUrl(""); setMediaError(""); }}
                />
                <button className="media-btn" onClick={handleDownload} disabled={mediaLoading || !mediaUrl.trim()}>
                  {mediaLoading ? "⌛ جاري التنزيل..." : "⬇️ تنزيل الآن"}
                </button>
                {mediaError && <div className="media-error">⚠️ {mediaError}</div>}
                {downloadUrl && (
                  <div className="download-result">
                    <p>✅ جاهز للتنزيل!</p>
                    <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="download-link">
                      ⬇️ اضغط هنا للتنزيل
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-screen">
            <div className="chat-header">
              <button className="back-btn" onClick={() => setSelectedBot(null)}>← رجوع</button>
              <div className="chat-bot-info">
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
                  <div key={i} className={`message ${msg.role}`}>
                    <div className={`msg-avatar ${msg.role === "assistant" ? "bot-av" : "user-av"}`}>
                      {msg.role === "assistant" ? bot?.icon : "أنت"}
                    </div>
                    {msg.role === "assistant" ? (
                      <div
                        className="msg-bubble"
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                      />
                    ) : (
                      <div className="msg-bubble">{msg.content}</div>
                    )}
                  </div>
                ))
              )}

              {loading && (
                <div className="message assistant">
                  <div className="msg-avatar bot-av">{bot?.icon}</div>
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}

              {error && <div className="error-msg">⚠️ {error}</div>}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
              <div className="input-box">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={`اكتب رسالتك إلى ${bot?.name}...`}
                  rows={1}
                  disabled={loading}
                />
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