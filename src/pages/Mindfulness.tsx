import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Heart, Search } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useLanguage } from '../contexts/LanguageContext';
import bgImage from '../assets/Screenshot 2025-12-01 at 17.35.33.png';
import { gitaVerses as sampleVerses, type GitaVerse } from '../data/gitaVerses';

export const Mindfulness: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedVerse, setSelectedVerse] = useState<GitaVerse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const heroRef = useScrollAnimation();
  const versesRef = useScrollAnimation();

  const cameFromVerseLink = (location.state as { fromVerseLink?: boolean } | null)?.fromVerseLink === true;

  useEffect(() => {
    const chapterParam = searchParams.get('chapter');
    const verseParam = searchParams.get('verse');
    if (chapterParam && verseParam) {
      const chapter = parseInt(chapterParam, 10);
      const verse = parseInt(verseParam, 10);
      const match = sampleVerses.find(v => v.chapter === chapter && v.verse === verse);
      if (match) setSelectedVerse(match);
    }
  }, [searchParams]);

  const handleClose = useCallback(() => {
    setSelectedVerse(null);
    if (cameFromVerseLink) {
      navigate(-1);
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [cameFromVerseLink, navigate, setSearchParams]);

  useEffect(() => {
    if (!selectedVerse) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedVerse, handleClose]);

  const filteredVerses = sampleVerses.filter(verse =>
    verse.translation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verse.transliteration.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-20">
      <section className="relative py-20 bg-gradient-to-br from-spiritual-cream via-spiritual-lightGold to-spiritual-cream bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="absolute inset-0 bg-spiritual-cream/60 backdrop-blur-sm"></div>
        <div ref={heroRef.ref} className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ${heroRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-spiritual-gold/20 rounded-full mb-6">
            <BookOpen className="w-10 h-10 text-spiritual-gold" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-spiritual-brown mb-6">
            {t.mindfulness.title}
          </h1>
          <p className="text-xl text-spiritual-brown/80 max-w-3xl mx-auto">
            {t.mindfulness.subtitle}
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-spiritual-brown/50" />
              <input
                type="text"
                placeholder={t.mindfulness.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-lg border-2 border-spiritual-gold/30 focus:outline-none focus:border-spiritual-gold bg-spiritual-cream/30 text-spiritual-brown"
              />
            </div>
          </div>

          <div ref={versesRef.ref} className={`transition-all duration-700 ${versesRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVerses.map((verse, index) => (
                <Card key={index} className="cursor-pointer" hover={true}>
                  <div onClick={() => setSelectedVerse(verse)}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-spiritual-gold bg-spiritual-gold/10 px-3 py-1 rounded-full">
                        {t.mindfulness.chapterVerse.replace('{chapter}', String(verse.chapter)).replace('{verse}', String(verse.verse))}
                      </span>
                      <Heart className="w-5 h-5 text-spiritual-brown/30 hover:text-spiritual-gold transition-colors cursor-pointer" />
                    </div>
                    <p className="text-lg text-spiritual-brown font-medium mb-3 line-clamp-2">
                      {verse.translation}
                    </p>
                    <p className="text-sm text-spiritual-brown/60 italic line-clamp-1">
                      {verse.transliteration}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {selectedVerse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleClose}>
          <div className="bg-spiritual-cream rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6">
              <span className="text-sm font-semibold text-spiritual-gold bg-spiritual-gold/10 px-3 py-1 rounded-full">
                {t.mindfulness.chapterVerse.replace('{chapter}', String(selectedVerse.chapter)).replace('{verse}', String(selectedVerse.verse))}
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-spiritual-brown/60 mb-2">{t.mindfulness.labels.sanskrit}</h3>
                <p className="text-2xl text-spiritual-brown leading-relaxed">
                  {selectedVerse.sanskrit}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-spiritual-brown/60 mb-2">{t.mindfulness.labels.transliteration}</h3>
                <p className="text-lg text-spiritual-brown/80 italic">
                  {selectedVerse.transliteration}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-spiritual-brown/60 mb-2">{t.mindfulness.labels.translation}</h3>
                <p className="text-xl text-spiritual-brown font-medium leading-relaxed">
                  {selectedVerse.translation}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-spiritual-brown/60 mb-2">{t.mindfulness.labels.commentary}</h3>
                <p className="text-lg text-spiritual-brown/80 leading-relaxed">
                  {selectedVerse.commentary}
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button variant="primary" onClick={handleClose}>
                {t.mindfulness.close}
              </Button>
            </div>
          </div>
        </div>
      )}

      <section className="py-16 bg-spiritual-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-spiritual-brown mb-4">
            {t.mindfulness.dailyWisdom.title}
          </h2>
          <p className="text-lg text-spiritual-brown/80 mb-8">
            {t.mindfulness.dailyWisdom.description}
          </p>
          <a
            href="https://vedabase.io/en/library/bg/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-spiritual-gold text-white rounded-lg font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-spiritual-gold/90"
          >
            Get Your Own Copy
          </a>
        </div>
      </section>
    </div>
  );
};
