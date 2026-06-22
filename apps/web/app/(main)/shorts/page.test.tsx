import { mapContentItemToShort } from './shorts.utils';

describe('ShortsPage data mapping', () => {
  it('normalizes object creators and missing optional fields', () => {
    const short = mapContentItemToShort({
      id: 'short-1',
      title: null,
      thumbnailUrl: null,
      creator: {
        id: 'author-1',
        username: 'test4852',
        firstName: 'Test',
        lastName: 'Author',
      } as any,
      likeCount: null,
      commentCount: undefined,
      shareCount: null,
    });

    expect(short).toEqual({
      id: 'short-1',
      title: 'Untitled short',
      thumbnailUrl: '/images/movie-placeholder.jpg',
      creator: {
        id: 'author-1',
        username: 'test4852',
        firstName: 'Test',
        lastName: 'Author',
      },
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
    });
  });

  it('falls back to platform creator when author data is absent', () => {
    expect(
      mapContentItemToShort({
        id: 'short-2',
        title: 'No author',
        creator: null,
      }).creator,
    ).toEqual({
      displayName: 'SESH',
      username: 'movieplatform',
    });
  });
});
