import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { getTeachingVerse, type ScriptureTeaching } from '../../data/wisdomTopics';
import { VerseDetailModal } from './VerseDetailModal';

interface ScriptureTeachingCardProps {
  teaching: ScriptureTeaching;
}

export const ScriptureTeachingCard: React.FC<ScriptureTeachingCardProps> = ({ teaching }) => {
  const ref = useScrollAnimation();
  const [modalOpen, setModalOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const verse = getTeachingVerse(teaching);

  useEffect(() => {
    if (modalOpen && panelRef.current) {
      const top =
        panelRef.current.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, [modalOpen]);

  if (!verse) return null;

  return (
    <>
      <article
        ref={ref.ref}
        className={`transition-all duration-700 ${ref.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="bg-spiritual-cream/40 rounded-2xl border border-spiritual-gold/15 overflow-hidden">
          {/* Scripture section */}
          <div className="p-6 sm:p-8 border-b border-spiritual-gold/10">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-[0.65em] font-bold tracking-[0.2em] uppercase text-spiritual-gold bg-spiritual-gold/10 px-2.5 py-1 rounded">
                Scripture
              </span>
              <span className="text-sm font-semibold text-spiritual-brown">
                Bhagavad Gita {verse.chapter}.{verse.verse}
              </span>
            </div>

            {verse.sanskrit && (
              <p className="text-lg sm:text-xl text-spiritual-brown leading-relaxed mb-4" lang="sa">
                {verse.sanskrit}
              </p>
            )}

            <p className="text-sm text-spiritual-brown/50 italic mb-3">
              {verse.transliteration}
            </p>

            <p className="text-base sm:text-lg text-spiritual-brown font-medium leading-relaxed">
              {verse.translation}
            </p>
          </div>

          {/* LifeManual reflection section */}
          <div className="p-6 sm:p-8 bg-white">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-[0.65em] font-bold tracking-[0.2em] uppercase text-spiritual-brown/50 bg-spiritual-brown/5 px-2.5 py-1 rounded">
                LifeManual Reflection
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-spiritual-brown mb-1.5">Why this matters</h4>
                <p className="text-sm sm:text-base text-spiritual-brown/70 leading-relaxed">
                  {teaching.whyItMatters}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-spiritual-brown mb-1.5">Apply it today</h4>
                <p className="text-sm sm:text-base text-spiritual-brown/70 leading-relaxed">
                  {teaching.applyItToday}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-spiritual-gold hover:text-spiritual-saffron transition-colors lm-focus-ring"
            >
              <BookOpen className="w-4 h-4" />
              Read Full Verse
              <ArrowRight className="w-4 h-4" />
            </button>

            <div ref={panelRef}>
              <VerseDetailModal
                verse={verse}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
              />
            </div>
          </div>
        </div>
      </article>
    </>
  );
};
