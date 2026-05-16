import { useEffect, useRef, useState } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { messages as messagesApi } from '../api/endpoints';
import useMessagePoll from '../hooks/useMessagePoll';
import { useAuth } from '../context/AuthContext';
import { useToast } from './feedback';

export default function ChatBox({ otherUserId, otherUserName, stadiumId, stadiumName }) {
  const { user } = useAuth();
  const toast = useToast();
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
      toast.error(err?.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="d-flex flex-column" style={{ height: '28rem' }}>
      <Card.Header className="py-2 small">
        <strong>{otherUserName || 'Conversation'}</strong>
        {stadiumName && <span className="text-secondary"> · about {stadiumName}</span>}
      </Card.Header>
      <Card.Body className="chat-scroll d-flex flex-column gap-2 px-3 py-2">
        {error && <p className="text-danger small mb-0">{error}</p>}
        {messages.length === 0 && !error && (
          <p className="text-center text-secondary small mt-3">No messages yet — say hi.</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div key={m._id} className={`d-flex ${mine ? 'justify-content-end' : 'justify-content-start'}`}>
              <div className={`chat-bubble ${mine ? 'chat-bubble-mine' : 'chat-bubble-theirs'}`}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                <div className="small mt-1" style={{ opacity: 0.7, fontSize: 10 }}>
                  {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </Card.Body>
      <Form onSubmit={send} className="d-flex gap-2 border-top p-2">
        <Form.Control
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          size="sm"
        />
        <Button type="submit" variant="success" size="sm" disabled={!text.trim() || sending}>
          Send
        </Button>
      </Form>
    </Card>
  );
}
