import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ShortsFeed } from './shorts-feed';

const mockUseContentInfinite = vi.fn();
const mockUseContentDetail = vi.fn();

vi.mock('@/hooks/use-content', () => ({
  useContentInfinite: (...args: unknown[]) => mockUseContentInfinite(...args),
  useContentDetail: (...args: unknown[]) => mockUseContentDetail(...args),
}));

vi.mock('@/components/content', () => ({
  ShortCard: ({ content }: { content: { id: string; title: string } }) => (
    <div data-testid="short-card" data-short-id={content.id}>
      {content.title}
    </div>
  ),
}));

describe('ShortsFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 768,
    });
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: undefined,
    });

    mockUseContentInfinite.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              {
                id: 'short-1',
                slug: 'one',
                title: 'One',
                contentType: 'SHORT',
              },
            ],
          },
        ],
      },
      isLoading: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    mockUseContentDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
  });

  it('keeps the SESH loading state while viewport height is unavailable', () => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 0,
    });

    const { container } = render(<ShortsFeed />);

    expect(container.querySelector('.sesh-shorts-loading')).not.toBeNull();
    expect(screen.queryByTestId('short-card')).toBeNull();
  });

  it('renders the resolved direct short as the active first card', () => {
    mockUseContentDetail.mockReturnValue({
      data: {
        id: 'short-9',
        slug: 'nine',
        title: 'Nine',
        contentType: 'SHORT',
      },
      isLoading: false,
      isError: false,
    });

    render(<ShortsFeed initialShortSlug="nine" />);

    expect(screen.getAllByTestId('short-card')[0]?.getAttribute('data-short-id')).toBe('short-9');
  });

  it('shows an error state when the direct short cannot be resolved', () => {
    mockUseContentDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<ShortsFeed initialShortSlug="missing-short" />);

    expect(screen.getByText('Short not found')).toBeTruthy();
    expect(screen.queryByTestId('short-card')).toBeNull();
  });
});
