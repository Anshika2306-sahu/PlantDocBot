import React, { useState } from "react";

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hello! I'm PlantDocBot. Tell me about your plant's symptoms, and I'll help diagnose any diseases.",
    },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", text: input }]);
    setInput("");
  };

  return (
    <div className="chat-panel">
      <div className="chat-history">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.text}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Describe symptoms (e.g., brown spots, yellowing leaves)…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={sendMessage}>➤</button>
      </div>
    </div>
  );
}
