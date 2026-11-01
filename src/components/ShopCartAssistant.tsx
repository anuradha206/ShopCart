import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, ShoppingBag, Trash2, X } from 'lucide-react';
import type { Product } from '../types';
import { api } from '../services/api';
import { formatINR } from '../utils/currency';

type ChatMessage = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  products?: Product[];
};

interface ShopCartAssistantProps {
  onSelectProduct: (product: Product) => void;
}

const suggestions = [
  'Find products under ₹500.',
  'Recommend something for me.',
  'Show available products.',
  'Compare products.',
  'How do I place an order?',
];

const startingMessage: ChatMessage = {
  id: 0,
  role: 'assistant',
  text: 'Hi! I can help you find products, compare options, check availability, or explain how to place an order. What are you looking for?',
};

const ProductRecommendation: React.FC<{
  product: Product;
  onView: (product: Product) => void;
}> = ({ product, onView }) => {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <article className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[#dce5df] bg-white p-2.5">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#edf4ef] text-brand-700">
        {!imageFailed ? <img src={product.image_url} alt={product.name} onError={() => setImageFailed(true)} className="h-full w-full object-cover" /> : <ShoppingBag className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-[#17212B]">{product.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] text-slate-500">
          <span className="font-bold text-[#17212B]">{formatINR(product.price)}</span>
          <span>★ {Number(product.average_rating || 0).toFixed(1)}</span>
          <span className={product.stock_quantity > 0 ? 'text-brand-700' : 'text-rose-600'}>{product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}</span>
        </div>
      </div>
      <button onClick={() => onView(product)} className="shrink-0 rounded-lg bg-brand-600 px-2.5 py-2 text-[10px] font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
        View Product
      </button>
    </article>
  );
};

export const ShopCartAssistant: React.FC<ShopCartAssistantProps> = ({ onSelectProduct }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([startingMessage]);
  const nextId = useRef(1);
  const pending = useRef(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  const sendMessage = async (question = draft) => {
    const text = question.trim();
    if (!text || pending.current) return;
    pending.current = true;
    const userMessage: ChatMessage = { id: nextId.current++, role: 'user', text };
    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setLoading(true);
    try {
      const result = await api.chatAssistant(text);
      setMessages((current) => [...current, {
        id: nextId.current++,
        role: 'assistant',
        text: result.reply,
        products: result.products,
      }]);
    } catch {
      setMessages((current) => [...current, {
        id: nextId.current++,
        role: 'assistant',
        text: 'I could not reach the ShopCart catalogue just now. Please try again in a moment.',
      }]);
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([startingMessage]);
    setDraft('');
    nextId.current = 1;
  };

  return (
    <div className="fixed bottom-5 right-4 z-[60] sm:right-6" aria-label="ShopCart shopping assistant">
      {open && <section className="absolute bottom-[4.5rem] right-0 flex h-[min(540px,calc(100dvh-7rem))] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#dce5df] bg-[#F5F7F4] shadow-2xl shadow-[#17212b33]" aria-label="AI ShopCart Assistant">
        <header className="flex items-center justify-between gap-2 border-b border-[#dce5df] bg-[#EAF3EF] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#16718A] text-white"><Bot className="h-5 w-5" /></span>
            <div className="min-w-0"><h2 className="truncate text-sm font-bold text-[#17212B]">AI ShopCart Assistant</h2><p className="mt-0.5 text-[11px] text-slate-600">Your personal shopping helper</p></div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={clearConversation} disabled={loading} title="Clear conversation" aria-label="Clear conversation" className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-[#16718A] disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
            <button onClick={() => setOpen(false)} title="Close chat" aria-label="Close chat" className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-[#16718A]"><X className="h-4 w-4" /></button>
          </div>
        </header>

        <div ref={messageListRef} role="log" aria-live="polite" aria-label="Chat messages" className="flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:px-4">
          {messages.map((message) => <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[92%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${message.role === 'user' ? 'rounded-br-md bg-[#16718A] text-white' : 'rounded-bl-md border border-[#e1e9e3] bg-white text-[#17212B] shadow-sm'}`}>
              <p className="whitespace-pre-wrap">{message.text}</p>
              {message.products && message.products.length > 0 && <div className="mt-2.5 space-y-2">
                {message.products.map((product) => <ProductRecommendation key={product.id} product={product} onView={(selected) => { setOpen(false); onSelectProduct(selected); }} />)}
              </div>}
            </div>
          </div>)}
          {messages.length === 1 && !loading && <div className="flex flex-wrap gap-1.5 pl-1">
            {suggestions.map((suggestion) => <button key={suggestion} onClick={() => sendMessage(suggestion)} className="rounded-full border border-[#cfe0d7] bg-white px-2.5 py-1.5 text-[10px] font-medium text-[#31535b] transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800">{suggestion}</button>)}
          </div>}
          {loading && <div className="flex justify-start"><div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-[#e1e9e3] bg-white px-3 py-2.5 text-xs text-slate-500 shadow-sm"><span className="flex gap-1" aria-label="Assistant is responding"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-600 [animation-delay:-.2s]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-600 [animation-delay:-.1s]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-600" /></span>Finding an answer…</div></div>}
        </div>

        <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="flex items-center gap-2 border-t border-[#dce5df] bg-white p-3">
          <input ref={inputRef} value={draft} maxLength={500} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about products or orders…" aria-label="Type your message" className="min-w-0 flex-1 rounded-xl border border-[#dce5df] bg-[#fbfcfb] px-3 py-2.5 text-xs text-[#17212B] outline-none placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          <button type="submit" disabled={!draft.trim() || loading} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#16718A] text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-45"><Send className="h-4 w-4" /></button>
        </form>
      </section>}

      <button onClick={() => setOpen((current) => !current)} aria-label={open ? 'Close AI ShopCart Assistant' : 'Open AI ShopCart Assistant'} aria-expanded={open} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#16718A] text-white shadow-lg shadow-[#16718a44] transition-transform hover:scale-105 hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16718A]">
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
};
