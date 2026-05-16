import { useEffect, useRef, useState } from 'react';
import { messages as messagesApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

export default function useMessagePoll(otherUserId, stadiumId, intervalMs = 5000) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const stop = useRef(false);

  useEffect(() => {
    stop.current = false;
    if (!user || !otherUserId || !stadiumId) return;

    let timer;
    const tick = async () => {
      if (stop.current) return;
      if (!localStorage.getItem('token')) {
        stop.current = true;
        return;
      }
      try {
        const data = await messagesApi.thread(otherUserId, stadiumId);
        if (!stop.current) {
          setItems(data);
          setError(null);
        }
      } catch (e) {
        if (stop.current) return;
        if (e?.response?.status === 401) {
          stop.current = true;
          return;
        }
        setError(e?.response?.data?.error || 'Failed to load');
      } finally {
        if (!stop.current) timer = setTimeout(tick, intervalMs);
      }
    };

    tick();
    return () => {
      stop.current = true;
      clearTimeout(timer);
    };
  }, [user, otherUserId, stadiumId, intervalMs]);

  return { messages: items, error, setMessages: setItems };
}
