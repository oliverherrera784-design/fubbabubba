'use client';

interface CategoryTabsProps {
  categorias: string[];
  selected: string;
  onSelect: (cat: string) => void;
}

export function CategoryTabs({ categorias, selected, onSelect }: CategoryTabsProps) {
  const allCats = ['TODAS', ...categorias];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {allCats.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`
            px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all
            ${selected === cat
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }
          `}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
