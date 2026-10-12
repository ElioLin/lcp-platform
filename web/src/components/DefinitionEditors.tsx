import { App, Button, Checkbox, Form, Input, InputNumber, Modal, Select, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { write } from '../api';
import { fieldTypes } from '../types';
import type { FieldDefinition, FieldType, ObjectDefinition, Choice } from '../types';

const nameRule = {
  pattern: /^[a-z][a-z0-9_]{1,49}$/,
  message: '使用 2–50 个小写字母、数字或下划线，以字母开头',
};
type ObjectInput = { name: string; label: string; description?: string };
export function ObjectEditor({
  object,
  onClose,
  onSaved,
}: {
  object?: ObjectDefinition;
  onClose: () => void;
  onSaved: (object: ObjectDefinition) => void;
}) {
  const [form] = Form.useForm<ObjectInput>();
  const { message } = App.useApp();
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: (input: ObjectInput) =>
      write<ObjectDefinition>(
        object ? `/api/metadata/objects/${object.name}` : '/api/metadata/objects',
        object ? 'PUT' : 'POST',
        input,
      ),
    onSuccess: async (result) => {
      await client.invalidateQueries({ queryKey: ['objects'] });
      await client.invalidateQueries({ queryKey: ['object', result.name] });
      await client.invalidateQueries({ queryKey: ['definition', result.name] });
      message.success(object ? '对象信息已更新' : '对象草稿已创建');
      onSaved(result);
    },
    onError: (error) => message.error(error.message),
  });
  return (
    <Modal
      title={object ? '编辑对象信息' : '新建业务对象'}
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={save.isPending}
      okText={object ? '保存信息' : '创建对象'}
      cancelText="取消"
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(input) => save.mutate(input)}
        initialValues={object}
      >
        <Form.Item
          name="label"
          label="显示名称"
          rules={[{ required: true, whitespace: true, message: '请输入对象显示名称' }]}
        >
          <Input maxLength={100} placeholder="例如：销售订单" autoFocus />
        </Form.Item>
        <Form.Item
          name="name"
          label="API 名称"
          extra="用于稳定识别对象，创建后保持不变。"
          rules={[{ required: true, message: '请输入 API 名称' }, nameRule]}
        >
          <Input disabled={!!object} maxLength={50} placeholder="例如：sales_order" />
        </Form.Item>
        <Form.Item name="description" label="对象说明">
          <Input.TextArea
            rows={3}
            maxLength={1000}
            placeholder="说明这个对象用于记录什么业务信息"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
type FieldInput = {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  precision?: number;
  scale?: number;
  options?: Choice[];
};
export function FieldEditor({
  object,
  field,
  onClose,
  onSaved,
}: {
  object: ObjectDefinition;
  field?: FieldDefinition;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form] = Form.useForm<FieldInput>();
  const type = Form.useWatch('type', form) ?? field?.type ?? 'TEXT';
  const { message } = App.useApp();
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: (input: FieldInput) =>
      write<ObjectDefinition>(
        `/api/metadata/objects/${object.name}/fields${field ? `/${field.id}` : ''}`,
        field ? 'PUT' : 'POST',
        {
          ...input,
          precision: input.type === 'DECIMAL' ? input.precision : null,
          scale: input.type === 'DECIMAL' ? input.scale : null,
          options: input.type === 'OPTION' ? (input.options ?? []) : [],
        },
      ),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['object', object.name] });
      await client.invalidateQueries({ queryKey: ['objects'] });
      await client.invalidateQueries({ queryKey: ['definition', object.name] });
      message.success('字段定义已保存');
      onSaved();
    },
    onError: (error) => message.error(error.message),
  });
  return (
    <Modal
      title={field ? '编辑字段' : '添加字段'}
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="保存字段"
      cancelText="取消"
      confirmLoading={save.isPending}
      destroyOnHidden
      width={580}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={
          field ?? {
            type: 'TEXT',
            required: false,
            precision: 18,
            scale: 2,
            options: [{ value: '', label: '' }],
          }
        }
        onFinish={(input) => save.mutate(input)}
      >
        <Form.Item
          name="label"
          label="显示名称"
          rules={[{ required: true, whitespace: true, message: '请输入字段显示名称' }]}
        >
          <Input autoFocus maxLength={100} />
        </Form.Item>
        <Form.Item
          name="name"
          label="API 名称"
          rules={[{ required: true, message: '请输入字段 API 名称' }, nameRule]}
        >
          <Input disabled={field?.published} maxLength={50} placeholder="例如：order_amount" />
        </Form.Item>
        <div className="record-form-grid">
          <Form.Item name="type" label="字段类型" rules={[{ required: true }]}>
            <Select
              disabled={field?.published}
              options={Object.entries(fieldTypes).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="required" label="填写要求" valuePropName="checked">
            <Checkbox disabled={field?.published}>必填字段</Checkbox>
          </Form.Item>
        </div>
        {type === 'DECIMAL' && (
          <div className="record-form-grid">
            <Form.Item name="precision" label="总精度" rules={[{ required: true }]}>
              <InputNumber disabled={field?.published} min={1} max={38} />
            </Form.Item>
            <Form.Item name="scale" label="小数位数" rules={[{ required: true }]}>
              <InputNumber disabled={field?.published} min={0} max={38} />
            </Form.Item>
          </div>
        )}
        {type === 'OPTION' && (
          <div className="option-editor">
            <label>选项配置</label>
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name }) => (
                    <Space key={key} align="start">
                      <Form.Item
                        name={[name, 'value']}
                        rules={[{ required: true, message: '请输入机器值' }]}
                      >
                        <Input
                          disabled={field?.published}
                          aria-label={`选项${name + 1}机器值`}
                          placeholder="机器值，如 draft"
                        />
                      </Form.Item>
                      <Form.Item
                        name={[name, 'label']}
                        rules={[{ required: true, message: '请输入标签' }]}
                      >
                        <Input
                          disabled={field?.published}
                          aria-label={`选项${name + 1}标签`}
                          placeholder="显示标签，如 草稿"
                        />
                      </Form.Item>
                      {!field?.published && (
                        <Button
                          type="text"
                          aria-label={`移除选项${name + 1}`}
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        />
                      )}
                    </Space>
                  ))}
                  {!field?.published && (
                    <Button
                      block
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => add({ value: '', label: '' })}
                    >
                      添加选项
                    </Button>
                  )}
                </>
              )}
            </Form.List>
          </div>
        )}
        <p className="form-note">
          {field?.published
            ? '已发布字段可调整显示名称；结构修改需要迁移方案。'
            : '字段保存为草稿，发布对象后在业务页面生效。已有记录时，建议先新增非必填字段。'}
        </p>
      </Form>
    </Modal>
  );
}
