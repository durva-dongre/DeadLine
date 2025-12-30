'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  slug: string;
}

interface EventsClientProps {
  initialEvents: Event[];
}

interface SearchIndexEntry {
  event_id: number;
  slug: string;
  searchText: string;
  batchIndex: number;
}

interface SearchCache {
  index: SearchIndexEntry[];
  isBuilt: boolean;
  buildProgress: number;
}

function EventCardSkeleton() {
  return (
    <article className="animate-pulse">
      <div className="relative h-64 mb-6 bg-gray-200"></div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-3 bg-gray-200 w-24"></div>
          <div className="h-6 bg-gray-200 w-20"></div>
        </div>
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 w-full"></div>
          <div className="h-5 bg-gray-200 w-4/5"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 w-full"></div>
          <div className="h-3 bg-gray-200 w-full"></div>
          <div className="h-3 bg-gray-200 w-3/4"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 w-16"></div>
          <div className="h-6 bg-gray-200 w-20"></div>
        </div>
      </div>
    </article>
  );
}

export function EventsClient({ initialEvents }: EventsClientProps) {
  const [allEvents, setAllEvents] = useState<Event[]>(initialEvents);
  const [displayedEvents, setDisplayedEvents] = useState<Event[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [clickedSlug, setClickedSlug] = useState<string | null>(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isBuildingIndex, setIsBuildingIndex] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const eventCache = useRef<Map<string, Event[]>>(new Map());
  const searchCache = useRef<SearchCache>({ index: [], isBuilt: false, buildProgress: 0 });
  const eventMapRef = useRef<Map<string, Event>>(new Map());
  const router = useRouter();
  
  const ITEMS_PER_PAGE = 30;
  const categories = ['All', 'Justice', 'Injustice'];

  const buildSearchEntry = useCallback((event: Event, batchIndex: number): SearchIndexEntry => {
    const searchText = [
      event.title,
      event.summary || '',
      ...(event.tags || [])
    ]
      .join(' ')
      .toLowerCase()
      .trim();
    
    return {
      event_id: event.event_id,
      slug: event.slug,
      searchText,
      batchIndex
    };
  }, []);

  const buildSearchIndex = useCallback(async () => {
    if (searchCache.current.isBuilt || isBuildingIndex) return;
    
    setIsBuildingIndex(true);
    const index: SearchIndexEntry[] = [];
    const eventMap = new Map<string, Event>();
    
    try {
      allEvents.forEach((event, idx) => {
        index.push(buildSearchEntry(event, Math.floor(idx / ITEMS_PER_PAGE)));
        eventMap.set(event.slug, event);
      });
      
      let offset = allEvents.length;
      let batchNumber = Math.ceil(allEvents.length / ITEMS_PER_PAGE);
      let hasMoreBatches = true;
      
      while (hasMoreBatches) {
        try {
          const response = await fetch(
            `/api/get/events?limit=${ITEMS_PER_PAGE}&offset=${offset}`,
            {
              headers: { 'Content-Type': 'application/json' },
              cache: 'force-cache'
            }
          );
          
          if (!response.ok) break;
          
          const data = await response.json();
          const events = data.events || [];
          
          if (events.length === 0) {
            hasMoreBatches = false;
            break;
          }
          
          events.forEach((event: Event) => {
            index.push(buildSearchEntry(event, batchNumber));
            eventMap.set(event.slug, event);
          });
          
          searchCache.current.buildProgress = (offset + events.length) / (data.pagination?.total || offset + events.length);
          
          offset += events.length;
          batchNumber++;
          
          eventCache.current.set(`batch_${offset - events.length}`, events);
          
          if (events.length < ITEMS_PER_PAGE) {
            hasMoreBatches = false;
          }
          
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error('Error building search index:', error);
          hasMoreBatches = false;
        }
      }
      
      searchCache.current.index = index;
      searchCache.current.isBuilt = true;
      eventMapRef.current = eventMap;
      
    } finally {
      setIsBuildingIndex(false);
    }
  }, [allEvents, buildSearchEntry, isBuildingIndex]);

  const searchInIndex = useCallback((query: string): Event[] => {
    if (!query.trim() || !searchCache.current.isBuilt) {
      return [];
    }
    
    const searchTerms = query.toLowerCase().trim().split(/\s+/);
    const matchedSlugs = new Set<string>();
    
    searchCache.current.index.forEach(entry => {
      const matches = searchTerms.every(term => entry.searchText.includes(term));
      if (matches) {
        matchedSlugs.add(entry.slug);
      }
    });
    
    const results: Event[] = [];
    matchedSlugs.forEach(slug => {
      const event = eventMapRef.current.get(slug);
      if (event) results.push(event);
    });
    
    return results.sort((a, b) => {
      const dateA = a.last_updated ? new Date(a.last_updated).getTime() : 0;
      const dateB = b.last_updated ? new Date(b.last_updated).getTime() : 0;
      return dateB - dateA;
    });
  }, []);

  const filteredEvents = useMemo(() => {
    let filtered = allEvents;
    
    if (activeFilter !== 'All') {
      filtered = filtered.filter(event => {
        const statusLower = event.status.toLowerCase();
        const filterLower = activeFilter.toLowerCase();
        return statusLower === filterLower;
      });
    }
    
    if (searchQuery.trim()) {
      if (searchCache.current.isBuilt) {
        const searchResults = searchInIndex(searchQuery);
        
        if (activeFilter !== 'All') {
          return searchResults.filter(event => {
            const statusLower = event.status.toLowerCase();
            const filterLower = activeFilter.toLowerCase();
            return statusLower === filterLower;
          });
        }
        
        return searchResults;
      } else {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(event => {
          return (
            event.title.toLowerCase().includes(query) ||
            event.summary?.toLowerCase().includes(query) ||
            event.tags?.some(tag => tag.toLowerCase().includes(query))
          );
        });
      }
    }
    
    return filtered.sort((a, b) => {
      const dateA = a.last_updated ? new Date(a.last_updated).getTime() : 0;
      const dateB = b.last_updated ? new Date(b.last_updated).getTime() : 0;
      return dateB - dateA;
    });
  }, [allEvents, activeFilter, searchQuery, searchInIndex]);

  const fetchNextBatch = useCallback(async (offset: number) => {
    const cacheKey = `batch_${offset}`;
    
    if (eventCache.current.has(cacheKey)) {
      return eventCache.current.get(cacheKey)!;
    }
    
    try {
      const response = await fetch(
        `/api/get/events?limit=${ITEMS_PER_PAGE}&offset=${offset}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'force-cache'
        }
      );
      
      if (!response.ok) {
        console.error('Failed to fetch batch:', response.statusText);
        return [];
      }
      
      const data = await response.json();
      const events = data.events || [];
      
      eventCache.current.set(cacheKey, events);
      
      return events;
    } catch (error) {
      console.error('Error fetching batch:', error);
      return [];
    }
  }, []);

  const loadMoreEvents = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    
    try {
      const offset = allEvents.length;
      const newBatch = await fetchNextBatch(offset);
      
      if (newBatch.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }
      
      const updatedEvents = [...allEvents, ...newBatch];
      setAllEvents(updatedEvents);
      
      if (searchCache.current.isBuilt || isBuildingIndex) {
        newBatch.forEach((event: Event) => {
          eventMapRef.current.set(event.slug, event);
        });
      }
      
      setHasMore(newBatch.length === ITEMS_PER_PAGE);
      
    } catch (error) {
      console.error('Error loading more:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [allEvents, loadingMore, hasMore, fetchNextBatch, isBuildingIndex]);

  useEffect(() => {
    setIsInitializing(true);
    
    const timer = setTimeout(() => {
      const initialBatch = filteredEvents.slice(0, ITEMS_PER_PAGE);
      setDisplayedEvents(initialBatch);
      setPage(1);
      setIsInitializing(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [filteredEvents]);

  useEffect(() => {
    if (!isInitializing) {
      const endIndex = page * ITEMS_PER_PAGE;
      const newEvents = filteredEvents.slice(0, endIndex);
      setDisplayedEvents(newEvents);
    }
  }, [page, filteredEvents, isInitializing]);

  const toggleSearch = useCallback(() => {
    setSearchExpanded(prev => {
      const newState = !prev;
      if (newState) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
        if (!searchCache.current.isBuilt && !isBuildingIndex) {
          buildSearchIndex();
        }
      } else {
        setSearchQuery('');
      }
      return newState;
    });
  }, [buildSearchIndex, isBuildingIndex]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
    setIsSearching(true);
    
    const timer = setTimeout(() => {
      setIsSearching(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'NO DATE';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).toUpperCase();
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'justice') return 'JUSTICE';
    if (statusLower === 'injustice') return 'INJUSTICE';
    return status.toUpperCase();
  }, []);

  const getStatusColor = useCallback(() => {
    return 'bg-black text-white';
  }, []);

  const handleEventClick = useCallback((slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setClickedSlug(slug);
    setTimeout(() => {
      router.push(`/event/${slug}`);
    }, 150);
  }, [router]);

  const needsMoreFromAPI = displayedEvents.length >= allEvents.length && hasMore;

  return (
    <>
      <section className="border-y border-black bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-wrap gap-3 justify-center items-center relative">
            <div className={`flex flex-wrap gap-3 justify-center items-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              searchExpanded 
                ? 'opacity-0 scale-90 blur-sm pointer-events-none absolute inset-0' 
                : 'opacity-100 scale-100 blur-0 relative'
            }`}>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveFilter(category)}
                  className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-300 font-mono ${
                    activeFilter === category
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-black hover:bg-gray-200'
                  }`}
                >
                  {category.toUpperCase()}
                </button>
              ))}
            </div>
            
            <div className={`transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              searchExpanded 
                ? 'w-full max-w-xl opacity-100 scale-100' 
                : 'w-auto opacity-100 scale-100'
            }`}>
              {searchExpanded ? (
                <div className="px-4 py-2 rounded-full border-2 border-black bg-white w-full relative overflow-hidden">
                  <div className="flex items-center justify-between w-full gap-2">
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 hover:scale-110" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder={isBuildingIndex ? "Building search index..." : "Search stories..."}
                      disabled={isBuildingIndex}
                      className="flex-1 bg-transparent outline-none text-black placeholder-gray-400 font-mono text-xs disabled:opacity-50 transition-all duration-300"
                    />
                    <button
                      onClick={toggleSearch}
                      className="text-black hover:text-gray-600 flex-shrink-0 transition-all duration-300 hover:rotate-90"
                      aria-label="Close search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {isBuildingIndex && (
                    <div 
                      className="absolute bottom-0 left-0 h-0.5 bg-black transition-all duration-500 ease-out rounded-full" 
                      style={{ width: `${searchCache.current.buildProgress * 100}%` }} 
                    />
                  )}
                </div>
              ) : (
                <button
                  onClick={toggleSearch}
                  className="px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-300 font-mono bg-gray-100 text-black hover:bg-gray-200 hover:scale-105 active:scale-95"
                >
                  SEARCH
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {isInitializing || isSearching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(9)].map((_, index) => (
              <EventCardSkeleton key={`init-skeleton-${index}`} />
            ))}
          </div>
        ) : displayedEvents.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-black font-normal tracking-wide text-lg font-mono">
              {searchQuery ? 'NO STORIES MATCH YOUR SEARCH' : 'NO STORIES MATCH YOUR FILTER'}
            </div>
            <button 
              onClick={() => {
                setActiveFilter('All');
                setSearchQuery('');
              }}
              className="mt-4 text-black font-medium hover:text-gray-600 transition-colors font-mono"
            >
              VIEW ALL STORIES
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedEvents.map((event, index) => (
                <article 
                  key={event.slug} 
                  onClick={(e) => handleEventClick(event.slug, e)}
                  className={`group cursor-pointer transition-opacity duration-150 ${
                    clickedSlug === event.slug ? 'opacity-60' : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setClickedSlug(event.slug);
                      setTimeout(() => {
                        router.push(`/event/${event.slug}`);
                      }, 150);
                    }
                  }}
                >
                  <div className="relative h-64 mb-6 overflow-hidden bg-gray-100">
                    <img
                      src={event.image_url || '/api/placeholder/400/300'}
                      alt={event.title}
                      loading={index < 9 ? 'eager' : 'lazy'}
                      decoding="async"
                      fetchPriority={index < 3 ? 'high' : 'auto'}
                      className="w-full h-full object-cover grayscale md:group-hover:grayscale-0 group-active:grayscale-0 transition-all duration-500 pointer-events-none"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/api/placeholder/400/300';
                      }}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-normal tracking-widest text-black font-mono">
                      <time>{formatDate(event.incident_date)}</time>
                      <span className={`px-2 py-1 tracking-wide ${getStatusColor()}`}>
                        {getStatusLabel(event.status)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-black leading-tight transition-colors text-justify" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {event.title}
                    </h3>
                    <p className="text-black font-normal leading-relaxed text-sm line-clamp-3 text-justify font-mono">
                      {event.summary || 'Breaking story developing...'}
                    </p>
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {event.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs font-normal text-black border border-black px-2 py-1 tracking-wide font-mono"
                          >
                            {tag.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {loadingMore && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                {[...Array(6)].map((_, index) => (
                  <EventCardSkeleton key={`loading-${index}`} />
                ))}
              </div>
            )}

            {(needsMoreFromAPI || displayedEvents.length < filteredEvents.length) && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => {
                    if (needsMoreFromAPI) {
                      loadMoreEvents();
                    } else {
                      setPage(prev => prev + 1);
                    }
                  }}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-black text-white font-mono text-sm tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? 'LOADING...' : 'LOAD MORE'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}