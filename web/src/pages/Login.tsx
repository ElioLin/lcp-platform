import { useState } from 'react';
import { Alert, Button, Form, Input } from 'antd';
import { LockOutlined, UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Navigate, useNavigate } from 'react-router-dom';
import { request } from '../api';
import { useAuth } from '../auth-context';
import { Brand } from '../ui';

export function Login() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  if (auth.user) return <Navigate to="/" replace />;
  async function login(values: { username: string; password: string }) {
    setPending(true);
    setError('');
    try {
      await request('/api/auth/login', { method: 'POST', body: new URLSearchParams(values) });
      await auth.refresh();
      navigate('/', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '登录未完成');
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <Brand />
        <div className="login-copy">
          <span className="eyebrow">LOGIC CORE PLATFORM</span>
          <h1>让业务有序流动。</h1>
          <p>
            用统一的业务对象连接信息，
            <br />
            让每一张单据，都有清晰的来路。
          </p>
          <div className="login-visual" aria-hidden="true">
            <div className="visual-object">
              <span>业务对象</span>
              <i />
              <i />
              <i />
            </div>
            <div className="visual-connection" />
            <div className="visual-doc">
              <span>单据记录</span>
              <i />
              <i />
              <i />
              <b />
            </div>
          </div>
        </div>
        <span className="login-footer">领枢 · 连接业务与信息</span>
      </section>
      <section className="login-form-panel">
        <div className="login-form-box">
          <div className="mobile-brand">
            <Brand />
          </div>
          <span className="eyebrow">欢迎回来</span>
          <h2>登录你的工作空间</h2>
          <p className="muted">使用平台账号，开始今天的工作。</p>
          {error && <Alert type="error" title={error} showIcon className="login-error" />}
          <Form layout="vertical" onFinish={login} requiredMark={false} size="large">
            <Form.Item
              name="username"
              label="账号"
              rules={[{ required: true, message: '请输入账号' }]}
            >
              <Input
                prefix={<UserOutlined />}
                autoComplete="username"
                autoFocus
                placeholder="请输入平台账号"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                autoComplete="current-password"
                placeholder="请输入密码"
              />
            </Form.Item>
            <Button
              aria-label="登录工作空间"
              type="primary"
              htmlType="submit"
              loading={pending}
              block
              icon={<ArrowRightOutlined />}
              iconPlacement="end"
            >
              登录工作空间
            </Button>
          </Form>
          <p className="login-support">账号由平台管理员分配，请妥善保管登录信息。</p>
        </div>
      </section>
    </main>
  );
}
