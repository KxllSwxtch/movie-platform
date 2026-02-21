import { create } from 'zustand';

/**
 * Content type for filtering
 */
export type ContentType = 'movies' | 'tv-show' | 'series' | 'clips' | 'tutorials';

/**
 * Content type configuration
 */
export interface ContentTypeConfig {
  id: ContentType;
  label: string;
  labelRu: string;
}

/**
 * Available content types
 */
export const CONTENT_TYPES: ContentTypeConfig[] = [
  { id: 'movies', label: 'Movies', labelRu: 'Фильмы' },
  { id: 'tv-show', label: 'TV Show', labelRu: 'ТВ-шоу' },
  { id: 'series', label: 'Series', labelRu: 'Сериалы' },
  { id: 'clips', label: 'Clips', labelRu: 'Клипы' },
  { id: 'tutorials', label: 'Tutorials', labelRu: 'Обучение' },
];

/**
 * Content store state interface
 */
interface ContentState {
  // Active content type for filtering
  activeContentType: ContentType;

  // Actions
  setContentType: (type: ContentType) => void;

  // Computed
  getActiveConfig: () => ContentTypeConfig;
}

/**
 * Content store for managing content type filtering
 */
export const useContentStore = create<ContentState>((set, get) => ({
  activeContentType: 'movies',

  setContentType: (type) => set({ activeContentType: type }),

  getActiveConfig: () => {
    const { activeContentType } = get();
    return CONTENT_TYPES.find((t) => t.id === activeContentType) || CONTENT_TYPES[0];
  },
}));

/**
 * Selector hooks
 */
export const useActiveContentType = () => useContentStore((state) => state.activeContentType);
export const useSetContentType = () => useContentStore((state) => state.setContentType);
