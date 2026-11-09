import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles, Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../translations';

export const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isEventsDropdownOpen, setIsEventsDropdownOpen] = useState(false);
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t.nav.home, path: '/' },
    { name: t.nav.mindfulness, path: '/mindfulness' },
    { name: t.nav.meditation, path: '/meditation' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handlePacify = () => {
    window.open('https://www.youtube.com/watch?v=oXNjlH5NGts&list=OLAK5uy_nAr8kOWfb5RKt9_Xb8VtGgAWIpObPshdA&index=1', '_blank');
  };

  const handleSoulRejuvenation = () => {
    window.open('https://www.youtube.com/watch?v=Bh9On4knV2Y&list=PLu2_BuyMbqr0-Ltt4Fg4xHpGOPOBVXShA', '_blank');
  };

  const handleJoinIn = () => {
    window.open('https://www.kirtanlondon.com/', '_blank');
  };

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-spiritual-cream shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-2 group" onClick={handleNavClick}>
            <Sparkles className="w-8 h-8 text-spiritual-gold group-hover:animate-pulse" />
            <span className="text-2xl font-bold text-spiritual-brown">lifemanual</span>
          </Link>

          <div className="hidden md:flex items-center space-x-5 ml-auto mr-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={handleNavClick}
                className={`text-base transition-colors duration-200 ${
                  isActive(link.path)
                    ? 'text-spiritual-gold font-semibold'
                    : 'text-spiritual-brown hover:text-spiritual-gold'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="relative">
              <button
                onClick={() => setIsEventsDropdownOpen(!isEventsDropdownOpen)}
                className="flex items-center space-x-1 text-base text-spiritual-brown hover:text-spiritual-gold transition-colors duration-200"
              >
                <span>{t.nav.serenity}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {isEventsDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-spiritual-cream rounded-lg shadow-lg border border-spiritual-gold/20 py-2 z-50">
                  <button
                    onClick={() => {
                      handlePacify();
                      setIsEventsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-spiritual-gold/10 transition-colors text-spiritual-brown"
                  >
                    {t.nav.pacify}
                  </button>
                  <button
                    onClick={() => {
                      handleSoulRejuvenation();
                      setIsEventsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-spiritual-gold/10 transition-colors text-spiritual-brown"
                  >
                    {t.nav.soulRejuvenation}
                  </button>
                  <button
                    onClick={() => {
                      handleJoinIn();
                      setIsEventsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-spiritual-gold/10 transition-colors text-spiritual-brown"
                  >
                    {t.nav.joinIn}
                  </button>
                </div>
              )}
            </div>

            <Link
              to="/stepin"
              onClick={handleNavClick}
              className={`text-base transition-colors duration-200 ${
                isActive('/stepin')
                  ? 'text-spiritual-gold font-semibold'
                  : 'text-spiritual-brown hover:text-spiritual-gold'
              }`}
            >
              {t.nav.stepIn}
            </Link>

            <div className="relative">
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center space-x-2 text-spiritual-brown hover:text-spiritual-gold transition-colors duration-200"
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">{currentLanguage?.nativeName}</span>
              </button>

              {isLanguageDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-spiritual-cream rounded-lg shadow-lg border border-spiritual-gold/20 py-2 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLanguageDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-spiritual-gold/10 transition-colors ${
                        language === lang.code ? 'text-spiritual-gold font-semibold' : 'text-spiritual-brown'
                      }`}
                    >
                      {lang.nativeName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            className="md:hidden text-spiritual-brown"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-spiritual-cream border-t border-spiritual-gold/20">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => {
                  handleNavClick();
                  setIsMobileMenuOpen(false);
                }}
                className={`block py-2 text-lg ${
                  isActive(link.path)
                    ? 'text-spiritual-gold font-semibold'
                    : 'text-spiritual-brown'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="border-b border-spiritual-gold/20 pb-3 mb-3">
              <div className="flex items-center space-x-2 mb-2 text-spiritual-brown font-semibold">
                <span className="text-lg">{t.nav.serenity}</span>
              </div>
              <div className="space-y-2 pl-4">
                <button
                  onClick={() => {
                    handlePacify();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-base text-spiritual-brown"
                >
                  {t.nav.pacify}
                </button>
                <button
                  onClick={() => {
                    handleSoulRejuvenation();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-base text-spiritual-brown"
                >
                  {t.nav.soulRejuvenation}
                </button>
                <button
                  onClick={() => {
                    handleJoinIn();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-base text-spiritual-brown"
                >
                  {t.nav.joinIn}
                </button>
              </div>
            </div>

            <Link
              to="/stepin"
              onClick={() => {
                handleNavClick();
                setIsMobileMenuOpen(false);
              }}
              className={`block py-2 text-lg ${
                isActive('/stepin')
                  ? 'text-spiritual-gold font-semibold'
                  : 'text-spiritual-brown'
              }`}
            >
              {t.nav.stepIn}
            </Link>

            <div className="border-t border-spiritual-gold/20 pt-3 mt-3">
              <div className="flex items-center space-x-2 mb-2 text-spiritual-brown">
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">Language</span>
              </div>
              <div className="space-y-2 pl-7">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left py-2 text-base ${
                      language === lang.code ? 'text-spiritual-gold font-semibold' : 'text-spiritual-brown'
                    }`}
                  >
                    {lang.nativeName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
