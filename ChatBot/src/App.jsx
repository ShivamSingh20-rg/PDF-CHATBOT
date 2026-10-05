import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { 
  MessageSquare, 
  Plus, 
  Sparkles, 
  Code, 
  Compass, 
  Lightbulb, 
  Send, 
  User, 
  Bot, 
  ChevronRight,
  Loader2,
  Paperclip,
  FileText,
  X
} from "lucide-react";

export default function ChatbotHomepage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // PDF Upload States
  const [file, setFile] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfUploaded, setPdfUploaded] = useState(false);

  // Session ID to isolate Pinecone vector namespace per chat session
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  const [recentChats] = useState([
    "React Grid Layout Fix",
    "Node.js Auth Middleware",
    "DSA Two-Pointer Strategy"
  ]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Cleanup vectors in Pinecone when user leaves or closes tab
  useEffect(() => {
    const handleUnload = () => {
      if (pdfUploaded) {
        const data = JSON.stringify({ sessionId });
        navigator.sendBeacon(
          "http://localhost:3001/api/clear-session",
          new Blob([data], { type: "application/json" })
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [sessionId, pdfUploaded]);

  // Clear PDF & Session Vectors when starting a New Chat
  const handleNewChat = async () => {
    if (pdfUploaded) {
      try {
        await axios.post("http://localhost:3001/api/clear-session", { sessionId });
      } catch (err) {
        console.error("Failed to clear session vectors:", err);
      }
    }
    setMessages([]);
    setFile(null);
    setPdfUploaded(false);
  };

  // Upload PDF to backend
  const handlePdfUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      alert("Please select a valid PDF file.");
      return;
    }

    setFile(selectedFile);
    setUploadingPdf(true);

    const formData = new FormData();
    formData.append("pdf", selectedFile);
    formData.append("sessionId", sessionId);

    try {
      await axios.post("http://localhost:3001/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPdfUploaded(true);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "assistant",
          text: `📄 Document "${selectedFile.name}" processed successfully! You can now ask questions about it.`,
        },
      ]);
    } catch (error) {
      console.error("PDF upload failed:", error);
      alert("Failed to process PDF. Please try again.");
      setFile(null);
      setPdfUploaded(false);
    } finally {
      setUploadingPdf(false);
    }
  };

  // Remove current PDF and clear from Pinecone
  const handleRemovePdf = async () => {
    if (pdfUploaded) {
      try {
        await axios.post("http://localhost:3001/api/clear-session", { sessionId });
      } catch (err) {
        console.error("Error clearing vectors:", err);
      }
    }
    setFile(null);
    setPdfUploaded(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if (!input.trim() || loading || uploadingPdf) return;

    const userText = input.trim();
    const userMessage = { id: Date.now(), role: "user", text: userText };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:3001/api/chat", {
        message: userText,
        hasUploadedPdf: pdfUploaded,
        sessionId: sessionId,
      });

      const botResponse = {
        id: Date.now() + 1,
        role: "assistant",
        text: response.data.reply || response.data.message || "No response received.",
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("API Call Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "Error connecting to the server. Please check your backend connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const promptCards = [
    {
      icon: <Code className="w-5 h-5 text-emerald-400" />,
      title: "Debug Code",
      subtitle: "Find syntax & logic bugs in JS or C++"
    },
    {
      icon: <Lightbulb className="w-5 h-5 text-amber-400" />,
      title: "Brainstorm Ideas",
      subtitle: "Architecture for a MERN app"
    },
    {
      icon: <Compass className="w-5 h-5 text-indigo-400" />,
      title: "Explore Concepts",
      subtitle: "How async/await works under the hood"
    },
    {
      icon: <Sparkles className="w-5 h-5 text-sky-400" />,
      title: "Optimize Performance",
      subtitle: "Refactor React state & re-renders"
    }
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between p-3 hidden md:flex">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-wide text-slate-100">AI Assistant</span>
          </div>

          <button 
            onClick={handleNewChat} 
            className="w-full flex items-center justify-between px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md shadow-indigo-600/20 font-medium text-sm"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Chat
            </span>
            <kbd className="hidden sm:inline-block text-[10px] bg-indigo-700/60 px-1.5 py-0.5 rounded text-indigo-100 border border-indigo-500/30">⌘K</kbd>
          </button>

          <div className="pt-2">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent</p>
            <div className="space-y-1">
              {recentChats.map((chat, idx) => (
                <button 
                  key={idx}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors text-left group truncate"
                >
                  <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                  <span className="truncate">{chat}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
        
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Mobile Header */}
        <header className="p-4 border-b border-slate-800/60 flex items-center justify-between md:hidden bg-slate-900/50 backdrop-blur">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-slate-100">AI Assistant</span>
          </div>
          <button onClick={handleNewChat} className="p-2 bg-indigo-600 text-white rounded-lg">
            <Plus className="w-4 h-4" />
          </button>
        </header>

        {/* Dynamic Chat & Hero Body */}
        <div className="flex-1 flex flex-col items-center justify-between px-4 max-w-4xl w-full mx-auto overflow-hidden py-6">
          
          {/* Scrollable container */}
          <div className="w-full flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="text-center space-y-3 mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-2">
                    <Bot className="w-3.5 h-3.5" />
                    Powered by RAG & Pinecone
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight">
                    What can I help you build today?
                  </h1>
                  <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
                    Ask anything, upload a PDF to analyze, or convert concepts into actionable setups.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  {promptCards.map((card, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(card.subtitle)}
                      className="group flex items-start justify-between p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl transition-all text-left shadow-sm hover:shadow-indigo-500/5"
                    >
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center gap-2">
                          {card.icon}
                          <span className="font-medium text-slate-200 text-sm">{card.title}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{card.subtitle}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0 self-center" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Appended Chat Messages */
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md ${
                      msg.role === "user"
                        ? "bg-indigo-600"
                        : "bg-slate-800 border border-slate-700/60 text-indigo-400"
                    }`}
                  >
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed max-w-xl ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-3 max-w-3xl mr-auto items-center">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-slate-800 border border-slate-700/60 text-indigo-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl rounded-tl-none text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  Generating response...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="w-full relative pt-4">

            {/* PDF Status Badge */}
            {file && (
              <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="truncate max-w-xs">{file.name}</span>
                {uploadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 ml-1" />
                ) : (
                  <button onClick={handleRemovePdf} className="p-0.5 hover:bg-slate-800 rounded-md transition-colors ml-1">
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                  </button>
                )}
              </div>
            )}

            <div className="relative flex items-center bg-slate-900/80 border border-slate-800 focus-within:border-indigo-500/80 rounded-2xl shadow-xl backdrop-blur transition-all p-2">
              
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePdfUpload}
                accept="application/pdf"
                className="hidden"
              />

              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPdf || loading}
                title="Upload PDF"
                className="p-2 text-slate-400 hover:text-indigo-400 disabled:opacity-50 transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Text Input */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  pdfUploaded 
                    ? "Ask a question about the uploaded PDF..." 
                    : "Ask anything or attach a PDF..."
                }
                rows={1}
                className="w-full bg-transparent text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none resize-none max-h-32"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              {/* Send Button */}
              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading || uploadingPdf}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-md shrink-0 ml-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[11px] text-center text-slate-500 mt-2.5">
              AI can make mistakes. Verify critical code and output.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}