import React, { useState } from "react";
import { Bot, Send } from "lucide-react";
import { useNotification } from "../../hooks/useNotification";
import { apiService } from "../../services/apiService";

const ChatbotPage = () => {
  const { showError } = useNotification();
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content: "Hello! I'm your HR assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await apiService.chatWithBot(input);
      const botMessage = { role: "bot", content: response.data.response };
      setMessages((prev) => [...prev, botMessage]);
      setLoading(false);
    } catch (error) {
      showError("Failed to get response");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-8rem)]">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI HR Assistant</h2>
              <p className="text-sm text-gray-500">
                Ask me anything about HR policies, leaves, payroll...
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-md px-4 py-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-3 rounded-lg">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <Send className="h-5 w-5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
