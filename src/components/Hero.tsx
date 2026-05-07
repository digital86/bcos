import { useState, useEffect, useRef, useMemo } from 'react';
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import heroImage from '@/assets/hero-training-room.jpg';
import { useFormations } from '@/hooks/useSupabase';
import type { Formation } from '../../supabase-config';

interface SearchSuggestion {
  id: string;
  title: string;
  slug: string;
  score: number;
}

const Hero = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formations, loading: formationsLoading } = useFormations();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect language from URL
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const langPrefix = language === 'ar' ? '/ar' : '/fr';

  // Smart keyword-based search (like Google)
  const searchFormationsByKeywords = useMemo(() => {
    return (query: string, limit: number = 8): SearchSuggestion[] => {
      if (!query || !formations.length) return [];

      const normalize = (str: string): string => {
        return str
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove accents
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
      };

      const getKeywords = (str: string): string[] => {
        return normalize(str).split(/\s+/).filter(w => w.length > 2);
      };

      const searchQueryNormalized = normalize(query);
      const searchKeywords = getKeywords(query);

      const matches = formations.map(formation => {
        const titles = [
          formation.title_fr,
          formation.title_ar,
          formation.title,
          formation.slug,
          formation.description_fr,
          formation.description
        ].filter(Boolean) as string[];

        let bestScore = 0;
        let matchType = 'none';

        for (const title of titles) {
          const normalizedTitle = normalize(title);
          const titleKeywords = getKeywords(title);

          // Exact match
          if (normalizedTitle === searchQueryNormalized) {
            bestScore = Math.max(bestScore, 1.0);
            matchType = 'exact';
            continue;
          }

          // Starts with
          if (normalizedTitle.startsWith(searchQueryNormalized)) {
            bestScore = Math.max(bestScore, 0.9);
            matchType = 'starts';
            continue;
          }

          // Contains
          if (normalizedTitle.includes(searchQueryNormalized)) {
            bestScore = Math.max(bestScore, 0.7);
            matchType = 'contains';
            continue;
          }

          // Keyword matching - count how many keywords match
          const matchingKeywords = searchKeywords.filter(sk => 
            titleKeywords.some(tk => tk === sk || tk.includes(sk) || sk.includes(tk))
          );
          const keywordScore = matchingKeywords.length / Math.max(searchKeywords.length, titleKeywords.length);
          
          if (keywordScore > 0) {
            bestScore = Math.max(bestScore, keywordScore * 0.6);
            matchType = 'keywords';
          }

          // Partial word matching
          const partialMatches = searchKeywords.filter(sk => 
            titleKeywords.some(tk => tk.startsWith(sk) || sk.startsWith(tk))
          );
          if (partialMatches.length > 0) {
            bestScore = Math.max(bestScore, (partialMatches.length / searchKeywords.length) * 0.4);
            matchType = 'partial';
          }
        }

        return {
          id: formation.id,
          title: formation.title_fr || formation.title || '',
          slug: formation.slug || '',
          score: bestScore,
          matchType: matchType as string
        };
      });

      // Filter and sort by score
      return matches
        .filter(m => m.score > 0.1) // Minimum threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    };
  }, [formations]);

  // Update suggestions when search query changes
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const results = searchFormationsByKeywords(searchQuery.trim());
      setSuggestions(results);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, searchFormationsByKeywords]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery.trim();
    if (searchTerm.length >= 2) {
      navigate(`${langPrefix}/formations?search=${encodeURIComponent(searchTerm)}`);
      setShowSuggestions(false);
      setSearchQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        navigate(`${langPrefix}/formation/${suggestions[selectedIndex].slug}`);
      } else {
        handleSearch();
      }
      setShowSuggestions(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Highlight matching text in suggestions (like Google)
  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query || !text) return text;

    const normalize = (str: string): string => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    };

    const normalizedText = normalize(text);
    const normalizedQuery = normalize(query);
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);

    // Find all matching positions in normalized text
    const matches: Array<{ start: number; end: number }> = [];
    
    // Try to find exact query match first
    const exactIndex = normalizedText.indexOf(normalizedQuery);
    if (exactIndex !== -1) {
      matches.push({ start: exactIndex, end: exactIndex + normalizedQuery.length });
    } else {
      // Find individual word matches
      queryWords.forEach(word => {
        let searchIndex = 0;
        while (true) {
          const index = normalizedText.indexOf(word, searchIndex);
          if (index === -1) break;
          
          // Check if this position is not already covered
          const isOverlapping = matches.some(m => 
            (index >= m.start && index < m.end) || 
            (index + word.length > m.start && index + word.length <= m.end)
          );
          
          if (!isOverlapping) {
            matches.push({ start: index, end: index + word.length });
          }
          
          searchIndex = index + 1;
        }
      });
    }

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // Merge overlapping matches
    const mergedMatches: Array<{ start: number; end: number }> = [];
    for (const match of matches) {
      if (mergedMatches.length === 0) {
        mergedMatches.push(match);
      } else {
        const last = mergedMatches[mergedMatches.length - 1];
        if (match.start <= last.end) {
          last.end = Math.max(last.end, match.end);
        } else {
          mergedMatches.push(match);
        }
      }
    }

    // Build highlighted text by mapping normalized positions to original text
    if (mergedMatches.length === 0) {
      return text;
    }

    const parts: React.ReactNode[] = [];
    let lastOriginalIndex = 0;

    // Create mapping from normalized to original positions
    const positionMap: Array<{ normalized: number; original: number }> = [];
    let normalizedPos = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const normalizedChar = normalize(char);
      if (normalizedChar.length > 0) {
        positionMap.push({ normalized: normalizedPos, original: i });
        normalizedPos += normalizedChar.length;
      } else {
        positionMap.push({ normalized: normalizedPos, original: i });
      }
    }

    // Map normalized positions back to original text positions
    mergedMatches.forEach((match, idx) => {
      // Find original start position
      let originalStart = 0;
      for (let i = 0; i < positionMap.length; i++) {
        if (positionMap[i].normalized >= match.start) {
          originalStart = positionMap[i].original;
          break;
        }
      }
      
      // Find original end position
      let originalEnd = text.length;
      for (let i = 0; i < positionMap.length; i++) {
        if (positionMap[i].normalized >= match.end) {
          originalEnd = positionMap[i].original;
          break;
        }
      }
      
      // Add text before match
      if (originalStart > lastOriginalIndex) {
        parts.push(text.substring(lastOriginalIndex, originalStart));
      }
      
      // Add highlighted match
      const originalMatch = text.substring(originalStart, originalEnd);
      parts.push(
        <span key={idx} className="bg-yellow-200 font-semibold text-gray-900">
          {originalMatch}
        </span>
      );
      
      lastOriginalIndex = originalEnd;
    });

    // Add remaining text
    if (lastOriginalIndex < text.length) {
      parts.push(text.substring(lastOriginalIndex));
    }

    return <>{parts}</>;
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    navigate(`${langPrefix}/formation/${suggestion.slug}`);
    setShowSuggestions(false);
    setSearchQuery('');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Salle de formation BCOS"
          className="w-full h-full object-cover"
          loading="eager"
          fetchpriority="high"
        />
        <div className="absolute inset-0 gradient-hero"></div>
        
        {/* Decorative shapes */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-bcos-lime/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-bcos-indigo/20 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 lg:px-8 xl:px-12 2xl:px-16 py-20 pt-32">
        <div className="w-full mx-auto text-center animate-fade-in">
          <h1 
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-heading font-light text-white mb-6 leading-tight max-w-5xl mx-auto text-center animate-fade-in"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            style={{ textAlign: 'center' }}
          >
            {language === 'ar' 
              ? <>بيكوص.. 20 سنة من الخبرة في تكوين<br />ومرافقة الشركات الجزائرية</>
              : <>BCOS.. 20 ans d'expérience dans la formation<br />et l'accompagnement des entreprises algériennes.</>
            }
          </h1>
          
          <p 
            className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-10 max-w-3xl mx-auto font-light leading-relaxed text-center"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            style={{ textAlign: 'center' }}
          >
            {language === 'ar' 
              ? 'تحسين الأداء، تعزيز الكفاءات، حلول متكيفة مع السوق الجزائري'
              : 'Optimisation des performances, renforcement des compétences, solutions adaptées au marché algérien.'
            }
          </p>

          {/* Search Bar with Suggestions */}
          <div className="max-w-4xl mx-auto mb-16" ref={searchRef}>
            <div className="relative">
              <Input
                ref={inputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2 && suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder={language === 'ar' ? 'ابحث عن الدورات والخدمات...' : "Rechercher des formations, services..."}
                className="w-full h-14 pl-6 pr-14 text-base rounded-2xl bg-white/95 backdrop-blur-md border-0 shadow-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
              <button
                onClick={() => handleSearch()}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                aria-label="Search"
              >
                {formationsLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 cursor-pointer" />
                )}
              </button>
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-96 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full text-left px-6 py-4 hover:bg-primary/10 focus:bg-primary/10 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors ${
                        index === selectedIndex ? 'bg-primary/10' : ''
                      }`}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-base">
                            {highlightMatch(suggestion.title, searchQuery)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {language === 'ar' ? 'دورة تدريبية' : 'Formation'}
                          </div>
                        </div>
                        <Search className="w-4 h-4 text-gray-400 ml-2" />
                      </div>
                    </button>
                  ))}
                  {searchQuery.trim().length >= 2 && (
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleSearch()}
                        className="w-full text-left text-sm text-primary font-medium hover:text-primary/80"
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                      >
                        {language === 'ar' 
                          ? `البحث عن "${searchQuery}"` 
                          : `Rechercher "${searchQuery}"`}
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {showSuggestions && searchQuery.trim().length >= 2 && suggestions.length === 0 && !formationsLoading && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 text-center">
                  <p className="text-gray-500">
                    {language === 'ar' 
                      ? `لا توجد نتائج لـ "${searchQuery}"`
                      : `Aucun résultat pour "${searchQuery}"`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 inset-x-0 mx-auto w-fit z-10 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
