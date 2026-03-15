
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MedicationItem } from '../types';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SearchIcon from './icons/SearchIcon';
import { getTotalQuantityForMedication } from '../utils/formatUtils';

interface MedicationSelectorProps {
  medications: MedicationItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  className?: string;
  showStock?: boolean;
  onlyWithStock?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const MedicationSelector = React.forwardRef<HTMLInputElement, MedicationSelectorProps>(({
  medications,
  selectedId,
  onSelect,
  placeholder,
  className,
  showStock = true,
  onlyWithStock = false,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Use the forwarded ref if provided, otherwise use internal ref
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalInputRef;

  // Initialize search term with selected item's name
  useEffect(() => {
    if (selectedId) {
      const selected = medications.find(m => m.id === selectedId);
      if (selected) {
        setSearchTerm(selected.name);
      }
    } else {
      setSearchTerm('');
    }
  }, [selectedId, medications]);

  const filteredOptions = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    return medications.filter(m => {
      const matchesSearch = 
        m.name.toLowerCase().includes(lowerTerm) || 
        m.genericName.toLowerCase().includes(lowerTerm) ||
        (m.manufacturer && m.manufacturer.toLowerCase().includes(lowerTerm)) ||
        (m.strength && m.strength.toLowerCase().includes(lowerTerm));
        
      if (!matchesSearch) return false;

      if (onlyWithStock) {
         if (m.isActive === false) return false;
         const stock = getTotalQuantityForMedication(m);
         if (stock <= 0) return false;
      }
      return true;
    }).slice(0, 50); // Limit to 50 results for performance
  }, [medications, searchTerm, onlyWithStock]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        
        // Auto-select if only one option exists and nothing is selected
        if (!selectedId && filteredOptions.length === 1) {
            handleSelect(filteredOptions[0]);
        } else if (selectedId) {
             const selected = medications.find(m => m.id === selectedId);
             if (selected && searchTerm !== selected.name) {
                 setSearchTerm(selected.name);
             }
        } else if (!selectedId) {
            setSearchTerm('');
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, selectedId, medications, searchTerm, filteredOptions]);

  // Reset highlighted index when options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const listElement = listRef.current;
      const scrollContainer = listElement.parentElement;
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

  const handleSelect = (item: MedicationItem) => {
    onSelect(item.id);
    setSearchTerm(item.name);
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
    // Open dropdown on arrow keys even if not typing
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
            // CRITICAL: Prevent form submission in parent modal
            e.preventDefault(); 
            e.stopPropagation(); 
            
            if (filteredOptions.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                handleSelect(filteredOptions[highlightedIndex]);
                // Move focus to next input logic is handled by parent form KeyDown listener if needed,
                // but stopping propagation here ensures we don't accidentally submit.
            }
            break;
        case 'Escape':
            setIsOpen(false);
            break;
        case 'Tab':
            if (isOpen && filteredOptions.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                handleSelect(filteredOptions[highlightedIndex]);
            } else {
                setIsOpen(false);
            }
            break;
    }
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
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
          placeholder={placeholder || "Search product..."}
          className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-sm truncate"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
          {filteredOptions.length > 0 ? (
            <ul className="py-1" ref={listRef}>
              {filteredOptions.map((item, index) => {
                const stock = getTotalQuantityForMedication(item);
                const isSelected = item.id === selectedId;
                const isHighlighted = index === highlightedIndex;
                return (
                  <li
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-4 py-2 cursor-pointer border-b border-gray-50 last:border-0 ${isHighlighted ? 'bg-primary-50' : ''} ${isSelected ? 'bg-primary-100' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-xs font-black text-gray-800 uppercase">{item.name} <span className="text-gray-400 text-[10px] font-normal normal-case">({item.strength})</span></div>
                            <div className="text-[9px] text-gray-500 font-bold">{item.genericName}</div>
                        </div>
                        {showStock && (
                            <div className={`text-[9px] font-black px-2 py-0.5 rounded ${stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                Stock: {stock}
                            </div>
                        )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-3 text-xs text-gray-500 text-center">
                {onlyWithStock ? 'No stock available' : 'No products found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default MedicationSelector;
