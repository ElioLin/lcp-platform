import { useState } from 'react';
import { App, Button, Card, Empty, Input, Space, Table, Tag } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  EditOutlined,
  PlusOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { request, write } from '../api';
import { useAuth } from '../auth-context';
import { Failure, Loading } from '../ui';
import type { FieldDefinition, ObjectDefinition } from '../types';
import { fieldTypes } from '../types';
import { formatDate } from '../values';
import { FieldEditor, ObjectEditor } from '../components/DefinitionEditors';

export function ObjectManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const objects = useQuery({
    queryKey: ['objects'],
    queryFn: () => request<ObjectDefinition[]>('/api/metadata/objects'),
  });
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="breadcrumb-text">平台管理 / 对象管理器</div>
          <h1>对象管理器</h1>
          <p>定义业务对象和字段，发布后即可在工作台使用。</p>
        </div>
        <Button
          aria-label="新建对象"
          type="primary"
          size="large"
          icon={<PlusOutlined aria-hidden />}
          onClick={() => setCreating(true)}
        >
          新建对象
        </Button>
      </div>
      <div className="summary-grid">
        <div className="summary-item">
          <span>业务对象</span>
          <strong>
            {objects.data?.length ?? '—'}
            <small>个</small>
          </strong>
        </div>
        <div className="summary-item">
          <span>已发布</span>
          <strong>
            {objects.data?.filter((object) => object.state === 'PUBLISHED').length ?? '—'}
            <small>个</small>
          </strong>
        </div>
        <div className="summary-item">
          <span>待发布变更</span>
          <strong>
            {objects.data?.filter((object) => object.hasUnpublishedChanges).length ?? '—'}
            <small>个对象</small>
          </strong>
        </div>
      </div>
      <Card className="records-card" styles={{ body: { padding: 0 } }}>
        <div className="list-toolbar">
          <Space>
            <DatabaseOutlined />
            <strong>业务对象</strong>
          </Space>
          <Input.Search
            aria-label="搜索业务对象"
            allowClear
            placeholder="搜索对象名称或 API 名称"
            onSearch={setSearch}
            style={{ maxWidth: 300 }}
          />
        </div>
        {objects.error ? (
          <div className="card-error">
            <Failure error={objects.error} retry={() => objects.refetch()} />
          </div>
        ) : (
          <Table<ObjectDefinition>
            rowKey="id"
            loading={objects.isFetching}
            dataSource={objects.data?.filter((object) =>
              `${object.label} ${object.name}`.toLowerCase().includes(search.toLowerCase()),
            )}
            scroll={{ x: 750 }}
            columns={[
              {
                title: '对象名称',
                key: 'label',
                render: (_, object) => (
                  <Link className="record-link" to={`/setup/objects/${object.name}`}>
                    {object.label}
                  </Link>
                ),
              },
              {
                title: 'API 名称',
                dataIndex: 'name',
                render: (name) => <code className="api-name">{name}</code>,
              },
              { title: '字段', key: 'fields', render: (_, object) => object.fields.length },
              {
                title: '发布状态',
                key: 'state',
                render: (_, object) => (
                  <Space size={4}>
                    <Tag color={object.state === 'PUBLISHED' ? 'green' : 'orange'}>
                      {object.state === 'PUBLISHED' ? '已发布' : '草稿'}
                    </Tag>
                    {object.state === 'PUBLISHED' && object.hasUnpublishedChanges && (
                      <Tag color="orange">待发布变更</Tag>
                    )}
                  </Space>
                ),
              },
              {
                title: '结构版本',
                key: 'version',
                render: (_, object) => (object.version ? `v${object.version}` : '—'),
              },
              {
                title: '操作',
                key: 'actions',
                render: (_, object) => <Link to={`/setup/objects/${object.name}`}>配置对象</Link>,
              },
            ]}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            locale={{ emptyText: <Empty description="暂无业务对象" /> }}
          />
        )}
      </Card>
      {creating && (
        <ObjectEditor
          onClose={() => setCreating(false)}
          onSaved={(object) => {
            setCreating(false);
            navigate(`/setup/objects/${object.name}`);
          }}
        />
      )}
    </>
  );
}
export function ObjectConfiguration() {
  const { name = '' } = useParams();
  const { user } = useAuth();
  const { message, modal } = App.useApp();
  const client = useQueryClient();
  const [editingObject, setEditingObject] = useState(false);
  const [editingField, setEditingField] = useState<FieldDefinition | 'new' | null>(null);
  const [publishing, setPublishing] = useState(false);
  const object = useQuery({
    queryKey: ['object', name],
    queryFn: () => request<ObjectDefinition>(`/api/metadata/objects/${name}`),
  });
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  if (object.isPending) return <Loading />;
  if (object.error) return <Failure error={object.error} retry={() => object.refetch()} />;
  const definition = object.data;
  async function publish() {
    setPublishing(true);
    try {
      await write(`/api/metadata/objects/${name}/publish`, 'POST');
      await Promise.all([
        client.invalidateQueries({ queryKey: ['object', name] }),
        client.invalidateQueries({ queryKey: ['objects'] }),
        client.invalidateQueries({ queryKey: ['definition', name] }),
        client.invalidateQueries({ queryKey: ['records', name] }),
      ]);
      message.success('对象已发布，业务页面已更新');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '发布未完成');
    } finally {
      setPublishing(false);
    }
  }
  function remove(field: FieldDefinition) {
    modal.confirm({
      title: `移除草稿字段“${field.label}”？`,
      content: '尚未发布的字段不会影响现有业务记录。',
      okText: '移除字段',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await write(`/api/metadata/objects/${name}/fields/${field.id}`, 'DELETE');
          await client.invalidateQueries({ queryKey: ['object', name] });
          await client.invalidateQueries({ queryKey: ['objects'] });
        } catch (error) {
          message.error(error instanceof Error ? error.message : '操作未完成');
          throw error;
        }
      },
    });
  }
  return (
    <>
      <Link className="back-link" to="/setup/objects">
        <ArrowLeftOutlined /> 返回对象管理器
      </Link>
      <div className="page-heading">
        <div>
          <div className="breadcrumb-text">
            对象配置 / <code>{definition.name}</code>
          </div>
          <h1>
            {definition.label}{' '}
            <Tag color={definition.state === 'PUBLISHED' ? 'green' : 'orange'}>
              {definition.state === 'PUBLISHED' ? `已发布 · v${definition.version}` : '草稿'}
            </Tag>
          </h1>
          <p>{definition.description || '配置对象的字段与显示信息。'}</p>
        </div>
        <Space wrap>
          <Button
            aria-label="编辑对象信息"
            icon={<EditOutlined aria-hidden />}
            onClick={() => setEditingObject(true)}
          >
            编辑对象信息
          </Button>
          {definition.state === 'PUBLISHED' && (
            <Link to={`/objects/${name}`}>
              <Button>查看业务列表</Button>
            </Link>
          )}
          <Button
            aria-label="发布对象"
            type="primary"
            icon={<RocketOutlined aria-hidden />}
            loading={publishing}
            disabled={!definition.hasUnpublishedChanges || !definition.fields.length}
            onClick={() =>
              modal.confirm({
                title: '发布对象配置',
                content: '发布会使草稿字段在业务页面生效。若结构变更失败，原版本仍保持可用。',
                okText: '确认发布',
                cancelText: '取消',
                onOk: publish,
              })
            }
          >
            发布对象
          </Button>
        </Space>
      </div>
      <div className={`publication-banner ${definition.hasUnpublishedChanges ? 'pending' : ''}`}>
        <CheckCircleOutlined />
        <div>
          <strong>
            {definition.hasUnpublishedChanges ? '配置包含待发布的变更' : '当前配置已发布'}
          </strong>
          <span>
            {definition.hasUnpublishedChanges
              ? '完成字段设置后发布，列表和详情页面将自动使用这些字段。'
              : `最近发布于 ${formatDate(definition.publishedAt)}，可继续添加字段扩展业务。`}
          </span>
        </div>
      </div>
      <Card className="records-card" styles={{ body: { padding: 0 } }}>
        <div className="list-toolbar">
          <Space>
            <strong>字段配置</strong>
            <Tag bordered={false}>{definition.fields.length} 个字段</Tag>
          </Space>
          <Button
            aria-label="添加字段"
            type="primary"
            icon={<PlusOutlined aria-hidden />}
            onClick={() => setEditingField('new')}
          >
            添加字段
          </Button>
        </div>
        <Table<FieldDefinition>
          rowKey="id"
          dataSource={definition.fields}
          scroll={{ x: 800 }}
          pagination={false}
          columns={[
            { title: '显示名称', dataIndex: 'label', render: (label) => <strong>{label}</strong> },
            {
              title: 'API 名称',
              dataIndex: 'name',
              render: (value) => <code className="api-name">{value}</code>,
            },
            {
              title: '类型',
              key: 'type',
              render: (_, field) => (
                <Tag>
                  {fieldTypes[field.type]}
                  {field.type === 'DECIMAL' ? ` (${field.precision},${field.scale})` : ''}
                </Tag>
              ),
            },
            {
              title: '必填',
              key: 'required',
              render: (_, field) => (field.required ? '是' : '否'),
            },
            {
              title: '状态',
              key: 'state',
              render: (_, field) => (
                <Tag color={field.published ? 'green' : 'orange'}>
                  {field.published ? '已发布' : '待发布'}
                </Tag>
              ),
            },
            {
              title: '操作',
              key: 'actions',
              render: (_, field) => (
                <Space>
                  <Button size="small" type="link" onClick={() => setEditingField(field)}>
                    编辑
                  </Button>
                  {!field.published && (
                    <Button size="small" type="link" danger onClick={() => remove(field)}>
                      移除
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
          locale={{
            emptyText: (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="为对象配置第一个业务字段" />
            ),
          }}
        />
      </Card>
      <p className="list-footnote">记录 ID、创建人、创建时间及记录版本由平台维护，无需重复配置。</p>
      {editingObject && (
        <ObjectEditor
          object={definition}
          onClose={() => setEditingObject(false)}
          onSaved={() => setEditingObject(false)}
        />
      )}
      {editingField && (
        <FieldEditor
          object={definition}
          field={editingField === 'new' ? undefined : editingField}
          onClose={() => setEditingField(null)}
          onSaved={() => setEditingField(null)}
        />
      )}
    </>
  );
}
