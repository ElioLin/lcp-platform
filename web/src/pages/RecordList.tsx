import { useState } from 'react';
import { App, Button, Card, Input, Space, Table, Tag } from 'antd';
import { DatabaseOutlined, PlusOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { request } from '../api';
import { useAuth } from '../auth-context';
import type { DataRecord, ObjectDefinition, RecordPage } from '../types';
import { EmptyRecords, Failure, Loading } from '../ui';
import { fieldValue, formatDate } from '../values';
import { RecordEditor } from '../components/RecordEditor';

export function RecordList() {
  const { name = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { message } = App.useApp();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
  const search = params.get('search') ?? '';
  const object = useQuery({
    queryKey: ['definition', name],
    queryFn: () => request<ObjectDefinition>(`/api/data/${name}/definition`),
  });
  const records = useQuery({
    queryKey: ['records', name, page, search],
    queryFn: () =>
      request<RecordPage>(
        `/api/data/${name}?page=${page}&size=10&search=${encodeURIComponent(search)}`,
      ),
  });
  if (object.isPending) return <Loading />;
  if (object.error) return <Failure error={object.error} retry={() => object.refetch()} />;
  const definition = object.data;
  const displayed = definition.fields.filter((field) => field.type !== 'LONG_TEXT').slice(0, 6);
  const columns = displayed.map((field, index) => ({
    title: field.label,
    key: field.name,
    sorter: undefined,
    width: field.type === 'DECIMAL' ? 150 : undefined,
    render: (_: unknown, record: DataRecord) =>
      index === 0 ? (
        <Link className="record-link" to={`/objects/${name}/${record.id}`}>
          {fieldValue(field, record.values[field.name])}
        </Link>
      ) : (
        fieldValue(field, record.values[field.name])
      ),
  }));
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="breadcrumb-text">
            工作台 <RightOutlined /> 业务对象
          </div>
          <h1>{definition.label}</h1>
          <p>{definition.description || '在这里查看和管理业务记录。'}</p>
        </div>
        <Button
          aria-label={`新建${definition.label}`}
          type="primary"
          icon={<PlusOutlined aria-hidden />}
          size="large"
          onClick={() => setCreating(true)}
        >
          新建{definition.label}
        </Button>
      </div>
      <div className="summary-grid">
        <div className="summary-item">
          <span>当前可见记录</span>
          <strong>
            {records.data?.total ?? '—'}
            <small>条</small>
          </strong>
        </div>
        <div className="summary-item">
          <span>业务字段</span>
          <strong>
            {definition.fields.length}
            <small>项</small>
          </strong>
        </div>
        <div className="summary-item">
          <span>访问范围</span>
          <strong className="summary-label">
            {user?.role === 'ADMIN' ? '全部记录' : '我创建的记录'}
          </strong>
        </div>
      </div>
      <Card className="records-card" styles={{ body: { padding: 0 } }}>
        <div className="list-toolbar">
          <Space>
            <DatabaseOutlined />
            <strong>全部记录</strong>
            <Tag bordered={false}>{records.data?.total ?? 0}</Tag>
          </Space>
          <div className="list-actions">
            <Input.Search
              aria-label="搜索记录"
              placeholder="搜索单号、主题等文本"
              defaultValue={search}
              allowClear
              onSearch={(value) => setParams(value ? { search: value, page: '1' } : {})}
            />
            <Button
              aria-label="刷新记录"
              icon={<ReloadOutlined />}
              onClick={() => {
                records.refetch().catch(() => message.error('刷新未完成'));
              }}
            />
          </div>
        </div>
        {records.error ? (
          <div className="card-error">
            <Failure error={records.error} retry={() => records.refetch()} />
          </div>
        ) : (
          <Table<DataRecord>
            rowKey="id"
            dataSource={records.data?.items ?? []}
            loading={records.isFetching}
            columns={[
              ...columns,
              {
                title: '更新时间',
                key: 'updatedAt',
                width: 180,
                render: (_, record) => (
                  <span className="muted">{formatDate(record.updatedAt)}</span>
                ),
              },
              {
                title: '操作',
                key: 'actions',
                width: 75,
                render: (_, record) => <Link to={`/objects/${name}/${record.id}`}>查看</Link>,
              },
            ]}
            scroll={{ x: 860 }}
            locale={{ emptyText: <EmptyRecords onCreate={() => setCreating(true)} /> }}
            pagination={{
              current: page,
              pageSize: 10,
              total: records.data?.total ?? 0,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (next) =>
                setParams(search ? { search, page: String(next) } : { page: String(next) }),
            }}
          />
        )}
      </Card>
      <div className="list-footnote">记录根据当前账号的访问范围展示。</div>
      {creating && (
        <RecordEditor
          object={definition}
          open
          onClose={() => setCreating(false)}
          onSaved={(record) => {
            setCreating(false);
            navigate(`/objects/${name}/${record.id}`);
          }}
        />
      )}
    </>
  );
}
