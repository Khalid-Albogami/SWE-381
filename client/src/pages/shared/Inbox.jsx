import { useEffect, useState } from 'react';
import { messages as messagesApi } from '../../api/endpoints';
import ChatBox from '../../components/ChatBox';

export default function Inbox() {
  const [threads, setThreads] = useState([]);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);

  const reload = () => {
    messagesApi
      .inbox()
      .then(setThreads)
      .catch((e) => setError(e?.response?.data?.error || 'Failed to load'));
  };

  useEffect(reload, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Messages</h1>
      {error && <p className="mt-4 text-rose-700">{error}</p>}
      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white">
          {threads.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No conversations yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {threads.map((t) => {
                const key = `${t.otherUserId}|${t.stadiumId}`;
                const isActive = active && `${active.otherUserId}|${active.stadiumId}` === key;
                return (
                  <li key={key}>
                    <button
                      onClick={() => { setActive(t); setTimeout(reload, 500); }}
                      className={`block w-full px-4 py-3 text-left transition ${
                        isActive ? 'bg-emerald-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-slate-900">
                          {t.otherUserName || 'User'}
                        </span>
                        {t.unreadCount > 0 && (
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                            {t.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-500">about {t.stadiumName || 'stadium'}</p>
                      <p className="mt-1 truncate text-xs text-slate-400">{t.lastMessage?.content}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
        <div>
          {active ? (
            <ChatBox
              otherUserId={active.otherUserId}
              otherUserName={active.otherUserName}
              stadiumId={active.stadiumId}
              stadiumName={active.stadiumName}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
              Pick a conversation from the left to start chatting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
