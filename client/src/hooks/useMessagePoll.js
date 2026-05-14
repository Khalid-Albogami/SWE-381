import { useEffect, useRef, useState } from 'react';
import { messages as messagesApi } from '../api/endpoints';

export default function useMessagePoll(otherUserId, stadiumId, intervalMs = 5000) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const stop = useRef(false);

  useEffect(() => {
    stop.current = false;
    if (!otherUserId || !stadiumId) return;

    let timer;
    const tick = async () => {
      try {
        const data = await messagesApi.thread(otherUserId, stadiumId);
        if (!stop.current) {
          setItems(data);
          setError(null);
        }
      } catch (e) {
        if (!stop.current) setError(e?.response?.data?.error || 'Failed to load');
      } finally {
        if (!stop.current) timer = setTimeout(tick, intervalMs);
      }
    };

    tick();
    return () => {
      stop.current = true;
      clearTimeout(timer);
    };
  }, [otherUserId, stadiumId, intervalMs]);

  return { messages: items, error, setMessages: setItems };
}
