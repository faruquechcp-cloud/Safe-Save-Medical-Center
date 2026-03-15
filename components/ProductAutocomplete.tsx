
import React, { useState, useEffect, useRef } from 'react';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface ProductAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  name: string;
}

const ProductAutocomplete: React.FC<ProductAutocompleteProps> = ({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  required = false,
  name
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Filter suggestions based on input
    const filtered = suggestions.filter(
      item => item.toLowerCase().includes(value.toLowerCase()) && item !== value
    );
    setFilteredSuggestions(filtered);
    setHighlightedIndex(0);
  }, [value, suggestions]);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (item: string) => {
    onChange(item);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) {
        // If closed or empty, let Enter event bubble up so FormModal can move focus
        return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        e.preventDefault();
        e.stopPropagation(); // Stop propagation only if selecting an item
        handleSelect(filteredSuggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="space-y-1 relative" ref={wrapperRef}>
      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          name={name}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          required={required}
          placeholder={placeholder}
          className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-4 focus:ring-primary-500/10 outline-none transition-all pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <ChevronDownIcon className="w-4 h-4" />
        </div>
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-100 mt-1 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
          {filteredSuggestions.map((item, index) => (
            <li
              key={index}
              onMouseDown={() => handleSelect(item)} // onMouseDown fires before onBlur
              className={`px-4 py-2 cursor-pointer text-sm font-medium transition-colors ${index === highlightedIndex ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProductAutocomplete;
