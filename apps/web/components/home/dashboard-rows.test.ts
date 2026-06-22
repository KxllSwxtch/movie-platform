import { describe, expect, it } from 'vitest';

import { mapContinueWatchingItems } from './dashboard-rows';

describe('mapContinueWatchingItems', () => {
  it('maps the nested API response and calculates safe progress', () => {
    const [item] = mapContinueWatchingItems([{
      id: 'history-1',
      progressSeconds: 30,
      content: {
        id: 'content-1',
        title: 'Episode one',
        thumbnailUrl: '/episode.jpg',
        duration: 120,
      },
    }]);

    expect(item).toMatchObject({
      id: 'content-1',
      title: 'Episode one',
      currentTime: 30,
      duration: 120,
      progress: 25,
    });
  });

  it('keeps displayable items with invalid duration but uses zero progress', () => {
    const [item] = mapContinueWatchingItems([{
      id: 'history-2',
      progressSeconds: Number.NaN,
      content: {
        id: 'content-2',
        title: 'Unknown duration',
        duration: Number.NaN,
      },
    }]);

    expect(item.progress).toBe(0);
    expect(item.currentTime).toBe(0);
    expect(item.duration).toBeUndefined();
  });

  it('removes records that cannot render a valid card', () => {
    expect(mapContinueWatchingItems([{ id: 'history-only' }])).toEqual([]);
  });
});
