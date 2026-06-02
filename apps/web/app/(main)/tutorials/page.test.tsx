import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TutorialsPage from './page';

const useContentListMock = vi.fn();

vi.mock('@/hooks/use-content', () => ({
  useContentList: (...args: unknown[]) => useContentListMock(...args),
}));

vi.mock('@/components/content', () => ({
  TutorialCard: ({ content }: any) => (
    <a href={`/tutorials/${content.slug}`}>{content.title}</a>
  ),
  VideoCardSkeletonGrid: () => <div>Loading tutorials</div>,
}));

vi.mock('@phosphor-icons/react', () => {
  const Icon = () => <span data-testid="icon" />;
  return {
    Funnel: Icon,
    SlidersHorizontal: Icon,
    GridNine: Icon,
    ListBullets: Icon,
    CaretDown: Icon,
    CaretUp: Icon,
    Check: Icon,
    X: Icon,
  };
});

describe('TutorialsPage', () => {
  beforeEach(() => {
    useContentListMock.mockReset();
  });

  it('renders the empty state when there are no tutorials', () => {
    useContentListMock.mockReturnValue({
      data: { data: { items: [], total: 0, page: 1, limit: 12 } },
      isLoading: false,
    });

    const { container } = render(<TutorialsPage />);

    expect(container.querySelector('a[href^="/tutorials/"]')).toBeNull();
  });

  it('renders tutorials with missing optional fields', () => {
    useContentListMock.mockReturnValue({
      data: {
        data: {
          items: [
            {
              id: 'tutorial-1',
              slug: 'tutorial-1',
              title: 'Tutorial without extras',
              thumbnailUrl: null,
              ageCategory: null,
              category: null,
              duration: null,
              viewCount: null,
              episodeCount: null,
              lessonCount: null,
              completedLessons: null,
            },
          ],
          total: 1,
          page: 1,
          limit: 12,
        },
      },
      isLoading: false,
    });

    render(<TutorialsPage />);

    expect(screen.getByText('Tutorial without extras')).toBeTruthy();
  });
});
