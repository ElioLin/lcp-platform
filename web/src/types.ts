export type Caller = { id: string; username: string; displayName: string; role: 'ADMIN' | 'USER' };
export type FieldType =
  'TEXT' | 'LONG_TEXT' | 'DECIMAL' | 'INTEGER' | 'DATE' | 'BOOLEAN' | 'OPTION';
export type Choice = { value: string; label: string };
export type FieldDefinition = {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  precision: number | null;
  scale: number | null;
  options: Choice[];
  position: number;
  published: boolean;
};
export type ObjectDefinition = {
  id: string;
  name: string;
  label: string;
  description: string;
  state: 'DRAFT' | 'PUBLISHED';
  version: number;
  hasUnpublishedChanges: boolean;
  createdAt: string;
  publishedAt: string | null;
  fields: FieldDefinition[];
};
export type DataRecord = {
  id: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  values: Record<string, unknown>;
};
export type RecordPage = { items: DataRecord[]; total: number; page: number; size: number };
export type AuditEntry = { action: string; createdAt: string; actor: string };
export const fieldTypes: Record<FieldType, string> = {
  TEXT: '文本',
  LONG_TEXT: '多行文本',
  DECIMAL: '小数 / 金额',
  INTEGER: '整数',
  DATE: '日期',
  BOOLEAN: '勾选框',
  OPTION: '选项',
};
