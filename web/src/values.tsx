import { Tag } from 'antd';
import Decimal from 'decimal.js';
import type { FieldDefinition } from './types';

export function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}
export function fieldValue(field: FieldDefinition, value: unknown) {
  if (value === null || value === undefined || value === '')
    return <span className="muted">—</span>;
  if (field.type === 'OPTION') {
    const label = field.options.find((option) => option.value === value)?.label ?? String(value);
    return <Tag color={value === 'submitted' ? 'blue' : 'default'}>{label}</Tag>;
  }
  if (field.type === 'BOOLEAN')
    return <Tag color={value ? 'green' : 'default'}>{value ? '是' : '否'}</Tag>;
  if (field.type === 'DECIMAL') {
    const exact = new Decimal(String(value)).toFixed(field.scale ?? 2);
    const [integer, fraction] = exact.split('.');
    return (
      <span className="numeric">
        {integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        {fraction === undefined ? '' : `.${fraction}`}
      </span>
    );
  }
  return String(value);
}
