import { useEffect, useMemo, useRef, useState } from "react";
import { chatApi } from "../../utils/api";

// ─── Types ──────────────────────────────────────────────────────────────────

type Suggestion = {
  id: string;
  name: string;
  price?: string | number;
  thumbnailUrl?: string;
};

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  suggestions?: Suggestion[];
  sources?: string[];
  timestamp: Date;
};

interface ChatPanelProps {
  onClose?: () => void;
  onMinimize?: () => void;
  fullscreen?: boolean;
  incomingNotification?: ChatMsg | null;
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "🔄 Đổi trả hàng", value: "Chính sách đổi trả như thế nào?" },
  { label: "📦 Cách đặt hàng", value: "Hướng dẫn cách đặt hàng" },
  { label: "🔥 Sản phẩm hot", value: "Sản phẩm bán chạy nhất hiện tại" },
  { label: "💡 Tư vấn 15 triệu", value: "Tư vấn laptop tầm 15 triệu" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date) {
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

// ─── Typing Indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="ss-chat-msg-row ss-chat-msg-row--bot">
      <div className="ss-chat-avatar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M4 5h16v9H7l-3 3V5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="ss-chat-bubble ss-chat-bubble--bot ss-typing">
        <span className="ss-dot" style={{ animationDelay: "0ms" }} />
        <span className="ss-dot" style={{ animationDelay: "180ms" }} />
        <span className="ss-dot" style={{ animationDelay: "360ms" }} />
      </div>
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === "user";

  return (
    <div className={`ss-chat-msg-row ${isUser ? "ss-chat-msg-row--user" : "ss-chat-msg-row--bot"}`}>
      {!isUser && (
        <div className="ss-chat-avatar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 5h16v9H7l-3 3V5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      <div className="ss-chat-msg-content">
        <div className={`ss-chat-bubble ${isUser ? "ss-chat-bubble--user" : "ss-chat-bubble--bot"}`}>
          <p className="ss-chat-text">{msg.content}</p>

          {/* Product Suggestions */}
          {!!msg.suggestions?.length && (
            <div className="ss-suggestions">
              {msg.suggestions.map((p) => (
                <a key={p.id} href={`/products/${p.id}`} className="ss-suggestion-card">
                  <div className="ss-suggestion-img">
                    {p.thumbnailUrl ? (
                      <img src={p.thumbnailUrl} alt={p.name} />
                    ) : (
                      <div className="ss-suggestion-img-placeholder">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="#94a3b8" strokeWidth="1.5" />
                          <circle cx="8.5" cy="8.5" r="1.5" fill="#94a3b8" />
                          <path d="M21 15l-5-5L5 21" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="ss-suggestion-info">
                    <span className="ss-suggestion-name">{p.name}</span>
                    {p.price && (
                      <span className="ss-suggestion-price">
                        {typeof p.price === "number"
                          ? p.price.toLocaleString("vi-VN") + "₫"
                          : p.price}
                      </span>
                    )}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="ss-suggestion-arrow">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              ))}
            </div>
          )}

          {/* Sources */}
          {!!msg.sources?.length && (
            <div className="ss-sources">
              <span className="ss-sources-label">Nguồn:</span>
              {msg.sources.map((s, i) => (
                <span key={i} className="ss-source-item">• {s}</span>
              ))}
            </div>
          )}
        </div>

        <span className="ss-chat-time">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

export default function ChatPanel({ onClose, onMinimize, fullscreen, incomingNotification }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: "Xin chào! 👋 Tôi là trợ lý SecureShop. Tôi có thể giúp bạn về chính sách, đặt hàng, tư vấn sản phẩm và nhiều hơn nữa!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Nhận thông báo từ WebSocket
  useEffect(() => {
    if (incomingNotification) {
      setMessages((m) => {
        // Ngăn chặn duplicate (so sánh tham chiếu object)
        if (m.length > 0 && m[m.length - 1] === incomingNotification) return m;
        return [...m, incomingNotification];
      });
    }
  }, [incomingNotification]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg, timestamp: new Date() }]);
    setLoading(true);
    try {
      const res = await chatApi.ask(msg);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: res.answer || "Mình đã ghi nhận câu hỏi nhé.",
          suggestions: res.suggestions as Suggestion[] | undefined,
          sources: (res as any).sources,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      {/* Scoped styles */}
      <style>{`
        .ss-panel {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .ss-panel--window {
          width: 360px;
          height: 540px;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .ss-panel--fullscreen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          border-radius: 0;
        }

        /* ── Header ── */
        .ss-header {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          height: 64px;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%);
          color: white;
        }
        .ss-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .ss-header-avatar {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          border: 2px solid rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ss-header-info {
          min-width: 0;
        }
        .ss-header-name {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ss-header-status {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 2px;
        }
        .ss-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 0 2px rgba(74,222,128,0.3);
          animation: ss-pulse 2s ease-in-out infinite;
        }
        @keyframes ss-pulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(74,222,128,0.3); }
          50% { box-shadow: 0 0 0 4px rgba(74,222,128,0.15); }
        }
        .ss-header-status-text {
          font-size: 11px;
          opacity: 0.9;
          font-weight: 500;
        }
        .ss-header-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .ss-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: rgba(255,255,255,0.12);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .ss-icon-btn:hover {
          background: rgba(255,255,255,0.22);
        }
        .ss-icon-btn:active {
          transform: scale(0.93);
        }

        /* ── Messages ── */
        .ss-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scroll-behavior: smooth;
        }
        .ss-messages::-webkit-scrollbar { width: 4px; }
        .ss-messages::-webkit-scrollbar-track { background: transparent; }
        .ss-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

        .ss-chat-msg-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          animation: ss-fadeIn 0.25s ease-out;
        }
        @keyframes ss-fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ss-chat-msg-row--user { flex-direction: row-reverse; }
        .ss-chat-msg-row--bot { flex-direction: row; }

        .ss-chat-avatar {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        .ss-chat-msg-content {
          display: flex;
          flex-direction: column;
          max-width: 75%;
        }
        .ss-chat-msg-row--user .ss-chat-msg-content { align-items: flex-end; }
        .ss-chat-msg-row--bot .ss-chat-msg-content { align-items: flex-start; }

        .ss-chat-bubble {
          padding: 10px 14px;
          border-radius: 16px;
          word-break: break-word;
        }
        .ss-chat-bubble--user {
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: white;
          border-radius: 16px 16px 4px 16px;
        }
        .ss-chat-bubble--bot {
          background: white;
          color: #1e293b;
          border: 1px solid #e5e7eb;
          border-radius: 16px 16px 16px 4px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .ss-chat-text {
          font-size: 13.5px;
          line-height: 1.55;
          margin: 0;
          white-space: pre-wrap;
        }
        .ss-chat-time {
          font-size: 10.5px;
          color: #94a3b8;
          margin-top: 4px;
          padding: 0 2px;
        }

        /* ── Typing indicator ── */
        .ss-typing {
          padding: 12px 16px !important;
        }
        .ss-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #94a3b8;
          margin: 0 2px;
          animation: ss-bounce 1.2s ease-in-out infinite;
        }
        @keyframes ss-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }

        /* ── Product suggestions ── */
        .ss-suggestions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #f1f5f9;
        }
        .ss-suggestion-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: white;
          text-decoration: none;
          color: inherit;
          transition: all 0.15s;
        }
        .ss-suggestion-card:hover {
          border-color: #2563eb;
          box-shadow: 0 2px 8px rgba(37,99,235,0.1);
          transform: translateY(-1px);
        }
        .ss-suggestion-img {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border-radius: 8px;
          overflow: hidden;
          background: #f1f5f9;
        }
        .ss-suggestion-img img { width: 100%; height: 100%; object-fit: cover; }
        .ss-suggestion-img-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }
        .ss-suggestion-info { flex: 1; min-width: 0; }
        .ss-suggestion-name {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #1e293b;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          line-height: 1.35;
        }
        .ss-suggestion-price {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #16a34a;
          margin-top: 2px;
        }
        .ss-suggestion-arrow { color: #94a3b8; flex-shrink: 0; }

        /* ── Sources ── */
        .ss-sources {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          align-items: center;
        }
        .ss-sources-label { font-size: 10.5px; color: #94a3b8; font-weight: 500; }
        .ss-source-item { font-size: 10.5px; color: #94a3b8; }

        /* ── Quick Actions ── */
        .ss-quick-wrap {
          flex-shrink: 0;
          padding: 10px 12px;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .ss-quick-btn {
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 500;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: white;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .ss-quick-btn:hover {
          background: #eff6ff;
          border-color: #93c5fd;
          color: #2563eb;
        }
        .ss-quick-btn:active { transform: scale(0.96); }

        /* ── Input Area ── */
        .ss-input-area {
          flex-shrink: 0;
          padding: 12px;
          background: white;
          border-top: 1px solid #e5e7eb;
        }
        .ss-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ss-input {
          flex: 1;
          height: 42px;
          border-radius: 999px;
          border: 1.5px solid #e5e7eb;
          padding: 0 16px;
          font-size: 13.5px;
          font-family: inherit;
          background: #f8fafc;
          color: #1e293b;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          min-width: 0;
        }
        .ss-input::placeholder { color: #94a3b8; }
        .ss-input:focus {
          border-color: #2563eb;
          background: white;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
        }
        .ss-send-btn {
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(37,99,235,0.35);
        }
        .ss-send-btn:hover:not(:disabled) {
          transform: scale(1.06);
          box-shadow: 0 4px 12px rgba(37,99,235,0.45);
        }
        .ss-send-btn:active:not(:disabled) { transform: scale(0.95); }
        .ss-send-btn:disabled {
          background: #e2e8f0;
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.7;
        }
        .ss-footer-note {
          text-align: center;
          font-size: 10px;
          color: #cbd5e1;
          margin-top: 6px;
        }
      `}</style>

      <div className={`ss-panel ${fullscreen ? "ss-panel--fullscreen" : "ss-panel--window"}`}>

        {/* ─── Header ─── */}
        <div className="ss-header">
          <div className="ss-header-left">
            <div className="ss-header-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 5h16v9H7l-3 3V5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="ss-header-info">
              <div className="ss-header-name">SecureShop Assistant</div>
              <div className="ss-header-status">
                <span className="ss-status-dot" />
                <span className="ss-header-status-text">Trực tuyến • Phản hồi tức thì</span>
              </div>
            </div>
          </div>

          <div className="ss-header-actions">
            {onMinimize && (
              <button className="ss-icon-btn" onClick={onMinimize} title="Thu nhỏ" aria-label="Thu nhỏ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
            {onClose && (
              <button className="ss-icon-btn" onClick={onClose} title="Đóng" aria-label="Đóng chat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ─── Messages ─── */}
        <div ref={listRef} className="ss-messages">
          {messages.map((m, i) => (
            <MessageBubble key={i} msg={m} />
          ))}
          {loading && <TypingIndicator />}
        </div>

        {/* ─── Quick Actions ─── */}
        <div className="ss-quick-wrap">
          {QUICK_ACTIONS.map((q) => (
            <button key={q.value} className="ss-quick-btn" onClick={() => send(q.value)}>
              {q.label}
            </button>
          ))}
        </div>

        {/* ─── Input ─── */}
        <div className="ss-input-area">
          <form
            className="ss-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSend) send();
            }}
          >
            <input
              ref={inputRef}
              className="ss-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              autoComplete="off"
              aria-label="Nhập câu hỏi"
            />
            <button
              type="submit"
              className="ss-send-btn"
              disabled={!canSend}
              aria-label="Gửi tin nhắn"
              title="Gửi"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
          <div className="ss-footer-note">SecureShop · Hỗ trợ AI 24/7</div>
        </div>
      </div>
    </>
  );
}
