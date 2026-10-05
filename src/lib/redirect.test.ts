import { describe, expect, it } from 'vitest';
import { buildLoginPath, getSafeRedirect } from './redirect';

describe('getSafeRedirect', () => {
  it('aceita caminhos internos com query e hash', () => {
    expect(getSafeRedirect('/perfumes/amyi-2-15?x=1#topo')).toBe('/perfumes/amyi-2-15?x=1#topo');
  });

  it.each([null, undefined, '', 'https://evil.test', '//evil.test', '/\\evil.test', 'profile'])(
    'rejeita %s',
    (value) => expect(getSafeRedirect(value)).toBe('/')
  );

  it('não volta para telas de autenticação', () => {
    expect(getSafeRedirect('/login?redirect=/profile')).toBe('/');
    expect(getSafeRedirect('/reset-password')).toBe('/');
    expect(getSafeRedirect('/loginx')).toBe('/loginx');
  });
});

describe('buildLoginPath', () => {
  it('codifica o destino', () => {
    expect(buildLoginPath('/catalog?q=a b')).toBe('/login?redirect=%2Fcatalog%3Fq%3Da%20b');
  });
});
