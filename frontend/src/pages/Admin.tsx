import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, FolderTree, Tag, ShoppingCart,
  Percent, Users, FileText, MessageSquare, BarChart3,
  Warehouse, Star, Store, ChevronRight, LogOut, Bell
} from 'lucide-react';
import { useAppSelector } from '../hooks';

interface AdminModule {
  default: React.FC<any>;
  loadData?: (page?: number, size?: number) => Promise<any>;
}

type TabKey =
  | 'dashboard' | 'products' | 'categories' | 'brands'
  | 'orders' | 'inventories' | 'discount' | 'users'
  | 'articles' | 'tickets' | 'analytics' | 'reviews' | 'pos';

const ALL_TABS: { key: TabKey; label: string; icon: React.ReactNode; group?: string }[] = [
  { key: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard className="w-4 h-4" />, group: 'main' },
  { key: 'pos', label: 'Bán hàng (POS)', icon: <Store className="w-4 h-4" />, group: 'main' },
  { key: 'products', label: 'Sản phẩm', icon: <Package className="w-4 h-4" />, group: 'catalog' },
  { key: 'categories', label: 'Danh mục', icon: <FolderTree className="w-4 h-4" />, group: 'catalog' },
  { key: 'brands', label: 'Thương hiệu', icon: <Tag className="w-4 h-4" />, group: 'catalog' },
  { key: 'orders', label: 'Đơn hàng', icon: <ShoppingCart className="w-4 h-4" />, group: 'ops' },
  { key: 'inventories', label: 'Tồn kho', icon: <Warehouse className="w-4 h-4" />, group: 'ops' },
  { key: 'discount', label: 'Khuyến mãi', icon: <Percent className="w-4 h-4" />, group: 'ops' },
  { key: 'users', label: 'Người dùng', icon: <Users className="w-4 h-4" />, group: 'system' },
  { key: 'articles', label: 'Bài viết', icon: <FileText className="w-4 h-4" />, group: 'system' },
  { key: 'tickets', label: 'Hỗ trợ', icon: <MessageSquare className="w-4 h-4" />, group: 'system' },
  { key: 'reviews', label: 'Đánh giá', icon: <Star className="w-4 h-4" />, group: 'system' },
  { key: 'analytics', label: 'Thống kê', icon: <BarChart3 className="w-4 h-4" />, group: 'system' },
];

const GROUPS = [
  { id: 'main', label: 'Chính' },
  { id: 'catalog', label: 'Danh mục' },
  { id: 'ops', label: 'Vận hành' },
  { id: 'system', label: 'Hệ thống' },
];

// POS gets no padding — fully manages its own layout
const POS_FULLSCREEN_TABS: TabKey[] = ['pos'];

const Admin: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  const visibleTabs = user?.role?.toLowerCase() === 'staff'
    ? ALL_TABS.filter(t => t.key === 'pos' || t.key === 'orders')
    : ALL_TABS;

  const defaultTab: TabKey = user?.role?.toLowerCase() === 'staff' ? 'pos' : 'dashboard';
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [LoadedComponent, setLoaded] = useState<React.FC<any> | null>(null);
  const [data, setData] = useState<any>(null);
  const [currentLoadData, setCLD] = useState<((p?: number, s?: number) => Promise<any>) | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Correct active tab if role changes
  useEffect(() => {
    const isStaff = user?.role?.toLowerCase() === 'staff';
    if (isStaff && !['pos', 'orders'].includes(activeTab)) setActiveTab('pos');
  }, [user?.role, activeTab]);

  const handlePageChange = async (page: number, size: number) => {
    setCurrentPage(page); setPageSize(size);
    if (currentLoadData) {
      setLoading(true);
      try { setData(await currentLoadData(page, size)); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
  };

  const reloadCurrentTab = async () => {
    if (currentLoadData) {
      setLoading(true);
      try { setData(await currentLoadData(currentPage, pageSize)); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadForTab = async (tab: TabKey) => {
      setLoading(true); setData(null); setLoaded(null);
      setCurrentPage(0); setPageSize(20);
      try {
        const mods: Record<TabKey, () => Promise<AdminModule>> = {
          dashboard: () => import('./admin/Dashboard'),
          pos: () => import('./admin/POS'),
          categories: () => import('./admin/Categories'),
          brands: () => import('./admin/Brands'),
          orders: () => import('./admin/Orders'),
          inventories: () => import('./admin/Inventories'),
          products: () => import('./admin/Products'),
          discount: () => import('./admin/Discount'),
          users: () => import('./admin/Users'),
          articles: () => import('./admin/Articles'),
          tickets: () => import('./admin/Tickets'),
          analytics: () => import('./admin/Analytics'),
          reviews: () => import('./admin/Reviews'),
        };
        const mod = await mods[tab]();
        if (!mounted) return;
        setLoaded(() => mod.default);
        setCLD(() => mod.loadData || (() => Promise.resolve(null)));
        const loader = tab === 'orders' ? () => mod.loadData?.(0, 20) ?? null : () => mod.loadData?.() ?? null;
        if (!['pos', 'analytics'].includes(tab)) setData(await loader());
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadForTab(activeTab);
    return () => { mounted = false; };
  }, [activeTab]);

  const isPosFullscreen = POS_FULLSCREEN_TABS.includes(activeTab);
  const tabLabel = ALL_TABS.find(t => t.key === activeTab)?.label ?? '';

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: '#f1f5f9' }}>

      {/* ════════════════════════════════════════
          SIDEBAR — Fixed left 240px
      ════════════════════════════════════════ */}
      <aside style={{
        width: 240, minWidth: 240, height: '100vh',
        background: '#1e1b4b',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', flexShrink: 0,
        position: 'relative', zIndex: 40,
      }}>
        {/* Brand */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>S</span>
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>SecureShop</p>
              <p style={{ color: '#818cf8', fontSize: 11, marginTop: 2 }}>Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {GROUPS.map(group => {
            const groupTabs = visibleTabs.filter(t => t.group === group.id);
            if (!groupTabs.length) return null;
            return (
              <div key={group.id} style={{ marginBottom: 20 }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, color: '#4c4a7a', textTransform: 'uppercase',
                  letterSpacing: '1px', padding: '0 8px', marginBottom: 4
                }}>
                  {group.label}
                </p>
                {groupTabs.map(tab => {
                  const active = activeTab === tab.key;
                  return (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 10px', borderRadius: 8, border: 'none',
                        cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                        background: active ? 'rgba(99,102,241,.25)' : 'transparent',
                        transition: 'all .15s ease',
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.06)'; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <span style={{ color: active ? '#818cf8' : '#6b7280', flexShrink: 0 }}>
                        {tab.icon}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: active ? 700 : 400, color: active ? '#e0e7ff' : '#9ca3af', flex: 1 }}>
                        {tab.label}
                      </span>
                      {active && <ChevronRight style={{ width: 12, height: 12, color: '#818cf8' }} />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8,
            background: 'rgba(255,255,255,.05)'
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
                {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#e0e7ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name ?? 'Admin'}
              </p>
              <p style={{ fontSize: 10, color: '#6366f1', fontWeight: 500 }}>
                {user?.role?.toUpperCase() ?? 'ADMIN'}
              </p>
            </div>
            <button title="Đăng xuất" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#4c4a7a', padding: 4, borderRadius: 6
            }}
              onMouseEnter={e => (e.currentTarget).style.color = '#ef4444'}
              onMouseLeave={e => (e.currentTarget).style.color = '#4c4a7a'}
              onClick={() => window.location.href = '/login'}>
              <LogOut style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════
          RIGHT SIDE: header + content
      ════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* TOP HEADER BAR — 56px */}
        <header style={{
          height: 56, flexShrink: 0,
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 16,
          zIndex: 30,
        }}>
          {/* Breadcrumb */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>SecureShop Admin</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{tabLabel}</p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{
              width: 36, height: 36, borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#64748b', position: 'relative',
            }}>
              <Bell style={{ width: 16, height: 16 }} />
              <span style={{
                position: 'absolute', top: 6, right: 6, width: 7, height: 7,
                background: '#ef4444', borderRadius: '50%', border: '1.5px solid #fff',
              }} />
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
              background: '#f8fafc', borderRadius: 8, border: '1.5px solid #e2e8f0'
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
                </span>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{user?.name ?? 'Admin'}</p>
                <p style={{ fontSize: 10, color: '#94a3b8' }}>{user?.email ?? ''}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════
            CONTENT AREA — fills remaining
        ══════════════════════════════════ */}
        <main style={{
          flex: 1,
          overflow: isPosFullscreen ? 'hidden' : 'auto',
          background: '#f1f5f9',
          padding: isPosFullscreen ? 0 : '24px',
          width: '100%',
          minWidth: 0,
        }}>

          {/* Loading */}
          {loading && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', minHeight: 300
            }}>
              <div style={{
                width: 40, height: 40, border: '3px solid #e0e7ff',
                borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin .7s linear infinite', marginBottom: 12
              }} />
              <p style={{ color: '#6366f1', fontWeight: 600, fontSize: 14 }}>Đang tải...</p>
            </div>
          )}

          {/* Content */}
          {!loading && LoadedComponent && (
            <LoadedComponent
              data={data}
              onReload={reloadCurrentTab}
              onPageChange={activeTab === 'orders' ? handlePageChange : undefined}
            />
          )}

          {/* Empty state */}
          {!loading && !LoadedComponent && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', minHeight: 300
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, background: '#ede9fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
              }}>
                <LayoutDashboard style={{ width: 28, height: 28, color: '#7c3aed' }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#475569' }}>Chọn mục từ sidebar để bắt đầu</p>
            </div>
          )}
        </main>
      </div>

      {/* Global spin keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Admin;
