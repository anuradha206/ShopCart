import React, { useState } from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';

interface HeroProps {
  onExploreCatalog: () => void;
  onFeaturedGadgets: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreCatalog, onFeaturedGadgets }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
  <section className="bg-[#EAF3EF] border-b border-[#dce8e2]">
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16 lg:py-20 grid lg:grid-cols-[1.1fr_.9fr] gap-10 items-center">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold tracking-wide text-[#16718A] mb-4">A little of everything, all in one place</p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight font-semibold text-[#202820]">
          Good finds for <span>everyday life.</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#5f665e] max-w-xl">
          Browse useful tech, comfortable clothes and home essentials. Pick what you need and check out in a few steps.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button onClick={onExploreCatalog} className="rounded-lg bg-[#16718A] px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16718A]">
            Browse all products <ArrowRight className="inline ml-2 h-4 w-4" />
          </button>
          <button onClick={onFeaturedGadgets} className="rounded-lg border border-[#c7c9f0] bg-white/70 px-5 py-3 text-sm font-semibold text-[#30304a] hover:bg-white">
            Shop electronics
          </button>
        </div>
        <p className="mt-6 text-xs text-[#70766e]">Prices shown in Indian rupees</p>
      </div>
      <div className={`relative min-h-[360px] sm:min-h-[440px] rounded-2xl overflow-hidden shadow-xl shadow-[#173b3520] ${imageFailed ? 'bg-[#dcebe4]' : 'bg-[#dcebe4]'}`}>
        {!imageFailed && <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=85"
          alt="A curated collection of everyday clothing and accessories"
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          onError={() => setImageFailed(true)}
        />}
        {imageFailed && <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#e4efe9] via-[#d8e8e0] to-[#c8ddd4]">
          <div className="text-center text-[#16718A]">
            <ShoppingBag className="mx-auto h-12 w-12" />
            <span className="mt-3 block text-xs font-semibold uppercase tracking-[.18em]">ShopCart</span>
          </div>
        </div>}
        <div className="absolute inset-0 bg-gradient-to-t from-[#10242dcc] via-[#10242d18] to-transparent" />
        <div className="absolute left-5 top-5 rounded-full border border-white/50 bg-white/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[#16718A] shadow-sm backdrop-blur-sm">ShopCart</div>
        <span className="absolute right-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-[#17212B] shadow-sm backdrop-blur-sm">New things, useful things</span>
      </div>
    </div>
  </section>
  );
};

