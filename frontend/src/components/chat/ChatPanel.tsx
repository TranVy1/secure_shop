import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { liveChatApi } from "../../utils/api";
import { Client } from "@stomp/stompjs";

// ─── Types ──────────────────────────────────────────────────────────────────

type ChatMsg = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  senderType?: string;
  timestamp: Date;
};

interface ChatPanelProps {
  onClose?: () => void;
  onMinimize?: () => void;
  fullscreen?: boolean;
  stompClient: Client | null;
  stompConnected: boolean;
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "🔄 Đổi trả hàng", value: "Chính sách đổi trả như thế nào?" },
  { label: "📦 Cách đặt hàng", value: "Hướng dẫn cách đặt hàng" },
  { label: "🔥 Sản phẩm hot", value: "Sản phẩm bán chạy nhất hiện tại" },
  { label: "👨‍💼 Gặp tư vấn viên", value: "Tôi muốn gặp tư vấn viên" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date) {
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function mapSenderType(senderType?: string): "user" | "assistant" | "system" {
  if (senderType === "USER") return "user";
  if (senderType === "SYSTEM") return "system";
  return "assistant"; // BOT, ADMIN
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
  const isSystem = msg.role === "system";

  if (isSystem) {
    return (
      <div className="ss-chat-msg-row" style={{ justifyContent: "center" }}>
        <div style={{
          padding: "4px 12px",
          borderRadius: 999,
          background: "#f1f5f9",
          color: "#64748b",
          fontSize: 11,
          fontWeight: 500,
          textAlign: "center",
        }}>
          {msg.content}
        </div>
      </div>
    );
  }

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
        {!isUser && msg.senderType === "ADMIN" && (
          <span style={{ fontSize: 10, color: "#6366f1", fontWeight: 600, marginBottom: 2 }}>
            👤 Nhân viên hỗ trợ
          </span>
        )}
        <div className={`ss-chat-bubble ${isUser ? "ss-chat-bubble--user" : "ss-chat-bubble--bot"}`}>
          <p className="ss-chat-text">{msg.content}</p>
        </div>
        <span className="ss-chat-time">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

export default function ChatPanel({ onClose, onMinimize, fullscreen, stompClient, stompConnected }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initDone, setInitDone] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const processedIds = useRef<Set<string>>(new Set());

  const canSend = useMemo(() => input.trim().length > 0 && !loading && stompConnected && sessionId, [input, loading, stompConnected, sessionId]);

  // Auto-scroll
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Initialize: Lấy session + load history
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setMessages([{
        role: "assistant",
        content: "Vui lòng đăng nhập để sử dụng chat hỗ trợ trực tuyến! 🔐",
        timestamp: new Date(),
      }]);
      setInitDone(true);
      return;
    }

    let cancelled = false;
    const init = async () => {
      try {
        const session = await liveChatApi.getMySession();
        if (cancelled) return;
        setSessionId(session.id);

        const history = await liveChatApi.getSessionHistory(session.id);
        if (cancelled) return;

        const mapped: ChatMsg[] = history.map((m: any) => {
          processedIds.current.add(m.id);
          return {
            id: m.id,
            role: mapSenderType(m.senderType),
            content: m.content,
            senderType: m.senderType,
            timestamp: new Date(m.createdAt),
          };
        });

        setMessages(mapped.length > 0 ? mapped : [{
          role: "assistant",
          content: "Xin chào! 👋 Tôi là trợ lý SecureShop. Tôi có thể giúp bạn về chính sách, đặt hàng, tư vấn sản phẩm và nhiều hơn nữa!",
          timestamp: new Date(),
        }]);
      } catch (err) {
        console.error("Failed to init chat session:", err);
        if (!cancelled) {
          setMessages([{
            role: "assistant",
            content: "Không thể kết nối chat. Vui lòng thử lại sau.",
            timestamp: new Date(),
          }]);
        }
      } finally {
        if (!cancelled) setInitDone(true);
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // Subscribe STOMP cho tin nhắn real-time
  const handleStompMessage = useCallback((msgBody: any) => {
    // Tránh duplicate: nếu đã xử lý ID này rồi thì bỏ qua
    if (msgBody.id && processedIds.current.has(msgBody.id)) return;
    if (msgBody.id) processedIds.current.add(msgBody.id);

    // Không hiển thị tin nhắn USER của chính mình (đã add khi send)
    if (msgBody.senderType === "USER") return;

    const newMsg: ChatMsg = {
      id: msgBody.id,
      role: mapSenderType(msgBody.senderType),
      content: msgBody.content,
      senderType: msgBody.senderType,
      timestamp: new Date(msgBody.createdAt || Date.now()),
    };
    setMessages((prev) => [...prev, newMsg]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!stompClient || !stompConnected) return;

    const sub = stompClient.subscribe("/user/queue/chat", (message) => {
      try {
        const body = JSON.parse(message.body);
        handleStompMessage(body);
      } catch (e) {
        console.error("Failed to parse STOMP chat message:", e);
      }
    });

    return () => {
      try { sub.unsubscribe(); } catch { /* ignore */ }
    };
  }, [stompClient, stompConnected, handleStompMessage]);

  // Send message
  const send = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || !stompClient || !stompConnected || !sessionId) return;
    
    setInput("");
    
    // Optimistic: thêm tin nhắn ngay lập tức
    setMessages((m) => [...m, {
      role: "user",
      content: msg,
      senderType: "USER",
      timestamp: new Date(),
    }]);
    
    setLoading(true);

    // Gửi qua STOMP
    stompClient.publish({
      destination: "/app/chat.user.send",
      body: JSON.stringify({ content: msg, sessionId }),
    });

    // Auto-hide loading sau 15s nếu không nhận được reply
    setTimeout(() => setLoading(false), 15000);
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
        .ss-status-dot--offline {
          background: #94a3b8;
          box-shadow: none;
          animation: none;
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
                <span className={`ss-status-dot ${stompConnected ? '' : 'ss-status-dot--offline'}`} />
                <span className="ss-header-status-text">
                  {stompConnected ? "Trực tuyến • Phản hồi tức thì" : "Đang kết nối..."}
                </span>
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
          {!initDone && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
              <TypingIndicator />
            </div>
          )}
          {initDone && messages.map((m, i) => (
            <MessageBubble key={m.id || `msg-${i}`} msg={m} />
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
              placeholder={stompConnected ? "Nhập câu hỏi của bạn..." : "Đang kết nối..."}
              autoComplete="off"
              aria-label="Nhập câu hỏi"
              disabled={!stompConnected || !sessionId}
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
          <div className="ss-footer-note">SecureShop · Chat trực tuyến 24/7</div>
        </div>
      </div>
    </>
  );
}
