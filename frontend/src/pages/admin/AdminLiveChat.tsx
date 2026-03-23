import React, { useEffect, useRef, useState, useCallback } from 'react';
import { liveChatApi } from '../../utils/api';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  MessageCircle, Send, UserCheck, X, RefreshCw, Clock,
  User as UserIcon, ChevronRight
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  adminId?: string;
  adminName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: 'USER' | 'ADMIN' | 'BOT' | 'SYSTEM';
  senderId?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const S = {
  container: { display: 'flex', height: 'calc(100vh - 56px - 48px)', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' } as React.CSSProperties,
  sidebar: { width: 340, minWidth: 340, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#fafbfc' } as React.CSSProperties,
  sidebarHeader: { padding: '16px 16px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' } as React.CSSProperties,
  sessionList: { flex: 1, overflowY: 'auto', padding: '8px' } as React.CSSProperties,
  sessionItem: (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderRadius: 10,
    cursor: 'pointer', transition: 'all 0.15s', marginBottom: 4,
    background: active ? '#eff6ff' : 'transparent',
    border: active ? '1px solid #bfdbfe' : '1px solid transparent',
  } as React.CSSProperties),
  avatar: (color: string) => ({
    width: 40, height: 40, borderRadius: '50%', background: color,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    color: '#fff', fontWeight: 700, fontSize: 14,
  } as React.CSSProperties),
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 } as React.CSSProperties,
  chatHeader: { padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', flexShrink: 0 } as React.CSSProperties,
  messageList: { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc' } as React.CSSProperties,
  inputArea: { padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: '#fff', flexShrink: 0 } as React.CSSProperties,
  btn: (variant: 'primary' | 'ghost' | 'danger') => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
    borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
    transition: 'all 0.15s',
    ...(variant === 'primary' ? { background: '#6366f1', color: '#fff' } :
      variant === 'danger' ? { background: '#fee2e2', color: '#dc2626' } :
        { background: '#f1f5f9', color: '#475569' }),
  } as React.CSSProperties),
};

// ─── Component ──────────────────────────────────────────────────────────────

const AdminLiveChat: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const stompRef = useRef<Client | null>(null);
  const [stompConnected, setStompConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedIds = useRef<Set<string>>(new Set());

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load sessions
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const data = await liveChatApi.getActiveSessions();
      setSessions(data);
    } catch (e) {
      console.error('Failed to load sessions:', e);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // STOMP connection
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090/api';
    const wsUrl = API_URL.replace('/api', '') + '/ws';

    let cancelled = false;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: (str) => {
        if (str.includes('CONNECT') || str.includes('CONNECTED') || str.includes('ERROR') || str.includes('DISCONNECT')) {
          console.log('STOMP Admin: ' + str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      if (cancelled) return;
      setStompConnected(true);

      // Nhận tin nhắn admin chat
      client.subscribe('/user/queue/admin.chat', (message) => {
        try {
          const msg: ChatMessage = JSON.parse(message.body);
          if (msg.id && processedIds.current.has(msg.id)) return;
          if (msg.id) processedIds.current.add(msg.id);
          setMessages(prev => [...prev, msg]);
        } catch (e) {
          console.error('Failed to parse admin chat:', e);
        }
      });

      // Nhận alert khi user yêu cầu tư vấn viên
      client.subscribe('/topic/admin.chat-sessions', () => {
        // Refresh danh sách sessions
        loadSessions();
      });
    };

    client.onStompError = (frame) => {
      console.error('STOMP Admin error:', frame.headers['message'], frame.body);
    };

    client.onWebSocketError = (event) => {
      console.error('WebSocket Admin error:', event);
    };

    client.onWebSocketClose = () => {
      if (!cancelled) setStompConnected(false);
    };

    client.onDisconnect = () => {
      if (!cancelled) setStompConnected(false);
    };

    client.activate();
    stompRef.current = client;

    return () => {
      cancelled = true;
      setStompConnected(false);
      stompRef.current = null;
      if (client.active) {
        client.deactivate();
      }
    };
  }, [loadSessions]);

  // Load messages khi chọn session
  const selectSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setLoadingMessages(true);
    processedIds.current.clear();
    try {
      const history = await liveChatApi.getSessionHistory(sessionId);
      history.forEach((m: ChatMessage) => processedIds.current.add(m.id));
      setMessages(history);
    } catch (e) {
      console.error('Failed to load messages:', e);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Assign session
  const handleAssign = async (sessionId: string) => {
    try {
      await liveChatApi.assignSession(sessionId);
      await loadSessions();
    } catch (e) {
      console.error('Failed to assign session:', e);
    }
  };

  // Close session
  const handleClose = async (sessionId: string) => {
    try {
      await liveChatApi.closeSession(sessionId);
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
        setMessages([]);
      }
      await loadSessions();
    } catch (e) {
      console.error('Failed to close session:', e);
    }
  };

  // Send message
  const sendMessage = () => {
    const msg = input.trim();
    if (!msg || !stompRef.current || !stompConnected || !selectedSessionId) return;
    setInput('');
    stompRef.current.publish({
      destination: '/app/chat.admin.send',
      body: JSON.stringify({ sessionId: selectedSessionId, content: msg }),
    });
  };

  return (
    <div style={S.container}>
      {/* ═══════ SIDEBAR: Session List ═══════ */}
      <div style={S.sidebar}>
        <div style={S.sidebarHeader}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>Chat trực tiếp</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
              {sessions.length} phiên đang hoạt động
              {stompConnected && <span style={{ color: '#22c55e' }}> • Live</span>}
            </p>
          </div>
          <button onClick={loadSessions} style={S.btn('ghost')} title="Làm mới">
            <RefreshCw style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div style={S.sessionList as React.CSSProperties}>
          {loadingSessions && (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              Đang tải...
            </div>
          )}
          {!loadingSessions && sessions.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <MessageCircle style={{ width: 32, height: 32, color: '#cbd5e1', marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Chưa có phiên chat nào</p>
            </div>
          )}
          {sessions.map(s => (
            <div
              key={s.id}
              style={S.sessionItem(selectedSessionId === s.id)}
              onClick={() => selectSession(s.id)}
              onMouseEnter={e => { if (selectedSessionId !== s.id) (e.currentTarget).style.background = '#f1f5f9'; }}
              onMouseLeave={e => { if (selectedSessionId !== s.id) (e.currentTarget).style.background = 'transparent'; }}
            >
              <div style={S.avatar(s.adminId ? '#6366f1' : '#f59e0b')}>
                {s.userName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.userName || 'Khách'}
                  </p>
                  <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>
                    {timeAgo(s.updatedAt)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  {s.adminId ? (
                    <span style={{ fontSize: 10, background: '#dbeafe', color: '#2563eb', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                      Đã tiếp nhận
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, background: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                      Chờ tiếp nhận
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight style={{ width: 14, height: 14, color: '#cbd5e1', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ CHAT AREA ═══════ */}
      <div style={S.chatArea as React.CSSProperties}>
        {!selectedSessionId ? (
          // Empty state
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, background: '#ede9fe',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <MessageCircle style={{ width: 28, height: 28, color: '#7c3aed' }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', margin: 0 }}>
              Chọn một phiên chat để bắt đầu
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, maxWidth: 280, textAlign: 'center' }}>
              Khi khách hàng yêu cầu hỗ trợ, phiên chat sẽ hiện ở danh sách bên trái
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div style={S.chatHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={S.avatar('#6366f1')}>
                  {selectedSession?.userName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                    {selectedSession?.userName || 'Khách'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock style={{ width: 10, height: 10, color: '#94a3b8' }} />
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {selectedSession?.createdAt ? timeAgo(selectedSession.createdAt) : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!selectedSession?.adminId && (
                  <button
                    style={S.btn('primary')}
                    onClick={() => handleAssign(selectedSessionId)}
                  >
                    <UserCheck style={{ width: 13, height: 13 }} /> Tiếp nhận
                  </button>
                )}
                <button
                  style={S.btn('danger')}
                  onClick={() => handleClose(selectedSessionId)}
                >
                  <X style={{ width: 13, height: 13 }} /> Đóng
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={S.messageList as React.CSSProperties}>
              {loadingMessages ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  Đang tải tin nhắn...
                </div>
              ) : (
                messages.map((m) => {
                  const isSystem = m.senderType === 'SYSTEM' || m.senderType === 'BOT';
                  const isAdmin = m.senderType === 'ADMIN';
                  const isUser = m.senderType === 'USER';

                  if (isSystem) {
                    return (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'center' }}>
                        <span style={{
                          fontSize: 11, color: '#64748b', background: '#f1f5f9',
                          padding: '3px 12px', borderRadius: 999, fontWeight: 500,
                        }}>
                          {m.senderType === 'BOT' ? '🤖 ' : '⚙️ '}{m.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={m.id} style={{
                      display: 'flex',
                      justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                      gap: 8,
                    }}>
                      {isUser && (
                        <div style={S.avatar('#f59e0b')}>
                          <UserIcon style={{ width: 16, height: 16 }} />
                        </div>
                      )}
                      <div style={{
                        maxWidth: '65%', padding: '10px 14px', borderRadius: 14,
                        ...(isAdmin
                          ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderBottomRightRadius: 4 }
                          : { background: '#fff', color: '#1e293b', border: '1px solid #e2e8f0', borderBottomLeftRadius: 4 }),
                      }}>
                        <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                          {m.content}
                        </p>
                        <p style={{
                          fontSize: 10, margin: '4px 0 0',
                          color: isAdmin ? 'rgba(255,255,255,0.7)' : '#94a3b8',
                          textAlign: isAdmin ? 'right' : 'left',
                        }}>
                          {formatTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={S.inputArea}>
              {selectedSession?.adminId ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  style={{ display: 'flex', gap: 8 }}
                >
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    style={{
                      flex: 1, height: 40, borderRadius: 10, border: '1.5px solid #e2e8f0',
                      padding: '0 14px', fontSize: 13, fontFamily: 'inherit', background: '#f8fafc',
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => (e.target).style.borderColor = '#6366f1'}
                    onBlur={e => (e.target).style.borderColor = '#e2e8f0'}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || !stompConnected}
                    style={{
                      width: 40, height: 40, borderRadius: 10, border: 'none',
                      background: input.trim() && stompConnected ? '#6366f1' : '#e2e8f0',
                      color: '#fff', cursor: input.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Send style={{ width: 16, height: 16 }} />
                  </button>
                </form>
              ) : (
                <div style={{
                  padding: 12, textAlign: 'center', background: '#fef3c7',
                  borderRadius: 10, color: '#92400e', fontSize: 12, fontWeight: 500,
                }}>
                  ⚠️ Bạn cần bấm "Tiếp nhận" để bắt đầu chat với khách hàng
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminLiveChat;

// loadData export cho Admin.tsx dynamic import
export const loadData = () => Promise.resolve(null);
