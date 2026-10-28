import React from 'react';
import { X } from 'lucide-react';
import type { GitaVerse } from '../../data/gitaVerses';

interface VerseDetailModalProps {
  verse: GitaVerse;
  isOpen: boolean;
  onClose: () => void;
}

export const VerseDetailModal: React.FC<VerseDetailModalProps> = ({ verse, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="mt-6 rounded-xl border border-spiritual-gold/20 bg-spiritual-cream shadow-sm overflow-hidden animate-slide-up"
      role="region"
      aria-label={`Bhagavad Gita Chapter ${verse.chapter}, Verse ${verse.verse}`}
    >
      <div className="flex items-center justify-between p-5 sm:p-6 border-b border-spiritual-gold/10">
        <span className="text-sm font-semibold text-spiritual-gold bg-spiritual-gold/10 px-3 py-1 rounded-full">
          Bhagavad Gita {verse.chapter}.{verse.verse}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-spiritual-brown/50 hover:text-spiritual-brown transition-colors lm-focus-ring"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div>
          <h3 className="text-sm font-semibold text-spiritual-brown/60 mb-2">Sanskrit</h3>
          <p className="text-xl sm:text-2xl text-spiritual-brown leading-relaxed" lang="sa">
            {verse.sanskrit}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-spiritual-brown/60 mb-2">Transliteration</h3>
          <p className="text-base sm:text-lg text-spiritual-brown/80 italic">
            {verse.transliteration}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-spiritual-brown/60 mb-2">Translation</h3>
          <p className="text-lg text-spiritual-brown font-medium leading-relaxed">
            {verse.translation}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-spiritual-brown/60 mb-2">Commentary</h3>
          <p className="text-base sm:text-lg text-spiritual-brown/80 leading-relaxed">
            {verse.commentary}
          </p>
        </div>
      </div>
    </div>
  );
};
