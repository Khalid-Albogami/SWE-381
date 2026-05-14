import { useEffect, useRef, useState } from 'react';
import { messages as messagesApi } from '../api/endpoints';
import useMessagePoll from '../hooks/useMessagePoll';
import { useAuth } from '../context/AuthContext';

export default function ChatBox({ otherUserId, otherUserName, stadiumId, stadiumName }) {
  const { user } = useAuth();
  const { messages, setMessages, error } = useMessagePoll(otherUserId, stadiumId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await messagesApi.send({ receiverId: otherUserId, stadiumId, content: text });
      setMessages((m) => [...m, msg]);
      setText('');
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[28rem] flex-col rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-2 text-sm">
        <span className="font-semibold text-slate-900">{otherUserName || 'Conversation'}</span>
        {stadiumName && <span className="text-slate-500"> · about {stadiumName}</span>}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {messages.length === 0 && !error && (
          <p className="text-center text-sm text-slate-400">No messages yet — say hi.</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  mine ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                <p className={`mt-1 text-[10px] ${mine ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {new Date(m.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
