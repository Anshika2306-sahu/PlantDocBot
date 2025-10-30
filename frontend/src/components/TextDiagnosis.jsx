import React, { useState } from "react";
import axios from "axios";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function TextDiagnosis() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text:
        "Hello! I'm PlantDocBot. Tell me about your plant's symptoms, and I'll help diagnose any diseases. What symptoms are you observing?",
      time: nowTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  function nowTime() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const clearChat = () => {
    setMessages([
      {
        role: "bot",
        text:
          "Hello! I'm PlantDocBot. Tell me about your plant's symptoms, and I'll help diagnose any diseases. What symptoms are you observing?",
        time: nowTime(),
      },
    ]);
  };

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // push user message
    setMessages((m) => [...m, { role: "user", text: trimmed, time: nowTime() }]);
    setInput("");
    setLoading(true);

    try {
      // Call FastAPI /predict/text using FormData (matches your backend)
      const form = new FormData();
      form.append("text", trimmed);
      const res = await axios.post(`${BACKEND}/predict/text`, form);

      const { prediction, probability } = res.data || {};
      const pct = Math.round((probability || 0) * 100);

      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: `Prediction: ${prediction}\nConfidence: ${pct}%`,
          time: nowTime(),
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: "⚠️ Sorry, text analysis failed. Please try again.",
          time: nowTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-wrap">
      <div className="chat-header">
        <h3>Chat History</h3>
        <button className="clear-btn" onClick={clearChat} title="Clear chat">
          {/* Trash icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"
                  stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span>Clear</span>
        </button>
      </div>

      <div className="chat-box">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <div className="bubble-text">{m.text}</div>
            <div className="bubble-time">{m.time}</div>
          </div>
        ))}

        {loading && (
          <div className="center-loading">
            <div className="center-spinner" />
            <p>Analyzing symptoms...</p>
          </div>
        )}
      </div>

      <div className="chat-input-row">
        <input
          type="text"
          value={input}
          placeholder="Describe symptoms (e.g., brown spots, yellowing leaves)…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button onClick={send} className="send-btn" title="Send">
          {/* Paper plane icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M22 2l-7 20-4-9-9-4 20-7Z" stroke="white" strokeWidth="2" fill="none" />
          </svg>
        </button>
      </div>
    </div>
  );
}
