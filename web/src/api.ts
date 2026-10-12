export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof URLSearchParams))
    headers.set('Content-Type', 'application/json');
  if (init.method && !['GET', 'HEAD'].includes(init.method.toUpperCase())) {
    const response = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
    if (!response.ok) throw new ApiError(response.status, '会话校验失败，请刷新页面');
    const csrf = (await response.json()) as { token: string; headerName: string };
    headers.set(csrf.headerName, csrf.token);
  }
  const response = await fetch(path, { ...init, headers, credentials: 'same-origin' });
  const body: unknown =
    response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    if (response.status === 401 && path !== '/api/auth/login')
      window.dispatchEvent(new Event('lcp:session-expired'));
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String(body.message)
        : '请求未完成，请稍后重试';
    throw new ApiError(response.status, message);
  }
  return body as T;
}
export const write = <T>(path: string, method: string, data?: unknown) =>
  request<T>(path, { method, body: data === undefined ? undefined : JSON.stringify(data) });
