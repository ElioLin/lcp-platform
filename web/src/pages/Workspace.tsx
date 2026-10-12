import { useState } from 'react';
import { App, Avatar, Button, Drawer, Dropdown, Empty, Menu, Tag } from 'antd';
import {
  AppstoreOutlined,
  DatabaseOutlined,
  LogoutOutlined,
  MenuOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { request, write } from '../api';
import { useAuth } from '../auth-context';
import { Brand, Failure, Loading } from '../ui';
import type { ObjectDefinition } from '../types';

export function Workspace() {
  const auth = useAuth();
  const client = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const objects = useQuery({
    queryKey: ['objects'],
    queryFn: () => request<ObjectDefinition[]>('/api/metadata/objects'),
    enabled: !!auth.user,
  });
  if (auth.loading) return <Loading />;
  if (!auth.user) return <Navigate to="/login" replace />;
  const user = auth.user;
  const published = objects.data?.filter((object) => object.state === 'PUBLISHED') ?? [];
  const menu = [
    { key: '/', icon: <AppstoreOutlined />, label: '工作台' },
    {
      type: 'group' as const,
      label: '业务对象',
      children: published.map((object) => ({
        key: `/objects/${object.name}`,
        icon: <DatabaseOutlined />,
        label: object.label,
      })),
    },
    ...(user.role === 'ADMIN'
      ? [
          {
            type: 'group' as const,
            label: '平台管理',
            children: [{ key: '/setup/objects', icon: <SettingOutlined />, label: '对象管理器' }],
          },
        ]
      : []),
  ];
  const selected = location.pathname.startsWith('/setup')
    ? '/setup/objects'
    : location.pathname.startsWith('/objects/')
      ? '/' + location.pathname.split('/').slice(1, 3).join('/')
      : '/';
  const sidebar = (
    <>
      <Brand />
      <div className="workspace-name">
        <span className="workspace-indicator" />
        默认工作空间
      </div>
      <Menu
        theme="dark"
        mode="inline"
        items={menu}
        selectedKeys={[selected]}
        onClick={({ key }) => {
          navigate(key);
          setMobileOpen(false);
        }}
      />
      <div className="sidebar-footer">
        <span className="status-dot" />
        业务工作空间
      </div>
    </>
  );
  async function logout() {
    try {
      await write('/api/auth/logout', 'POST');
      client.setQueryData(['auth'], null);
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
      navigate('/login');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '退出未完成');
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <aside className="sidebar">{sidebar}</aside>
      <Drawer
        placement="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        width={248}
        styles={{ body: { padding: 0, background: '#12223c' } }}
        title="工作空间导航"
      >
        {sidebar}
      </Drawer>
      <div className="app-body">
        <header className="topbar">
          <div className="topbar-start">
            <Button
              className="mobile-menu"
              aria-label="打开导航"
              icon={<MenuOutlined />}
              onClick={() => setMobileOpen(true)}
            />
            <span className="topbar-label">工作空间</span>
            <span className="topbar-divider">/</span>
            <strong>{location.pathname.startsWith('/setup') ? '平台配置' : '业务工作台'}</strong>
          </div>
          <div className="topbar-user">
            <Tag bordered={false}>{user.role === 'ADMIN' ? '平台管理员' : '业务用户'}</Tag>
            <Dropdown
              menu={{
                items: [
                  { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: logout },
                ],
              }}
              trigger={['click']}
            >
              <Button type="text" className="user-menu">
                <Avatar size={30} style={{ background: '#dce8fb', color: '#2456a6' }}>
                  {user.displayName.slice(0, 1)}
                </Avatar>
                <span>{user.displayName}</span>
              </Button>
            </Dropdown>
          </div>
        </header>
        <main id="main-content" className="main-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          LCP · 领枢业务平台<span>让业务有序流动</span>
        </footer>
      </div>
    </div>
  );
}
export function Home() {
  const { user } = useAuth();
  const objects = useQuery({
    queryKey: ['objects'],
    queryFn: () => request<ObjectDefinition[]>('/api/metadata/objects'),
  });
  const published = objects.data?.filter((object) => object.state === 'PUBLISHED') ?? [];
  if (objects.isPending) return <Loading />;
  if (objects.error) return <Failure error={objects.error} retry={() => objects.refetch()} />;
  if (published.length) return <Navigate to={`/objects/${published[0].name}`} replace />;
  return (
    <div className="welcome-panel">
      <span className="eyebrow">工作台</span>
      <h1>欢迎，{user?.displayName}</h1>
      <Empty description="工作空间还没有已发布的业务对象" />
      {user?.role === 'ADMIN' && (
        <Link to="/setup/objects">
          <Button type="primary" icon={<PlusOutlined />}>
            配置第一个业务对象
          </Button>
        </Link>
      )}
    </div>
  );
}
