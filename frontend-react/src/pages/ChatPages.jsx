import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../app/AuthContext.jsx';
import { Feedback, SiteLayout } from '../components/SiteLayout.jsx';
import { apiRequest } from '../services/api.js';

function mergeMessages(current, incoming) {
  const messages = new Map(current.map(message => [message._id, message]));
  incoming.forEach(message => messages.set(message._id, message));
  return [...messages.values()].sort(
    (left, right) => new Date(left.createdAt) - new Date(right.createdAt)
  );
}

function otherParticipant(conversation, userId) {
  return String(conversation.seller?._id) === String(userId)
    ? conversation.interested
    : conversation.seller;
}

export function ConversationsPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/chat/conversaciones')
      .then(setConversations)
      .catch(requestError => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SiteLayout>
      <main className="container py-4">
        <h1 className="mb-4">Mis mensajes</h1>
        {loading && <p role="status">Cargando conversaciones…</p>}
        <Feedback error={error} />
        {!loading && !error && !conversations.length && (
          <p className="text-muted">Aún no tienes conversaciones. Puedes iniciar una desde una publicación.</p>
        )}
        <div className="list-group shadow-sm">
          {conversations.map(conversation => {
            const participant = otherParticipant(conversation, user.id);
            const lastMessage = conversation.lastMessage;
            return (
              <Link
                className="list-group-item list-group-item-action py-3"
                key={conversation._id}
                to={`/mensajes/${conversation._id}`}
              >
                <div className="d-flex justify-content-between gap-3">
                  <div>
                    <strong>{participant?.nombre || 'Usuario'}</strong>
                    <div>{conversation.publication?.nombre || 'Publicación eliminada'}</div>
                    <small className="text-muted">
                      {lastMessage?.text || 'Inicia la conversación'}
                    </small>
                  </div>
                  <small className="text-muted text-nowrap">
                    {new Date(conversation.updatedAt).toLocaleDateString('es-CL')}
                  </small>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </SiteLayout>
  );
}

export function ConversationPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    setConversation(null);
    setMessages([]);
    setError('');
    setLoading(true);

    const socket = io({
      auth: { token: localStorage.getItem('token') }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('chat:join', { conversacionId: id }, result => {
        if (!active) return;
        if (!result?.ok) {
          setError(result?.mensaje || 'No se pudo abrir esta conversación.');
          setLoading(false);
          return;
        }

        setConnected(true);
        setError('');
        socket.emit('chat:read', { conversacionId: id }, result => {
          if (active && !result?.ok) {
            setError(result?.mensaje || 'No se pudo actualizar el contador de mensajes.');
          }
        });
        apiRequest(`/api/chat/conversaciones/${encodeURIComponent(id)}`)
          .then(data => {
            if (!active) return;
            setConversation(data);
            setMessages(current => mergeMessages(current, data.messages || []));
          })
          .catch(requestError => {
            if (active) setError(requestError.message);
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      });
    });

    socket.on('chat:message', message => {
      if (!active) return;
      setMessages(current => mergeMessages(current, [message]));
      const senderId = message.sender?._id || message.sender;
      if (String(senderId) !== String(user.id)) {
        socket.emit('chat:read', { conversacionId: id }, result => {
          if (active && !result?.ok) {
            setError(result?.mensaje || 'No se pudo actualizar el contador de mensajes.');
          }
        });
      }
    });

    socket.on('connect_error', () => {
      if (!active) return;
      setConnected(false);
      setLoading(false);
      setError('No se pudo conectar al chat. Inicia sesión nuevamente e inténtalo otra vez.');
    });

    socket.on('disconnect', () => {
      if (active) setConnected(false);
    });

    return () => {
      active = false;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage(event) {
    event.preventDefault();
    const messageText = text.trim();
    if (!messageText || !socketRef.current || !connected) return;

    setSending(true);
    setError('');
    socketRef.current.timeout(5000).emit(
      'chat:send',
      { conversacionId: id, text: messageText },
      (timeoutError, result) => {
        setSending(false);
        if (timeoutError) {
          setError('El chat no respondió. Comprueba tu conexión e inténtalo nuevamente.');
        } else if (!result?.ok) {
          setError(result?.mensaje || 'No se pudo enviar el mensaje.');
        } else {
          setText('');
        }
      }
    );
  }

  const participant = conversation ? otherParticipant(conversation, user.id) : null;

  return (
    <SiteLayout>
      <main className="container py-4">
        <Link to="/mensajes" className="text-decoration-none">← Volver a mis mensajes</Link>
        {conversation && (
          <section className="card shadow-sm mt-3 chat-panel">
            <header className="card-header d-flex justify-content-between align-items-center gap-3">
              <div>
                <h1 className="h5 mb-1">{participant?.nombre || 'Usuario'}</h1>
                <span className="text-muted">
                  {conversation.publication?.nombre || 'Publicación eliminada'}
                </span>
              </div>
              <span className={`badge ${connected ? 'bg-success' : 'bg-secondary'}`}>
                {connected ? 'En línea' : 'Conectando…'}
              </span>
            </header>
            <div className="chat-messages" aria-live="polite">
              {messages.map(message => {
                const senderId = message.sender?._id || message.sender;
                const mine = String(senderId) === String(user.id);
                return (
                  <div
                    className={`chat-message ${mine ? 'chat-message-mine' : 'chat-message-theirs'}`}
                    key={message._id}
                  >
                    <span>{message.text}</span>
                    <time dateTime={message.createdAt}>
                      {new Date(message.createdAt).toLocaleString('es-CL', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </time>
                  </div>
                );
              })}
              {!loading && !messages.length && (
                <p className="text-center text-muted my-auto">Envía el primer mensaje para iniciar la conversación.</p>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="card-body">
              {loading && <p role="status">Cargando conversación…</p>}
              <Feedback error={error} />
              <form className="d-flex gap-2 mt-3" onSubmit={sendMessage}>
                <label className="visually-hidden" htmlFor="chat-message">Mensaje</label>
                <input
                  className="form-control"
                  id="chat-message"
                  value={text}
                  onChange={event => setText(event.target.value)}
                  maxLength={2000}
                  placeholder="Escribe un mensaje…"
                  autoComplete="off"
                  disabled={!connected || sending}
                  required
                />
                <button className="btn btn-primary" disabled={!connected || sending || !text.trim()}>
                  {sending ? 'Enviando…' : 'Enviar'}
                </button>
              </form>
            </div>
          </section>
        )}
        {!loading && !conversation && !error && (
          <p className="mt-4 text-muted">No se encontró la conversación.</p>
        )}
        {!conversation && error && <Feedback error={error} />}
      </main>
    </SiteLayout>
  );
}
