"use client";

import * as React from "react";
import { MagnifyingGlass, X, Clock, ArrowRight } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

import { useUIStore, useIsSearchOpen } from "@/stores/ui.store";

const RECENT_SEARCHES_KEY = "mp-recent-searches";
const MAX_RECENT = 8;

/**
 * Full-screen mobile search overlay
 * Opens from bottom nav search button or mobile header search icon
 */
export function MobileSearchOverlay() {
  const isOpen = useIsSearchOpen();
  const { setSearchOpen, searchQuery, setSearchQuery } = useUIStore();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const previousPathnameRef = React.useRef(pathname);
  const [shouldRender, setShouldRender] = React.useState(isOpen);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);

  // Load recent searches from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Auto-focus input when opened
  React.useEffect(() => {
    if (!isOpen) return;
    // Delay to allow animation
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    const timer = window.setTimeout(() => setShouldRender(false), 240);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  React.useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      setShouldRender(false);
      setSearchOpen(false);
    }
  }, [pathname, setSearchOpen]);

  React.useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchQuery("");
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setSearchOpen, setSearchQuery]);

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Save to recent searches
    const updated = [
      searchQuery.trim(),
      ...recentSearches.filter((s) => s !== searchQuery.trim()),
    ].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }

    // Navigate to search results (close overlay)
    setSearchOpen(false);
    window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
  };

  // Handle recent search click
  const handleRecentClick = (query: string) => {
    setSearchQuery(query);
    setSearchOpen(false);
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  };

  // Handle clear recent searches
  const handleClearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`sesh-mobile-search fixed inset-0 z-50 bg-mp-bg-primary md:hidden ${
        isOpen ? "sesh-mobile-search-open" : "sesh-mobile-search-closed"
      }`}
    >
      {/* Header with search input */}
      <div className="sesh-mobile-search-header flex items-center gap-3 p-4 border-b border-mp-border">
        <form onSubmit={handleSubmit} className="flex-1 relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mp-text-disabled" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск сериалов, видео..."
            className="w-full h-10 pl-10 pr-4 bg-mp-surface border border-mp-border rounded-lg text-base text-mp-text-primary placeholder:text-mp-text-disabled focus:outline-none focus:ring-2 focus:ring-mp-accent-primary/50"
            autoComplete="off"
            enterKeyHint="search"
          />
        </form>
        <button
          onClick={() => {
            setSearchQuery("");
            setSearchOpen(false);
          }}
          className="p-2 text-mp-text-secondary hover:text-mp-text-primary rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Закрыть поиск"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Recent searches */}
      {recentSearches.length > 0 && !searchQuery && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-mp-text-secondary">
              Недавние запросы
            </h3>
            <button
              onClick={handleClearRecent}
              className="text-xs text-mp-text-disabled hover:text-mp-text-secondary transition-colors"
            >
              Очистить
            </button>
          </div>
          <div className="space-y-1">
            {recentSearches.map((query, index) => (
              <button
                key={index}
                onClick={() => handleRecentClick(query)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-mp-surface transition-colors min-h-[44px]"
              >
                <Clock className="w-4 h-4 text-mp-text-disabled shrink-0" />
                <span className="text-sm text-mp-text-primary flex-1 truncate">
                  {query}
                </span>
                <ArrowRight className="w-4 h-4 text-mp-text-disabled shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no query and no recent */}
      {recentSearches.length === 0 && !searchQuery && (
        <div className="sesh-mobile-search-empty px-4">
          <div className="sesh-mobile-search-empty-card">
            <div className="sesh-mobile-search-empty-icon" aria-hidden="true">
              <MagnifyingGlass className="h-10 w-10" />
            </div>

            <h2>Что будем смотреть?</h2>

            <p>Введите название сериала, видео или обучающего материала</p>

            <div
              className="sesh-mobile-search-chips"
              aria-label="Быстрые категории"
            >
              {["Сериалы", "Видео", "Обучение", "Популярное"].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSearchQuery(label)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="sr-only">
            <MagnifyingGlass className="w-12 h-12 text-mp-text-disabled mb-4" />
            <p className="text-mp-text-secondary text-sm">
              Начните вводить для поиска сериалов, видео и обучающих материалов
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
