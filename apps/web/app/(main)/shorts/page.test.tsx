import { mapContentItemToShort, prioritizeInitialShort } from './shorts.utils';

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
      slug: 'short-1',
      title: 'Untitled short',
      contentType: 'SHORT',
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

  it('moves the shared short to the first feed position and removes duplicates', () => {
    const first = mapContentItemToShort({ id: 'short-1', slug: 'one', title: 'One' });
    const target = mapContentItemToShort({ id: 'short-2', slug: 'two', title: 'Two' });
    const third = mapContentItemToShort({ id: 'short-3', slug: 'three', title: 'Three' });

    expect(prioritizeInitialShort([first, target, third], 'two')).toEqual([
      target,
      first,
      third,
    ]);
  });

  it('prepends the resolved shared short when it is not in the first feed page', () => {
    const first = mapContentItemToShort({ id: 'short-1', slug: 'one', title: 'One' });
    const target = mapContentItemToShort({ id: 'short-9', slug: 'nine', title: 'Nine' });

    expect(prioritizeInitialShort([first], 'nine', target)).toEqual([
      target,
      first,
    ]);
  });
});
