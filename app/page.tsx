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

export default function Home() {
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // صياد المقاطع
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
        .app {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .header {
          padding: 28px 32px 20px;
          border-bottom: 1px solid #1e1e2e;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .header-logo { font-size: 28px; line-height: 1; }
        .header-text h1 { font-size: 18px; font-weight: 600; color: #e8e8f0; }
        .header-text p { font-size: 12px; color: #6b6b80; margin-top: 2px; }
        .badge {
          margin-right: auto;
          background: rgba(108,99,255,0.15);
          border: 1px solid rgba(108,99,255,0.3);
          color: #6c63ff;
          font-size: 11px;
          padding: 4px 12px;
          border-radius: 20px;
          font-family: 'IBM Plex Mono', monospace;
        }
        .home-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }
        .home-title {
          font-size: 14px;
          color: #6b6b80;
          margin-bottom: 32px;
          letter-spacing: 1px;
        }
        .bots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          width: 100%;
          max-width: 900px;
        }
        .bot-card {
          background: #111118;
          border: 1px solid #2a2a3a;
          border-radius: 16px;
          padding: 28px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .bot-card:hover {
          border-color: var(--card-color);
          transform: translateY(-3px);
          box-shadow: 0 8px 32px var(--card-shadow);
        }
        .bot-icon { font-size: 40px; display: block; margin-bottom: 12px; }
        .bot-name { font-size: 15px; font-weight: 600; color: #e8e8f0; margin-bottom: 6px; }
        .bot-desc { font-size: 12px; color: #6b6b80; line-height: 1.5; }
        .bot-arrow {
          margin-top: 16px;
          font-size: 18px;
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
          transform: translateX(6px);
        }
        .bot-card:hover .bot-arrow { opacity: 1; transform: translateX(0); }
        .chat-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          max-width: 860px;
          width: 100%;
          margin: 0 auto;
          padding: 0 20px;
        }
        .chat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 0 16px;
          border-bottom: 1px solid #1e1e2e;
        }
        .back-btn {
          background: #1a1a24;
          border: 1px solid #2a2a3a;
          color: #e8e8f0;
          font-size: 14px;
          padding: 8px 16px;
          border-radius: 10px;
          cursor: pointer;
          font-family: 'Noto Kufi Arabic', sans-serif;
          transition: all 0.15s;
        }
        .back-btn:hover { background: #2a2a3a; border-color: #6c63ff; }
        .chat-bot-info { display: flex; align-items: center; gap: 10px; }
        .chat-bot-icon {
          font-size: 26px;
          width: 44px; height: 44px;
          background: #1a1a24;
          border: 1px solid #2a2a3a;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chat-bot-name { font-size: 15px; font-weight: 600; color: #e8e8f0; }
        .chat-bot-status { font-size: 11px; color: #43e97b; display: flex; align-items: center; gap: 4px; }
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

        /* صياد المقاطع */
        .media-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          gap: 24px;
        }
        .media-box {
          background: #111118;
          border: 1px solid #2a2a3a;
          border-radius: 20px;
          padding: 32px;
          width: 100%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .media-box h2 {
          color: #e8e8f0;
          font-size: 18px;
          text-align: center;
          margin-bottom: 8px;
        }
        .media-box p {
          color: #6b6b80;
          font-size: 12px;
          text-align: center;
        }
        .media-input {
          background: #0d0d14;
          border: 1px solid #2a2a3a;
          border-radius: 12px;
          padding: 12px 16px;
          color: #e8e8f0;
          font-size: 14px;
          font-family: 'Noto Kufi Arabic', sans-serif;
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
        .media-btn:hover:not(:disabled) { background: #ff4f72; transform: translateY(-1px); }
        .media-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .media-error {
          background: rgba(255,101,132,0.1);
          border: 1px solid rgba(255,101,132,0.3);
          color: #ff6584;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          text-align: center;
        }
        .download-result {
          background: rgba(67,233,123,0.1);
          border: 1px solid rgba(67,233,123,0.3);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }
        .download-result p {
          color: #43e97b;
          font-size: 14px;
        }
        .download-link {
          background: #43e97b;
          color: #0d0d14;
          padding: 12px 28px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          font-family: 'Noto Kufi Arabic', sans-serif;
          transition: all 0.2s;
        }
        .download-link:hover { background: #2ecc71; transform: scale(1.03); }
        .platforms {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }
        .platform-tag {
          background: rgba(255,101,132,0.1);
          border: 1px solid rgba(255,101,132,0.2);
          color: #ff6584;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 24px 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 0;
          max-height: calc(100vh - 260px);
        }
        .empty-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #6b6b80;
          padding: 40px 0;
        }
        .empty-chat .big-icon { font-size: 48px; }
        .empty-chat p { font-size: 14px; }
        .message { display: flex; gap: 10px; animation: fadeSlide 0.2s ease; }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .message.user { flex-direction: row-reverse; }
        .msg-avatar {
          width: 32px; height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .msg-avatar.bot-av { background: #1a1a24; border: 1px solid #2a2a3a; }
        .msg-avatar.user-av {
          background: rgba(108,99,255,0.2);
          border: 1px solid rgba(108,99,255,0.3);
          font-size: 13px;
          color: #6c63ff;
          font-weight: 600;
        }
        .msg-bubble {
          max-width: 72%;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 14px;
          line-height: 1.7;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .message.assistant .msg-bubble {
          background: #111118;
          border: 1px solid #2a2a3a;
          color: #e8e8f0;
          border-radius: 4px 14px 14px 14px;
        }
        .message.user .msg-bubble {
          background: rgba(108,99,255,0.15);
          border: 1px solid rgba(108,99,255,0.25);
          color: #e8e8f0;
          border-radius: 14px 4px 14px 14px;
        }
        .typing-indicator {
          display: flex;
          gap: 5px;
          padding: 14px 16px;
          background: #111118;
          border: 1px solid #2a2a3a;
          border-radius: 4px 14px 14px 14px;
          width: fit-content;
        }
        .typing-indicator span {
          width: 7px; height: 7px;
          background: #6b6b80;
          border-radius: 50%;
          animation: bounce 1.2s infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.1); opacity: 1; }
        }
        .error-msg {
          background: rgba(255,101,132,0.1);
          border: 1px solid rgba(255,101,132,0.3);
          color: #ff6584;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          margin: 8px 0;
        }
        .input-area { padding: 16px 0 24px; border-top: 1px solid #1e1e2e; }
        .input-box {
          display: flex;
          gap: 10px;
          background: #111118;
          border: 1px solid #2a2a3a;
          border-radius: 14px;
          padding: 10px 14px;
          transition: border-color 0.2s;
        }
        .input-box:focus-within {
          border-color: rgba(108,99,255,0.5);
          box-shadow: 0 0 0 3px rgba(108,99,255,0.08);
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
        .input-box textarea::placeholder { color: #6b6b80; }
        .send-btn {
          background: #6c63ff;
          border: none;
          color: white;
          width: 38px; height: 38px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.15s;
          flex-shrink: 0;
          align-self: flex-end;
        }
        .send-btn:hover:not(:disabled) { background: #7c74ff; transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .input-hint {
          font-size: 11px;
          color: #3a3a4a;
          text-align: center;
          margin-top: 8px;
          font-family: 'IBM Plex Mono', monospace;
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
                    "--card-glow": `linear-gradient(135deg, ${b.color}10 0%, transparent 100%)`,
                    "--card-shadow": `${b.color}20`,
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
          // واجهة صياد المقاطع الحقيقية
          <div className="chat-screen">
            <div className="chat-header">
              <button className="back-btn" onClick={() => setSelectedBot(null)}>
                ← رجوع
              </button>
              <div className="chat-bot-info">
                <div className="chat-bot-icon">📥</div>
                <div>
                  <div className="chat-bot-name">صياد المقاطع</div>
                  <div className="chat-bot-status">
                    <div className="status-dot"></div>
                    متصل
                  </div>
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
                  onChange={(e) => {
                    setMediaUrl(e.target.value);
                    setDownloadUrl("");
                    setMediaError("");
                  }}
                />

                <button
                  className="media-btn"
                  onClick={handleDownload}
                  disabled={mediaLoading || !mediaUrl.trim()}
                >
                  {mediaLoading ? "⌛ جاري التنزيل..." : "⬇️ تنزيل الآن"}
                </button>

                {mediaError && (
                  <div className="media-error">⚠️ {mediaError}</div>
                )}

                {downloadUrl && (
                  <div className="download-result">
                    <p>✅ جاهز للتنزيل!</p>
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="download-link"
                    >
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
              <button className="back-btn" onClick={() => setSelectedBot(null)}>
                ← رجوع
              </button>
              <div className="chat-bot-info">
                <div className="chat-bot-icon">{bot?.icon}</div>
                <div>
                  <div className="chat-bot-name">{bot?.name}</div>
                  <div className="chat-bot-status">
                    <div className="status-dot"></div>
                    متصل
                  </div>
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
                    <div className="msg-bubble">{msg.content}</div>
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
                <button
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                >
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
