import { useEffect, useState } from 'react';
import { Container, Row, Col, ListGroup, Badge, Card, Alert } from 'react-bootstrap';
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
    <Container className="py-4">
      <h1 className="h3 mb-3">Messages</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row className="g-3">
        <Col lg={4}>
          <Card className="shadow-sm">
            {threads.length === 0 ? (
              <Card.Body className="text-secondary small">No conversations yet.</Card.Body>
            ) : (
              <ListGroup variant="flush">
                {threads.map((t) => {
                  const key = `${t.otherUserId}|${t.stadiumId}`;
                  const isActive = active && `${active.otherUserId}|${active.stadiumId}` === key;
                  return (
                    <ListGroup.Item
                      key={key}
                      action
                      active={isActive}
                      onClick={() => { setActive(t); setTimeout(reload, 500); }}
                    >
                      <div className="d-flex justify-content-between gap-2">
                        <strong className="text-truncate">{t.otherUserName || 'User'}</strong>
                        {t.unreadCount > 0 && <Badge bg="success" pill>{t.unreadCount}</Badge>}
                      </div>
                      <div className="text-secondary small text-truncate">about {t.stadiumName || 'stadium'}</div>
                      <div className="text-muted small text-truncate">{t.lastMessage?.content}</div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            )}
          </Card>
        </Col>
        <Col lg={8}>
          {active ? (
            <ChatBox
              otherUserId={active.otherUserId}
              otherUserName={active.otherUserName}
              stadiumId={active.stadiumId}
              stadiumName={active.stadiumName}
            />
          ) : (
            <Card body className="text-center text-secondary py-5 border-dashed">
              Pick a conversation from the left to start chatting.
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}
