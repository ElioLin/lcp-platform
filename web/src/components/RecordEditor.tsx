import { App, Checkbox, Form, Input, InputNumber, Modal, Select } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { write } from '../api';
import type { DataRecord, FieldDefinition, ObjectDefinition } from '../types';

function control(field: FieldDefinition) {
  switch (field.type) {
    case 'LONG_TEXT':
      return <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} maxLength={20000} showCount />;
    case 'DECIMAL':
      return <InputNumber stringMode precision={field.scale ?? 2} style={{ width: '100%' }} />;
    case 'INTEGER':
      return (
        <InputNumber precision={0} min={-2147483648} max={2147483647} style={{ width: '100%' }} />
      );
    case 'DATE':
      return <Input type="date" />;
    case 'BOOLEAN':
      return <Checkbox>已勾选</Checkbox>;
    case 'OPTION':
      return <Select allowClear options={field.options} />;
    default:
      return <Input maxLength={255} />;
  }
}
export function RecordEditor({
  object,
  record,
  open,
  onClose,
  onSaved,
}: {
  object: ObjectDefinition;
  record?: DataRecord;
  open: boolean;
  onClose: () => void;
  onSaved: (record: DataRecord) => void;
}) {
  const [form] = Form.useForm<Record<string, unknown>>();
  const { message } = App.useApp();
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      write<DataRecord>(
        `/api/data/${object.name}${record ? `/${record.id}` : ''}`,
        record ? 'PUT' : 'POST',
        { values, version: record?.version },
      ),
    onSuccess: async (result) => {
      await client.invalidateQueries({ queryKey: ['records', object.name] });
      await client.invalidateQueries({ queryKey: ['record', object.name] });
      await client.invalidateQueries({ queryKey: ['history', object.name] });
      message.success('记录已保存');
      onSaved(result);
    },
    onError: (error) => message.error(error.message),
  });
  const initial =
    record?.values ??
    Object.fromEntries(
      object.fields.filter((field) => field.type === 'BOOLEAN').map((field) => [field.name, false]),
    );
  return (
    <Modal
      title={record ? `编辑${object.label}` : `新建${object.label}`}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="保存记录"
      cancelText="取消"
      confirmLoading={save.isPending}
      width={660}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initial}
        onFinish={(values) => save.mutate(values)}
        preserve={false}
      >
        <div className="record-form-grid">
          {object.fields.map((field) => (
            <Form.Item
              className={field.type === 'LONG_TEXT' ? 'full-width' : ''}
              key={field.id}
              name={field.name}
              label={field.label}
              valuePropName={field.type === 'BOOLEAN' ? 'checked' : 'value'}
              rules={[{ required: field.required, message: `请填写${field.label}` }]}
            >
              {control(field)}
            </Form.Item>
          ))}
        </div>
      </Form>
    </Modal>
  );
}
