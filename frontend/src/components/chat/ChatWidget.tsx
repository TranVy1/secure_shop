import { useEffect, useRef, useState } from "react";
import ChatPanel from "./ChatPanel";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [unread, setUnread] = useState(0);
  const wasOpenRef = useRef(false);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Track unread count when minimized
  useEffect(() => {
    if (open) {
      setUnread(0);
      wasOpenRef.current = true;
    }
  }, [open]);

  const handleToggle = () => {
    setOpen((v) => !v);
    setMinimized(false);
    if (!open) setUnread(0);
  };

  const handleClose = () => {
    setOpen(false);
    setMinimized(false);
  };

  const handleMinimize = () => {
    setOpen(false);
    setMinimized(true);
  };

  return (
    <>
      <style>{`
        /* ── Widget scoped styles ── */
        .ss-widget-panel-enter {
          animation: ss-widget-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes ss-widget-in {
          from { opacity: 0; transform: scale(0.85) translateY(20px); transform-origin: bottom right; }
          to   { opacity: 1; transform: scale(1)    translateY(0);    transform-origin: bottom right; }
        }

        .ss-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9990;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(37,99,235,0.45), 0 1px 6px rgba(0,0,0,0.1);
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
          outline: none;
        }
        .ss-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 8px 28px rgba(37,99,235,0.55), 0 2px 8px rgba(0,0,0,0.12);
        }
        .ss-fab:active { transform: scale(0.95); }
        .ss-fab:focus-visible {
          box-shadow: 0 0 0 3px white, 0 0 0 5px #2563eb;
        }

        .ss-fab-icon {
          position: absolute;
          transition: opacity 0.2s, transform 0.2s;
        }
        .ss-fab-icon--chat { opacity: 1; transform: scale(1); }
        .ss-fab-icon--chat.ss-hidden { opacity: 0; transform: scale(0.5); }
        .ss-fab-icon--close { opacity: 0; transform: scale(0.5); }
        .ss-fab-icon--close.ss-visible { opacity: 1; transform: scale(1); }

        .ss-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid white;
          animation: ss-badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes ss-badge-pop {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }

        .ss-minimized-chip {
          position: fixed;
          bottom: 90px;
          right: 24px;
          z-index: 9990;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px 8px 10px;
          border-radius: 999px;
          background: white;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          border: 1px solid #e5e7eb;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          font-family: 'Inter', -apple-system, sans-serif;
          animation: ss-widget-in 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;
          transition: box-shadow 0.15s;
        }
        .ss-minimized-chip:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.16);
        }
        .ss-minimized-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
        }

        /* Panel wrapper */
        .ss-panel-wrapper {
          position: fixed;
          bottom: 92px;
          right: 24px;
          z-index: 9991;
        }

        /* Mobile: fullscreen */
        @media (max-width: 640px) {
          .ss-fab { bottom: 16px; right: 16px; }
          .ss-panel-wrapper { display: none; }
          .ss-panel-fullscreen-wrapper {
            position: fixed; inset: 0; z-index: 9999;
            animation: ss-widget-in 0.25s ease-out forwards;
          }
        }
        @media (min-width: 641px) {
          .ss-panel-fullscreen-wrapper { display: none; }
        }
      `}</style>

      {/* ── FAB Toggle Button ── */}
      <button
        className="ss-fab"
        onClick={handleToggle}
        aria-label={open ? "Đóng chat" : "Mở chat hỗ trợ"}
        title="Chat hỗ trợ SecureShop"
      >
        {/* Chat icon */}
        <span className={`ss-fab-icon ss-fab-icon--chat ${open ? "ss-hidden" : ""}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 5h16v9H7l-3 3V5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {/* Close icon */}
        <span className={`ss-fab-icon ss-fab-icon--close ${open ? "ss-visible" : ""}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </span>

        {/* Unread badge */}
        {!open && unread > 0 && (
          <span className="ss-badge">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {/* ── Minimized indicator ── */}
      {minimized && !open && (
        <button
          className="ss-minimized-chip"
          onClick={() => { setOpen(true); setMinimized(false); }}
          aria-label="Mở lại chat"
        >
          <span className="ss-minimized-dot" />
          SecureShop Assistant
        </button>
      )}

      {/* ── Desktop Panel ── */}
      {open && (
        <div className="ss-panel-wrapper ss-widget-panel-enter">
          <ChatPanel onClose={handleClose} onMinimize={handleMinimize} />
        </div>
      )}

      {/* ── Mobile Fullscreen Panel ── */}
      {open && (
        <div className="ss-panel-fullscreen-wrapper">
          <ChatPanel onClose={handleClose} fullscreen />
        </div>
      )}
    </>
  );
}
