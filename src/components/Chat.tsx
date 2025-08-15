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

      {/* Speech Bubble - shown when chat is closed */}
      {!isOpen && (
        <div className="absolute bottom-16 right-2 mb-3 mr-1">
          {/* Bubble container with beautiful gradient */}
          <div className="relative bg-gradient-to-br from-[#FFC86B] via-[#ffb94d] to-[#e6a73d] text-neutral-900 px-5 py-3 rounded-2xl rounded-br-sm shadow-2xl border border-white/30 animate-bounce hover:animate-pulse transition-all duration-300">
            {/* Subtle inner highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/5 rounded-2xl rounded-br-sm pointer-events-none"></div>
            
            {/* Text content with better typography */}
            <div className="relative text-sm font-bold whitespace-nowrap leading-tight tracking-wide drop-shadow-sm">
              <div>HOLA SOY CARLOS</div>
              <div>DÉJAME CONTARTE</div>
              <div>MÁS DE MÍ</div>
            </div>
            
            {/* Enhanced speech bubble tail */}
            <div className="absolute bottom-0 right-2 transform translate-y-full">
              {/* Outer shadow tail */}
              <div className="absolute top-0 left-0 w-0 h-0 border-l-[16px] border-l-transparent border-t-[16px] border-t-black/10"></div>
              {/* Main tail with gradient */}
              <div className="relative w-0 h-0 border-l-[14px] border-l-transparent border-t-[14px] border-t-[#e6a73d]"></div>
              <div className="absolute -top-[12px] left-[1px] w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-[#FFC86B]"></div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/80 rounded-full animate-ping"></div>
            <div className="absolute top-1 left-2 w-1 h-1 bg-white/60 rounded-full animate-pulse delay-500"></div>
            <div className="absolute bottom-1 right-8 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-1000"></div>
          </div>
        </div>
      )}

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
          <img 
            src="/icons/chatbot_head.svg" 
            alt="Chatbot Carlos" 
            className="w-16 h-16 group-hover:animate-pulse transition-all duration-300 filter group-hover:brightness-110 group-hover:drop-shadow-lg"
          />
        )}
      </button>
    </div>
  );
}
