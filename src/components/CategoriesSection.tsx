import React from 'react';
import {
  Laptop,
  Shirt,
  Footprints,
  Book,
  Sparkles,
  Utensils,
  Watch,
  Grid,
} from 'lucide-react';
import { Category } from '../types';
import { Product } from '../types';

interface CategoriesSectionProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
}

export const CATEGORIES_DATA: (Category & { iconComp: React.ComponentType<{ className?: string }> })[] = [
  {
    id: 1,
    name: 'All Categories',
    slug: 'all',
    item_count: 32,
    icon: 'Grid',
    iconComp: Grid,
  },
  {
    id: 2,
    name: 'Electronics',
    slug: 'electronics',
    description: 'Laptops, headphones, smartphones, gadgets',
    item_count: 8,
    icon: 'Laptop',
    iconComp: Laptop,
  },
  {
    id: 3,
    name: 'Clothing',
    slug: 'clothing',
    description: 'Shirts, jackets, denims, activewear',
    item_count: 6,
    icon: 'Shirt',
    iconComp: Shirt,
  },
  {
    id: 4,
    name: 'Shoes',
    slug: 'shoes',
    description: 'Sneakers, running shoes, formal wear',
    item_count: 5,
    icon: 'Footprints',
    iconComp: Footprints,
  },
  {
    id: 5,
    name: 'Books',
    slug: 'books',
    description: 'Computer science, fiction, self-help',
    item_count: 4,
    icon: 'Book',
    iconComp: Book,
  },
  {
    id: 6,
    name: 'Beauty',
    slug: 'beauty',
    description: 'Skincare, haircare, grooming',
    item_count: 3,
    icon: 'Sparkles',
    iconComp: Sparkles,
  },
  {
    id: 7,
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Coffee makers, cookware, smart home',
    item_count: 4,
    icon: 'Utensils',
    iconComp: Utensils,
  },
  {
    id: 8,
    name: 'Accessories',
    slug: 'accessories',
    description: 'Watches, bags, sunglasses',
    item_count: 2,
    icon: 'Watch',
    iconComp: Watch,
  },
];

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section className="py-8 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#17212B] tracking-tight">
              Product Categories
            </h2>
            <p className="text-xs text-slate-500">
              Browse by department or filter store catalog
            </p>
          </div>
          <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-100">
            {CATEGORIES_DATA.filter((category) => category.name !== 'All Categories' && products.some((product) => product.category.trim().toLowerCase() === category.name.toLowerCase())).length} Categories
          </span>
        </div>

        {/* Categories Row / Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
          {CATEGORIES_DATA.filter((category) => category.name === 'All Categories' || products.some((product) => product.category.trim().toLowerCase() === category.name.toLowerCase())).map((cat) => {
            const Icon = cat.iconComp;
            const itemCount = cat.name === 'All Categories' ? products.length : products.filter((product) => product.category.trim().toLowerCase() === cat.name.toLowerCase()).length;
            const isSelected =
              (cat.name === 'All Categories' && selectedCategory === 'All') ||
              cat.name === selectedCategory;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.name === 'All Categories' ? 'All' : cat.name)}
                className={`p-3 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1.5 border cursor-pointer ${
                  isSelected
                    ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20 scale-[1.02]'
                    : 'bg-white hover:bg-slate-100/80 text-slate-700 border-slate-200 shadow-2xs hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-brand-50 text-brand-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold leading-tight line-clamp-1">
                  {cat.name}
                </span>
                <span
                  className={`text-[10px] ${
                    isSelected ? 'text-brand-200' : 'text-slate-400'
                  }`}
                >
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
