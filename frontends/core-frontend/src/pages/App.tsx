import { Button, PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui';
import { useCallback, useEffect, useState } from 'react';
import { getRuntimeOverview, type RuntimeApp } from '@/api/runtime';

const statusText: Record<RuntimeApp['status'], string> = {
  discovered: '已发现',
  loading: '加载中',
  ready: '就绪',
  failed: '失败',
  disposed: '已停止'
};

export default function App() {
  const [apps, setApps] = useState<RuntimeApp[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadApps = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const overview = await getRuntimeOverview(signal);

      setOnline(overview.online);
      setApps(overview.apps);
      setLastUpdated(new Date());
    } catch (cause) {
      if (signal?.aborted) {
        return;
      }
      setOnline(false);
      setError(cause instanceof Error ? cause.message : '加载运行时应用失败');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void loadApps(controller.signal);
    const timer = window.setInterval(() => void loadApps(), 10_000);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [loadApps]);

  return (
    <SecondaryDiv className='min-h-screen p-4 sm:p-6'>
      <PrimaryDiv className='mx-auto w-full max-w-3xl rounded-lg p-5 shadow-inner sm:p-8'>
        <header className='flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-sm text-gray-500'>ALemonJS / Server</p>
            <h1 className='text-2xl sm:text-3xl'>应用</h1>
          </div>
          <div className='flex items-center gap-3'>
            <span
              className={`rounded-full px-3 py-1 text-sm ${online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              title={lastUpdated?.toLocaleTimeString()}
            >
              {online ? '服务在线' : '服务离线'}
            </span>
            <Button type='button' onClick={() => void loadApps()} disabled={loading}>
              {loading ? '刷新中…' : '刷新'}
            </Button>
          </div>
        </header>

        {error ? <p className='mt-6 rounded-md bg-red-50 p-4 text-red-600'>{error}</p> : null}
        {!error && !loading && apps.length === 0 ? <p className='mt-6 text-gray-500'>暂无运行时应用。</p> : null}

        <ul className='mt-6 space-y-3'>
          {apps.map(app => {
            const href = app.kind === 'main' ? '/app/' : `/apps/${encodeURIComponent(app.name)}/`;

            return (
              <li key={app.name} className='flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='min-w-0'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h2 className='text-lg'>{app.name}</h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        app.status === 'ready'
                          ? 'bg-green-100 text-green-700'
                          : app.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {statusText[app.status]}
                    </span>
                  </div>
                  <p className='mt-1 text-sm text-gray-500'>{app.kind === 'main' ? '主应用' : '插件应用'}</p>
                  {app.error?.message ? <p className='mt-2 truncate text-sm text-red-600'>{app.error.message}</p> : null}
                </div>
                {app.capabilities.web && app.status === 'ready' ? (
                  <a className='inline-block w-full rounded-md border px-3 py-2 text-center text-sm sm:w-auto' href={href}>
                    打开 Web 应用
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      </PrimaryDiv>
    </SecondaryDiv>
  );
}
