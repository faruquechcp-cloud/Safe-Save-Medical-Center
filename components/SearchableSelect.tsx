
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SearchIcon from './icons/SearchIcon';

export interface SearchableOption {
  id: string;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const SearchableSelect = React.forwardRef<HTMLInputElement, SearchableSelectProps>(({
  options,
  selectedId,
  onSelect,
  placeholder,
  className = "",
  label,
  required = false,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Use the forwarded ref if provided, otherwise use internal ref
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalInputRef;

  // Initialize search term with selected item's label
  useEffect(() => {
    if (selectedId) {
      const selected = options.find(o => o.id === selectedId);
      if (selected) {
        setSearchTerm(selected.label);
      }
    } else {
      setSearchTerm('');
    }
  }, [selectedId, options]);

  const filteredOptions = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    // If user hasn't typed anything and just opened, show all (limited). 
    // If typed, filter.
    if (!searchTerm && selectedId) return options.slice(0, 50); // Show context 
    
    return options.filter(o => 
      o.label.toLowerCase().includes(lowerTerm) || 
      (o.subLabel && o.subLabel.toLowerCase().includes(lowerTerm))
    ).slice(0, 50);
  }, [options, searchTerm, selectedId]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        
        // Auto-select if only one option exists and nothing is selected
        if (!selectedId && filteredOptions.length === 1) {
            handleSelect(filteredOptions[0]);
        } else if (selectedId) {
             const selected = options.find(o => o.id === selectedId);
             if (selected && searchTerm !== selected.label) {
                 setSearchTerm(selected.label);
             }
        } else {
            setSearchTerm('');
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, selectedId, options, searchTerm, filteredOptions]);

  // Reset highlighted index when options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const listElement = listRef.current;
      const scrollContainer = listElement.parentElement; // div wrapping ul
      const highlightedElement = listElement.children[highlightedIndex] as HTMLElement;
      
      if (highlightedElement && scrollContainer) {
        const containerTop = scrollContainer.scrollTop;
        const containerHeight = scrollContainer.clientHeight;
        const containerBottom = containerTop + containerHeight;

        const elementTop = highlightedElement.offsetTop;
        const elementHeight = highlightedElement.offsetHeight;
        const elementBottom = elementTop + elementHeight;

        if (elementTop < containerTop) {
          scrollContainer.scrollTop = elementTop;
        } else if (elementBottom > containerBottom) {
          scrollContainer.scrollTop = elementBottom - containerHeight;
        }
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (item: SearchableOption) => {
    onSelect(item.id);
    setSearchTerm(item.label);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
    inputRef.current?.select();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    if (e.target.value === '') {
        onSelect(''); 
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
        if (isOpen && filteredOptions.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            handleSelect(filteredOptions[highlightedIndex]);
        } else {
            setIsOpen(false);
        }
        return;
    }

    if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
            setIsOpen(true);
        }
        return;
    }

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
            break;
        case 'ArrowUp':
            e.preventDefault();
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
            break;
        case 'Enter':
            e.preventDefault();
            if (filteredOptions.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                handleSelect(filteredOptions[highlightedIndex]);
            }
            break;
        case 'Escape':
            setIsOpen(false);
            break;
    }
  };

  return (
    <div className={`${label ? 'space-y-1.5' : ''} ${className}`} ref={wrapperRef}>
      {label && (
        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Search..."}
          className="w-full pl-9 pr-8 py-2.5 border border-gray-100 rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all truncate bg-white"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[60] w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="overflow-y-auto custom-scrollbar flex-1">
            {filteredOptions.length > 0 ? (
              <ul className="py-1" ref={listRef}>
                {filteredOptions.map((item, index) => {
                  const isSelected = item.id === selectedId;
                  const isHighlighted = index === highlightedIndex;
                  return (
                    <li
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`px-4 py-2 cursor-pointer border-b border-gray-50 last:border-0 ${isHighlighted ? 'bg-primary-50' : ''} ${isSelected ? 'bg-primary-100' : ''}`}
                    >
                      <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800">{item.label}</span>
                          {item.subLabel && <span className="text-[10px] text-gray-500 font-medium">{item.subLabel}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-3 text-xs text-gray-500 text-center font-bold">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default SearchableSelect;
