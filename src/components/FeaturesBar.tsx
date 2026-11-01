import React from 'react';
import { PackageCheck, Search, Heart, CreditCard } from 'lucide-react';

const features = [
  { icon: Search, title: 'Easy to browse', note: 'Search and sort the catalog' },
  { icon: PackageCheck, title: 'Stock shown clearly', note: 'See availability before adding' },
  { icon: Heart, title: 'Save for later', note: 'Keep a personal wishlist' },
  { icon: CreditCard, title: 'Simple checkout', note: 'Choose a payment option at checkout' },
];

export const FeaturesBar: React.FC = () => (
  <div className="max-w-7xl mx-auto px-5 sm:px-8 -mt-5 relative z-10">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-[#dce5df] bg-white shadow-sm divide-y sm:divide-y-0 sm:divide-x divide-[#e6ece8]">
      {features.map(({ icon: Icon, title, note }) => (
        <div key={title} className="flex items-center gap-3 px-5 py-4">
          <span className="h-9 w-9 rounded-lg bg-[#EAF3EF] text-[#16718A] flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-[#17212B]">{title}</span>
            <span className="block mt-0.5 text-xs text-[#65736f]">{note}</span>
          </span>
        </div>
      ))}
    </div>
  </div>
);

