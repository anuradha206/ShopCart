import React from 'react';

interface PreFooterCtaProps {
  onBrowseAll: () => void;
  onCreateAccount: () => void;
}

export const PreFooterCta: React.FC<PreFooterCtaProps> = ({
  onBrowseAll,
  onCreateAccount,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-[#0f172a] rounded-3xl p-8 sm:p-14 text-center text-white border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Subtle radial glow inside card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Experience Seamless Online Shopping
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Browse the current catalogue, check product availability and choose a payment option at checkout.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
            <button
              onClick={onBrowseAll}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-brand-600/30 transition-transform hover:scale-[1.02] cursor-pointer"
            >
              Browse All Products
            </button>

            <button
              onClick={onCreateAccount}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
