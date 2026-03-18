import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

function ChatWidget({ userId, authToken }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChat = () => setIsOpen((prev) => !prev);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = { from: "user", text: inputText };
    setMessages((msgs) => [...msgs, userMessage]);

    try {
      const resp = await axios.post(
        "http://localhost:8000/api/v1/chatbot",
        { user_id: userId, message: inputText },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const botReply = resp.data.reply;
      setMessages((msgs) => [...msgs, { from: "bot", text: botReply }]);
    } catch (err) {
      console.error("Chat API error:", err);
      setMessages((msgs) => [
        ...msgs,
        { from: "bot", text: "Sorry, something went wrong." },
      ]);
    }

    setInputText("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4">
      {/* Toggle Button */}
      <button
        onClick={toggleChat}
        className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600"
      >
        {isOpen ? "✖" : "💬"}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 h-96 bg-white shadow-lg rounded-lg flex flex-col mt-2">
          <div className="bg-blue-500 text-white p-2 rounded-t-lg text-center font-semibold">
            ChatBot
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-2 rounded max-w-[75%] ${
                  m.from === "user"
                    ? "bg-blue-100 self-end"
                    : "bg-gray-100 self-start"
                }`}
              >
                {m.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-2 border-t flex gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 border rounded p-2 h-12 resize-none focus:ring focus:ring-blue-300"
            ></textarea>
            <button
              onClick={sendMessage}
              className="bg-blue-500 text-white px-4 rounded hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWidget;
