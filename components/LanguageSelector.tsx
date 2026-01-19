import React from 'react';
import { Language } from '../types';

interface Props {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const LanguageSelector: React.FC<Props> = ({ currentLanguage, onLanguageChange }) => {
  return (
    <div className="absolute top-4 right-4 z-50">
      <select
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value as Language)}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-100 text-sm rounded-full focus:ring-purple-500 focus:border-purple-500 block p-2.5 shadow-md outline-none cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors"
      >
        {Object.values(Language).map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;