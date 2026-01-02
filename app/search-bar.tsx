'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Search, X } from 'lucide-react';

interface Event {
  event_id: number;
  title: string;
  image_url: string | null;
  status: string;
  tags: string[] | null;
  query: string | null;
  summary: string | null;
  last_updated: string | null;
  incident_date: string | null;
  slug?: string;
}

interface SearchBarProps {
  allEvents: Event[];
  activeFilter: string;
  onSearchResults: (results: Event[] | null, isActive: boolean) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function SearchBar({ allEvents, activeFilter, onSearchResults, isExpanded, onToggle }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchIndexRef = useRef<Map<number, string>>(new Map());

  // Build search index on mount (memoized)
  useEffect(() => {
    if (searchIndexRef.current.size === 0) {
      allEvents.forEach(event => {
        const searchText = [
          event.title,
          event.summary || '',
          event.incident_date || '',
          event.last_updated || '',
          ...(event.tags || [])
        ]
          .join(' ')
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        searchIndexRef.current.set(event.event_id, searchText);
      });
    }
  }, [allEvents]);

  // Get filtered events based on active filter
  const filteredEvents = useMemo(() => {
    if (activeFilter === 'All') {
      return allEvents;
    }
    return allEvents.filter(
      event => event.status.toLowerCase() === activeFilter.toLowerCase()
    );
  }, [allEvents, activeFilter]);

  // Perform search across all events
  const performSearch = useCallback((query: string): Event[] => {
    if (!query.trim()) return filteredEvents;
    
    const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (searchTerms.length === 0) return filteredEvents;
    
    const results = filteredEvents.filter(event => {
      const searchText = searchIndexRef.current.get(event.event_id) || '';
      return searchTerms.every(term => searchText.includes(term));
    });
    
    return results;
  }, [filteredEvents]);

  // Handle search with debounce
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (!value.trim()) {
      onSearchResults(null, false);
      return;
    }

    const timeoutId = setTimeout(() => {
      const results = performSearch(value);
      onSearchResults(results, true);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [performSearch, onSearchResults]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    } else {
      setSearchQuery('');
      onSearchResults(null, false);
    }
  }, [isExpanded, onSearchResults]);

  // Clear search when filter changes
  useEffect(() => {
    if (searchQuery) {
      const results = performSearch(searchQuery);
      onSearchResults(results, true);
    }
  }, [activeFilter]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    onSearchResults(null, false);
    onToggle();
  }, [onSearchResults, onToggle]);

  return (
    <div className="relative h-[36px] flex items-center">
      <div 
        className={`relative flex items-center overflow-hidden rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] h-[36px] ${
          isExpanded 
            ? 'w-full bg-white border-2 border-black shadow-lg' 
            : 'w-auto bg-gray-100 hover:bg-gray-200 cursor-pointer shadow-sm hover:shadow-md'
        }`}
        style={{
          transform: isExpanded ? 'scale(1)' : 'scale(1)',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onClick={!isExpanded ? onToggle : undefined}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
        onMouseDown={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.transform = 'scale(0.95)';
          }
        }}
        onMouseUp={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
      >
        {/* Search Icon */}
        <div className={`flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isExpanded ? 'pl-4 pr-2' : 'pl-3 md:pl-4 pr-2'
        }`}>
          <Search className={`w-4 h-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isExpanded ? 'text-gray-500' : 'text-black'
          }`} />
        </div>

        {/* Input Field */}
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search stories..."
          className={`bg-transparent text-black placeholder-gray-400 font-mono text-xs md:text-sm outline-none transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isExpanded 
              ? 'w-full opacity-100 pr-2 translate-x-0' 
              : 'w-0 opacity-0 pointer-events-none -translate-x-2'
          }`}
          style={{
            transitionDelay: isExpanded ? '100ms' : '0ms'
          }}
        />

        {/* Button Text / Close Button */}
        <div className={`flex items-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isExpanded ? 'pr-2 opacity-100 translate-x-0' : 'pr-3 md:pr-4 opacity-100 translate-x-0'
        }`}>
          <div className={`transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isExpanded ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
          }`}>
            <span className="text-xs font-medium tracking-wide text-black font-mono whitespace-nowrap">
              SEARCH
            </span>
          </div>
          
          <div className={`transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isExpanded ? 'opacity-100 w-auto scale-100' : 'opacity-0 w-0 scale-75 overflow-hidden'
          }`}
          style={{
            transitionDelay: isExpanded ? '200ms' : '0ms'
          }}>
            <button
              onClick={handleClear}
              className="w-6 h-6 rounded-full bg-black text-white hover:bg-gray-800 transition-all duration-200 ease-out hover:scale-110 active:scale-90 flex items-center justify-center"
              aria-label="Close search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}