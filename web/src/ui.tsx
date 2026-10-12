import { Alert, Button, Empty, Spin } from 'antd';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>
        <strong>LCP</strong>
        {!compact && <small>领枢业务平台</small>}
      </span>
    </div>
  );
}
export function Loading() {
  return (
    <div className="page-loading" role="status">
      <Spin />
      <span>正在加载…</span>
    </div>
  );
}
export function Failure({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <Alert
      type="error"
      showIcon
      title="暂时无法加载"
      description={error instanceof Error ? error.message : '连接未完成'}
      action={<Button onClick={retry}>重试</Button>}
    />
  );
}
export function EmptyRecords({ onCreate }: { onCreate: () => void }) {
  return (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无记录">
      <Button type="primary" onClick={onCreate}>
        新建第一条记录
      </Button>
    </Empty>
  );
}
