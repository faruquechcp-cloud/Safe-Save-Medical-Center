
import React from 'react';
import SearchIcon from './icons/SearchIcon';
import CloseIcon from './icons/CloseIcon';
import { useTranslations } from '../hooks/useTranslations';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange, placeholder }) => {
  const { t } = useTranslations();
  
  return (
    <div className="relative w-full group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <SearchIcon className="h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
      </div>
      <input
        type="text"
        placeholder={placeholder || t('common.search', 'খুঁজুন...')}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="block w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all shadow-sm"
      />
      {searchTerm && (
        <button 
          onClick={() => onSearchChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500 transition-colors"
          title="Clear Search"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
