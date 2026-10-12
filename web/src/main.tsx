import React from 'react';
import ReactDOM from 'react-dom/client';
import { App, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth';
import { Login } from './pages/Login';
import { Home, Workspace } from './pages/Workspace';
import { RecordList } from './pages/RecordList';
import { RecordDetail } from './pages/RecordDetail';
import { ObjectConfiguration, ObjectManager } from './pages/ObjectManager';
import 'antd/dist/reset.css';
import './styles.css';

const queries = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15000 } },
});
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#245fd1',
          borderRadius: 7,
          colorText: '#172b46',
          colorTextSecondary: '#64748b',
          colorBorder: '#dce3ed',
          fontFamily: 'Inter, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
          controlHeight: 38,
          fontSize: 14,
        },
        components: {
          Table: { headerBg: '#f7f9fc', headerColor: '#5b6e86', cellPaddingBlock: 17 },
          Card: { headerHeight: 58 },
          Menu: {
            darkItemBg: '#12223c',
            darkSubMenuItemBg: '#12223c',
            darkItemSelectedBg: '#244473',
            darkItemHoverBg: '#1b3355',
            itemHeight: 44,
          },
        },
      }}
    >
      <App>
        <QueryClientProvider client={queries}>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<Workspace />}>
                  <Route index element={<Home />} />
                  <Route path="objects/:name" element={<RecordList />} />
                  <Route path="objects/:name/:id" element={<RecordDetail />} />
                  <Route path="setup/objects" element={<ObjectManager />} />
                  <Route path="setup/objects/:name" element={<ObjectConfiguration />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </App>
    </ConfigProvider>
  </React.StrictMode>,
);
