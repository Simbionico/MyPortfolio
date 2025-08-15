import React, { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
      // Si quieres mostrar fuentes:
      // console.log(data.sources);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Hubo un error procesando tu mensaje." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) send();
  };

  return (
    <div className="relative">
      {/* Chat Window */}
      <div className={`transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'} absolute bottom-20 right-0 w-80 sm:w-96 bg-neutral-900/95 backdrop-blur-sm border border-neutral-700 rounded-2xl shadow-2xl`}>
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-white font-medium">Chat con Carlos</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          <div className="space-y-3 max-h-80 overflow-auto pr-1">
            {messages.length === 0 && (
              <div className="text-center text-neutral-400 text-sm py-8">
                <div className="mb-2">👋 ¡Hola! Soy Carlos</div>
                <div>Pregúntame sobre mi experiencia, proyectos o stack tecnológico</div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div className={`inline-block px-3 py-2 rounded-2xl shadow max-w-[80%] text-sm ${
                  m.role === "user" 
                    ? "bg-[#FFC86B] text-black" 
                    : "bg-neutral-800 text-white"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-left">
                <div className="inline-block px-3 py-2 bg-neutral-800 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 rounded-xl border border-neutral-600 bg-neutral-800 px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-[#FFC86B] focus:border-transparent placeholder-neutral-400"
              placeholder="Escribe tu pregunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button
              onClick={send}
              className="px-4 py-2 rounded-xl bg-[#FFC86B] hover:bg-[#ffb94d] text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              disabled={loading}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>

      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full bg-transparent hover:scale-110 hover:drop-shadow-2xl shadow-lg transition-all duration-300 flex items-center justify-center group ${
          isOpen ? 'rotate-12' : ''
        }`}
      >
        {isOpen ? (
          <svg className="w-8 h-8 text-[#FFC86B] group-hover:text-[#ffb94d] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative">
            {/* Pulse rings with slower, less frequent animations */}
            <div className="absolute inset-0 rounded-full bg-[#FFC86B]/20 animate-ping" style={{animationDuration: '3s'}}></div>
            <div className="absolute inset-0 rounded-full bg-[#FFC86B]/15 animate-pulse" style={{animationDuration: '4s', animationDelay: '1.5s'}}></div>
            
            <img 
              src="/icons/chatbot_head.svg" 
              alt="Chatbot Carlos" 
              className="relative w-16 h-16 transition-all duration-300 filter group-hover:brightness-110 group-hover:drop-shadow-lg group-hover:animate-pulse z-10"
            />
          </div>
        )}
      </button>
    </div>
  );
}
