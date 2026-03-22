import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

function ChatWidget() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sessionId = useRef(uuidv4());
  const messagesEndRef = useRef(null);

  // Read auth info from localStorage
  const userRaw = localStorage.getItem("user");
  const parsed = userRaw ? JSON.parse(userRaw) : null;
  // Shape stored at login: { _id, username, role, token }
  const authToken = parsed?.token ?? parsed?.data?.token ?? "";
  const userId = parsed?._id ?? parsed?.data?.user?._id ?? parsed?.data?._id ?? "";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChat = () => setIsOpen((prev) => !prev);

  const startNewChat = async () => {
    try {
      await axios.delete(
        `http://localhost:8000/api/v1/chatbot/session/${sessionId.current}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
    } catch (e) {}
    sessionId.current = uuidv4();
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = { from: "user", text: inputText };
    setMessages((msgs) => [...msgs, userMessage]);
    const currentInput = inputText;   
    setInputText("");
    setIsLoading(true);

    try {
      const resp = await axios.post(
        "http://localhost:8000/api/v1/chatbot",
        {
          userId,
          message: currentInput,       
          sessionId: sessionId.current, 
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessages((msgs) => [...msgs, { from: "bot", text: resp.data.reply }]);

      // Notify patient page to re-fetch medicines/reminders/history after chat actions.
      window.dispatchEvent(
        new CustomEvent("caresphere:chat-updated", {
          detail: {
            sessionId: sessionId.current,
            userMessage: currentInput,
            botReply: resp.data?.reply || "",
          },
        })
      );
    } catch (err) {
      console.error("Chat API error:", err);
      setMessages((msgs) => [
        ...msgs,
        { from: "bot", text: "⚠️ Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-blue-500/50 sm:h-16 sm:w-16"
        aria-label="Toggle chat"
      >
        <span className="text-2xl transition-transform duration-300 group-hover:rotate-12 sm:text-3xl">
          {isOpen ? "✖️" : "💬"}
        </span>
        {!isOpen && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
            !
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 flex h-[500px] w-[340px] flex-col overflow-hidden rounded-3xl border-2 border-blue-100 bg-white shadow-2xl animate-fadeIn sm:h-[550px] sm:w-[400px] lg:w-[450px]">
          {/* Header */}
          <div className="border-b border-blue-100 bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="text-xl">🤖</span>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold">Health Assistant</h2>
                  <p className="text-xs text-blue-100">AI-Powered Care</p>
                </div>
              </div>
              <button
                onClick={toggleChat}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-white/20"
                aria-label="Close chat"
              >
                <span className="text-xl">✖️</span>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50 flex-1 overflow-y-auto bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 inline-flex rounded-full bg-blue-100 p-4">
                  <span className="text-4xl">💙</span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-800">Welcome to CareSphere</h3>
                <p className="max-w-[280px] text-sm text-gray-600">
                  Your AI health assistant is ready to help. Ask me anything about your health, medications, or appointments.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex animate-fadeIn ${
                      m.from === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="flex max-w-[85%] items-end gap-2">
                      {m.from === "bot" && (
                        <div className="mb-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600">
                          <span className="text-xs">🤖</span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-md ${
                          m.from === "user"
                            ? "rounded-br-sm bg-gradient-to-r from-blue-500 to-indigo-600 font-medium text-white"
                            : "rounded-bl-sm border-2 border-blue-100 bg-white font-normal text-gray-800"
                        }`}
                      >
                        {m.from === "bot"
  ? m.text.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        {i < m.text.split("\n").length - 1 && <br />}
      </span>
    ))
  : m.text
}
                      </div>
                      {m.from === "user" && (
                        <div className="mb-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                          <span className="text-xs">👤</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex animate-fadeIn justify-start">
                    <div className="flex items-end gap-2">
                      <div className="mb-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600">
                        <span className="text-xs">🤖</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border-2 border-blue-100 bg-white px-4 py-3 shadow-md">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t-2 border-blue-100 bg-white p-4">
            <div className="flex items-end gap-2">
              <div className="relative flex-1">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="h-12 w-full resize-none rounded-xl border-2 border-blue-200 bg-blue-50/50 px-4 py-3 pr-10 text-sm font-medium text-gray-800 placeholder-gray-500 transition-all duration-200 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                  rows="1"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg opacity-40">
                  ✍️
                </span>
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isLoading}
                className="group flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                aria-label="Send message"
              >
                <span className="text-xl transition-transform duration-200 group-hover:translate-x-0.5">
                  {isLoading ? "⏳" : "📤"}
                </span>
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-gray-500">
              Press <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-xs">Enter</kbd> to send
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWidget;