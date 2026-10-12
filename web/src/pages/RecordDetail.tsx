import { useState } from 'react';
import { Button, Card, Descriptions, Space, Tag, Timeline } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  FileTextOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { request } from '../api';
import type { AuditEntry, DataRecord, ObjectDefinition } from '../types';
import { Failure, Loading } from '../ui';
import { fieldValue, formatDate } from '../values';
import { RecordEditor } from '../components/RecordEditor';

const actions: Record<string, string> = {
  RECORD_CREATED: '创建了单据',
  RECORD_UPDATED: '更新了单据',
};
export function RecordDetail() {
  const { name = '', id = '' } = useParams();
  const [editing, setEditing] = useState(false);
  const definition = useQuery({
    queryKey: ['definition', name],
    queryFn: () => request<ObjectDefinition>(`/api/data/${name}/definition`),
  });
  const record = useQuery({
    queryKey: ['record', name, id],
    queryFn: () => request<DataRecord>(`/api/data/${name}/${id}`),
  });
  const history = useQuery({
    queryKey: ['history', name, id],
    queryFn: () => request<AuditEntry[]>(`/api/data/${name}/${id}/history`),
  });
  if (definition.isPending || record.isPending) return <Loading />;
  if (definition.error || record.error)
    return (
      <Failure
        error={definition.error || record.error}
        retry={() => {
          definition.refetch();
          record.refetch();
        }}
      />
    );
  const object = definition.data;
  const data = record.data;
  const firstText = object.fields.find((field) => field.type === 'TEXT');
  const title = firstText ? String(data.values[firstText.name] ?? object.label) : object.label;
  return (
    <>
      <Link className="back-link" to={`/objects/${name}`}>
        <ArrowLeftOutlined /> 返回{object.label}列表
      </Link>
      <div className="page-heading detail-heading">
        <div className="document-title">
          <div className="document-icon">
            <FileTextOutlined />
          </div>
          <div>
            <div className="eyebrow">{object.label}</div>
            <h1>{title}</h1>
            <span className="muted">
              由 {data.createdByName} 创建于 {formatDate(data.createdAt)}
            </span>
          </div>
        </div>
        <Button
          aria-label="编辑单据"
          type="primary"
          icon={<EditOutlined aria-hidden />}
          onClick={() => setEditing(true)}
        >
          编辑单据
        </Button>
      </div>
      <div className="detail-grid">
        <div>
          <Card title="单据详情" className="detail-card">
            <Descriptions
              column={{ xs: 1, sm: 2, lg: 2 }}
              layout="vertical"
              items={object.fields.map((field) => ({
                key: field.id,
                label: field.label,
                span: field.type === 'LONG_TEXT' ? 2 : 1,
                children: (
                  <div className={field.type === 'LONG_TEXT' ? 'long-text' : ''}>
                    {fieldValue(field, data.values[field.name])}
                  </div>
                ),
              }))}
            />
          </Card>
          <Card title="记录信息" className="detail-card system-info">
            <Descriptions
              column={{ xs: 1, sm: 2 }}
              items={[
                { key: 'owner', label: '创建人', children: data.createdByName },
                { key: 'version', label: '记录版本', children: <Tag>v{data.version}</Tag> },
                { key: 'created', label: '创建时间', children: formatDate(data.createdAt) },
                { key: 'updated', label: '更新时间', children: formatDate(data.updatedAt) },
              ]}
            />
          </Card>
        </div>
        <Card
          title={
            <Space>
              <HistoryOutlined />
              操作记录
            </Space>
          }
          className="history-card"
        >
          {history.isPending ? (
            <Loading />
          ) : history.error ? (
            <Failure error={history.error} retry={() => history.refetch()} />
          ) : (
            <Timeline
              items={history.data.map((entry, index) => ({
                color: index === 0 ? 'blue' : 'gray',
                children: (
                  <div>
                    <strong>{entry.actor}</strong>
                    <p>{actions[entry.action] ?? entry.action}</p>
                    <small className="muted">{formatDate(entry.createdAt)}</small>
                  </div>
                ),
              }))}
            />
          )}
        </Card>
      </div>
      {editing && (
        <RecordEditor
          object={object}
          record={data}
          open
          onClose={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      )}
    </>
  );
}
