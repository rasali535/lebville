import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { api, formatApiError } from "../lib/api";

const STORAGE_KEY = "lebville_chat_session";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello, I'm Lebi — your Lebville concierge. How may I help you today? ✦",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const { data } = await api.post("/chat/message", {
        session_id: sessionId || undefined,
        message: text,
      });
      if (data.session_id && data.session_id !== sessionId) {
        setSessionId(data.session_id);
        try { localStorage.setItem(STORAGE_KEY, data.session_id); } catch {}
      }
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I'm having trouble connecting. Please try again, or WhatsApp us at +267 73 011 600." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        data-testid="chatbot-toggle"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-terracotta text-bone shadow-xl hover:bg-espresso transition-all flex items-center justify-center"
        aria-label="Open chat"
      >
        {open ? <X size={20} /> : <MessageCircle size={22} />}
      </button>

      <div
        data-testid="chatbot-panel"
        className={`fixed bottom-24 right-6 z-40 w-[calc(100vw-3rem)] sm:w-[380px] h-[520px] bg-bone border border-espresso/10 shadow-2xl flex flex-col transition-all duration-400 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="px-5 py-4 border-b border-espresso/10 bg-espresso text-bone">
          <p className="font-serif text-xl">Concierge</p>
          <p className="text-xs text-bone/60 font-light">Lebi — online now</p>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              data-testid={`chat-msg-${m.role}`}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed font-light ${
                  m.role === "user"
                    ? "bg-espresso text-bone"
                    : "bg-sand/40 text-espresso border border-espresso/5"
                }`}
              >
                {m.content.split("\n").map((line, j) => (
                  <p key={j} className={j > 0 ? "mt-1" : ""}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-sand/40 px-4 py-2.5 text-sm text-espresso/70 italic font-light">typing…</div>
            </div>
          )}
        </div>

        <form onSubmit={send} className="p-3 border-t border-espresso/10 flex gap-2 bg-bone">
          <input
            data-testid="chatbot-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about styling, sizing, an order…"
            className="flex-1 luxury-input text-sm"
            disabled={loading}
          />
          <button
            data-testid="chatbot-send"
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-terracotta text-bone w-10 h-10 flex items-center justify-center hover:bg-espresso disabled:opacity-40 transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  );
}
