import { describe, expect, it } from 'vitest';
import { MAX_NAME_LENGTH } from '@/schemas/auth';
import { isValidTimezone, listTimezones, profileSchema } from './profile';

const valid = { displayName: 'Ana', timezone: 'America/Sao_Paulo' };

describe('profileSchema', () => {
  it('aceita nome e fuso válidos e apara espaços', () => {
    expect(
      profileSchema.parse({ displayName: '  Ana  ', timezone: ' America/Sao_Paulo ' })
    ).toEqual(valid);
  });

  it('rejeita nome vazio ou só espaços', () => {
    for (const displayName of ['', '    ']) {
      const result = profileSchema.safeParse({ ...valid, displayName });
      expect(result.success).toBe(false);
    }
  });

  it('rejeita nome longo demais e aceita o limite exato', () => {
    expect(
      profileSchema.safeParse({ ...valid, displayName: 'a'.repeat(MAX_NAME_LENGTH + 1) }).success
    ).toBe(false);
    expect(
      profileSchema.safeParse({ ...valid, displayName: 'a'.repeat(MAX_NAME_LENGTH) }).success
    ).toBe(true);
  });

  it('rejeita fuso inválido, vazio ou com cara de SQL', () => {
    for (const timezone of ['', 'Marte/Olympus', 'Sao_Paulo', "America/Sao_Paulo'; --", '../etc']) {
      expect(profileSchema.safeParse({ ...valid, timezone }).success, timezone).toBe(false);
    }
  });
});

describe('isValidTimezone', () => {
  it('aceita identificadores IANA reais', () => {
    for (const zone of [
      'America/Sao_Paulo',
      'UTC',
      'Pacific/Kiritimati',
      'America/Argentina/Buenos_Aires',
    ]) {
      expect(isValidTimezone(zone), zone).toBe(true);
    }
  });
});

describe('listTimezones', () => {
  it('lista os fusos do navegador e todos passam na validação', () => {
    const zones = listTimezones();
    expect(zones).toContain('America/Sao_Paulo');
    expect(zones.filter((zone) => !isValidTimezone(zone))).toEqual([]);
  });
});
