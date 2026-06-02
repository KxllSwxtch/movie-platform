import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('series structure messages', () => {
  it('keeps season-management toasts as valid UTF-8 Russian text', () => {
    const source = readFileSync(
      join(process.cwd(), 'hooks/use-series-structure.ts'),
      'utf8',
    );

    expect(source).toContain("toast.success('Сезон добавлен')");
    expect(source).toContain("toast.error(error.message || 'Не удалось добавить сезон')");
    expect(source).not.toContain('РЎРµР·РѕРЅ РґРѕР±Р°РІР»РµРЅ');
    expect(source).not.toContain('РќРµ СѓРґР°Р»РѕСЃСЊ РґРѕР±Р°РІРёС‚СЊ СЃРµР·РѕРЅ');
    expect(source).not.toContain('????');
  });
});
