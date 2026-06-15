/**
 * AIAssistantWidget
 *
 * Floating AI chatbot assistant powered by the grievance QnA chatbot
 * from AI_Powered_Grievance_Redressal_System-main/src/qna_faiss.py
 *
 * • Float button (bottom-right, fixed position) — does not affect existing layout
 * • Opens a slide-up chat panel
 * • Calls POST /api/ai/chatbot with the user's message
 * • Falls back gracefully if API is unavailable
 */

import { useState, useRef, useEffect, useContext } from 'react';
import api from '../api/axios.js';
import { AuthContext } from '../context/AuthContext';
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2 } from 'lucide-react';

const WELCOME_MESSAGE = {
    id: 'welcome',
    role: 'bot',
    text:
        "👋 Hello! I'm your AI Grievance Assistant.\n\n" +
        "I can help you with:\n" +
        "• Filing & tracking complaints\n" +
        "• SLA response timelines\n" +
        "• Department routing\n" +
        "• Escalation procedures\n\n" +
        "Type your question below!",
    time: new Date(),
};

const QUICK_PROMPTS = [
    'How do I file a complaint?',
    'How long does resolution take?',
    'How do I track my complaint?',
    'What issues can I report?',
];

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AIAssistantWidget() {
    
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([WELCOME_MESSAGE]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to latest message
    useEffect(() => {
        if (open && !minimized) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, open, minimized]);

    // Focus input when opened
    useEffect(() => {
        if (open && !minimized) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [open, minimized]);

    const sendMessage = async (text) => {
        const query = (text || input).trim();
        if (!query) return;

        const userMsg = { id: Date.now(), role: 'user', text: query, time: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post(
                `/api/ai/chatbot`,
                { query }, { timeout: 8000 }
            );
            const botMsg = {
                id: Date.now() + 1,
                role: 'bot',
                text: res.data.response || 'Sorry, I could not process that.',
                intent: res.data.intent,
                time: new Date(),
            };
            setMessages(prev => [...prev, botMsg]);
        } catch {
            const errMsg = {
                id: Date.now() + 1,
                role: 'bot',
                text:
                    "Sorry, I'm temporarily unavailable. Please try again shortly, or " +
                    "check the 'My Complaints' section for status updates.",
                time: new Date(),
                isError: true,
            };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const resetChat = () => {
        setMessages([WELCOME_MESSAGE]);
        setInput('');
    };

    return (
        <>
            {/* ── Floating Chat Button ── */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    title="AI Grievance Assistant"
                    style={{
                        position: 'fixed',
                        bottom: '1.75rem',
                        right: '1.75rem',
                        zIndex: 9999,
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 24px rgba(124,58,237,0.45)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.6)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,58,237,0.45)';
                    }}
                >
                    <MessageCircle size={24} color="white" />
                    {/* Pulse ring */}
                    <span style={{
                        position: 'absolute',
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        border: '2px solid rgba(124,58,237,0.5)',
                        animation: 'aiPulse 2s infinite',
                    }} />
                </button>
            )}

            {/* ── Chat Panel ── */}
            {open && (
                <div style={{
                    position: 'fixed',
                    bottom: '1.75rem',
                    right: '1.75rem',
                    zIndex: 9999,
                    width: 360,
                    maxWidth: 'calc(100vw - 2rem)',
                    borderRadius: 18,
                    overflow: 'hidden',
                    boxShadow: '0 16px 64px rgba(0,0,0,0.22)',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg-surface, #ffffff)',
                    border: '1px solid rgba(124,58,237,0.15)',
                    transition: 'height 0.3s ease',
                    height: minimized ? 60 : 520,
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.875rem 1rem',
                        background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
                        flexShrink: 0,
                    }}>
                        <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.18)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Bot size={18} color="white" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>AI Grievance Assistant</p>
                            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', margin: 0 }}>Powered by AI_Powered_Grievance_System</p>
                        </div>
                        <button onClick={() => setMinimized(!minimized)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', padding: '0.25rem', opacity: 0.8 }}
                            title={minimized ? 'Expand' : 'Minimize'}>
                            <Minimize2 size={16} />
                        </button>
                        <button onClick={() => { setOpen(false); setMinimized(false); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', padding: '0.25rem', opacity: 0.8 }}
                            title="Close">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body (hidden when minimized) */}
                    {!minimized && (
                        <>
                            {/* Messages area */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                background: '#f8fafc',
                            }}>
                                {messages.map(msg => (
                                    <div key={msg.id} style={{
                                        display: 'flex',
                                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                        gap: '0.5rem',
                                        alignItems: 'flex-end',
                                    }}>
                                        {/* Avatar */}
                                        <div style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: '50%',
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: msg.role === 'bot'
                                                ? 'linear-gradient(135deg, #7c3aed, #0ea5e9)'
                                                : 'linear-gradient(135deg, #059669, #0ea5e9)',
                                        }}>
                                            {msg.role === 'bot'
                                                ? <Bot size={14} color="white" />
                                                : <User size={14} color="white" />
                                            }
                                        </div>
                                        {/* Bubble */}
                                        <div style={{
                                            maxWidth: '78%',
                                            padding: '0.65rem 0.875rem',
                                            borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                            background: msg.role === 'user'
                                                ? 'linear-gradient(135deg, #7c3aed, #0ea5e9)'
                                                : msg.isError
                                                    ? '#fff3f3'
                                                    : 'white',
                                            color: msg.role === 'user' ? 'white' : (msg.isError ? '#dc2626' : '#1e293b'),
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                            border: msg.role === 'bot' && !msg.isError ? '1px solid rgba(0,0,0,0.06)' : 'none',
                                        }}>
                                            <pre style={{
                                                margin: 0,
                                                fontFamily: 'inherit',
                                                fontSize: '0.83rem',
                                                lineHeight: 1.55,
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                            }}>{msg.text}</pre>
                                            <p style={{
                                                margin: '0.35rem 0 0',
                                                fontSize: '0.65rem',
                                                opacity: 0.55,
                                                textAlign: msg.role === 'user' ? 'right' : 'left',
                                            }}>{formatTime(msg.time)}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Typing indicator */}
                                {loading && (
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Bot size={14} color="white" />
                                        </div>
                                        <div style={{ padding: '0.65rem 0.875rem', borderRadius: '14px 14px 14px 2px', background: 'white', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Loader2 size={14} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Thinking...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={bottomRef} />
                            </div>

                            {/* Quick prompts (show only when no custom messages beyond welcome) */}
                            {messages.length <= 1 && (
                                <div style={{
                                    padding: '0.5rem 0.75rem 0',
                                    background: '#f8fafc',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.4rem',
                                    borderTop: '1px solid rgba(0,0,0,0.05)',
                                }}>
                                    {QUICK_PROMPTS.map(q => (
                                        <button key={q} onClick={() => sendMessage(q)}
                                            style={{
                                                padding: '0.3rem 0.65rem',
                                                borderRadius: 99,
                                                border: '1px solid rgba(124,58,237,0.3)',
                                                background: 'rgba(124,58,237,0.05)',
                                                color: '#7c3aed',
                                                fontSize: '0.72rem',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                                transition: 'all 0.15s ease',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.12)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input area */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: '0.5rem',
                                padding: '0.75rem',
                                borderTop: '1px solid rgba(0,0,0,0.07)',
                                background: 'white',
                                flexShrink: 0,
                            }}>
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask me anything about grievances..."
                                    rows={1}
                                    style={{
                                        flex: 1,
                                        resize: 'none',
                                        border: '1px solid rgba(124,58,237,0.25)',
                                        borderRadius: 10,
                                        padding: '0.55rem 0.75rem',
                                        fontFamily: 'inherit',
                                        fontSize: '0.85rem',
                                        outline: 'none',
                                        lineHeight: 1.5,
                                        color: '#1e293b',
                                        background: '#f8fafc',
                                        maxHeight: 80,
                                        overflowY: 'auto',
                                    }}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                                <button
                                    onClick={() => sendMessage()}
                                    disabled={loading || !input.trim()}
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 10,
                                        background: loading || !input.trim()
                                            ? '#e2e8f0'
                                            : 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
                                        border: 'none',
                                        cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <Send size={16} color={loading || !input.trim() ? '#94a3b8' : 'white'} />
                                </button>
                            </div>

                            {/* Footer */}
                            <div style={{
                                padding: '0.35rem 0.75rem',
                                background: 'white',
                                borderTop: '1px solid rgba(0,0,0,0.04)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>AI Grievance Assistant • qna_faiss engine</span>
                                <button onClick={resetChat}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', color: '#7c3aed' }}>
                                    Clear chat
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            <style>{`
                @keyframes aiPulse {
                    0%   { transform: scale(1); opacity: 1; }
                    70%  { transform: scale(1.6); opacity: 0; }
                    100% { transform: scale(1.6); opacity: 0; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}
