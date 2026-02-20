"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content:
                "👋 Hi! I'm your NextUp Mentor assistant. Ask me anything about studying in Europe — in English, বাংলা, or Banglish! 🎓",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            inputRef.current?.focus();
        }
    }, [messages, isOpen]);

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMessage: Message = { role: "user", content: trimmed };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages.slice(1), // skip initial welcome message
                }),
            });

            const data = await res.json();

            if (data.error) {
                setMessages([
                    ...updatedMessages,
                    {
                        role: "assistant",
                        content: data.error,
                    },
                ]);
            } else {
                setMessages([
                    ...updatedMessages,
                    { role: "assistant", content: data.message },
                ]);
            }
        } catch {
            setMessages([
                ...updatedMessages,
                {
                    role: "assistant",
                    content:
                        "Connection error. Please check your internet and try again.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed bottom-28 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col"
                        style={{ height: "520px" }}
                        initial={{ opacity: 0, scale: 0.85, y: 20, originX: 1, originY: 1 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        {/* Glass card */}
                        <div
                            className="flex flex-col h-full rounded-2xl overflow-hidden shadow-2xl"
                            style={{
                                background:
                                    "linear-gradient(145deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.97) 100%)",
                                border: "1px solid rgba(245,158,11,0.25)",
                                backdropFilter: "blur(20px)",
                                boxShadow:
                                    "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
                            }}
                        >
                            {/* Header */}
                            <div
                                className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
                                style={{
                                    background:
                                        "linear-gradient(90deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.08) 100%)",
                                    borderBottom: "1px solid rgba(245,158,11,0.2)",
                                }}
                            >
                                <div className="relative">
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                        }}
                                    >
                                        🎓
                                    </div>
                                    <span
                                        className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900"
                                        style={{ background: "#22c55e" }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold text-sm leading-tight">
                                        NextUp Mentor AI
                                    </p>
                                    <p className="text-amber-400/70 text-xs">
                                        Ask in English, বাংলা, or Banglish
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                                    aria-label="Close chat"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"
                                            }`}
                                    >
                                        {msg.role === "assistant" && (
                                            <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                                                style={{
                                                    background:
                                                        "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                                }}
                                            >
                                                🎓
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${msg.role === "user"
                                                ? "text-slate-900 rounded-br-sm"
                                                : "text-slate-200 rounded-bl-sm"
                                                }`}
                                            style={
                                                msg.role === "user"
                                                    ? {
                                                        background:
                                                            "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                                    }
                                                    : {
                                                        background: "rgba(255,255,255,0.07)",
                                                        border: "1px solid rgba(255,255,255,0.08)",
                                                    }
                                            }
                                        >
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Typing indicator */}
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-2 justify-start"
                                    >
                                        <div
                                            className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                            }}
                                        >
                                            🎓
                                        </div>
                                        <div
                                            className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1"
                                            style={{
                                                background: "rgba(255,255,255,0.07)",
                                                border: "1px solid rgba(255,255,255,0.08)",
                                            }}
                                        >
                                            {[0, 1, 2].map((i) => (
                                                <motion.span
                                                    key={i}
                                                    className="w-2 h-2 rounded-full bg-amber-400"
                                                    animate={{ y: [0, -5, 0] }}
                                                    transition={{
                                                        repeat: Infinity,
                                                        duration: 0.8,
                                                        delay: i * 0.15,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div
                                className="px-3 py-3 flex-shrink-0"
                                style={{ borderTop: "1px solid rgba(245,158,11,0.15)" }}
                            >
                                <div
                                    className="flex items-center gap-2 rounded-xl px-3 py-2"
                                    style={{
                                        background: "rgba(255,255,255,0.06)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                >
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask a question..."
                                        disabled={isLoading}
                                        className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm outline-none"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={isLoading || !input.trim()}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-30 hover:scale-110"
                                        style={{
                                            background: input.trim()
                                                ? "linear-gradient(135deg, #f59e0b, #d97706)"
                                                : "rgba(255,255,255,0.1)",
                                        }}
                                        aria-label="Send message"
                                    >
                                        <svg
                                            className="w-4 h-4 text-slate-900"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2.5}
                                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                            />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-center text-slate-600 text-[10px] mt-1.5">
                                    Powered by Gemini AI · NextUp Mentor
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                onClick={() => setIsOpen((v) => !v)}
                className="fixed bottom-6 right-24 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{
                    background: isOpen
                        ? "linear-gradient(135deg, #475569, #334155)"
                        : "linear-gradient(135deg, #f59e0b, #d97706)",
                    boxShadow: isOpen
                        ? "0 8px 24px rgba(0,0,0,0.3)"
                        : "0 8px 24px rgba(245,158,11,0.4)",
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6, ease: "easeOut" }}
                aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.svg
                            key="close"
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </motion.svg>
                    ) : (
                        <motion.span
                            key="bot"
                            className="text-2xl"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            ✨
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Notification badge — shown when chat is closed */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.span
                        className="fixed bottom-16 right-24 z-50 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center pointer-events-none"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ delay: 2, type: "spring" }}
                    >
                        1
                    </motion.span>
                )}
            </AnimatePresence>
        </>
    );
}
