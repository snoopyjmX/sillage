import { describe, expect, it } from 'vitest';
import { buildGatePath, buildLoginPath, getSafeRedirect, withRedirect } from './redirect';

describe('getSafeRedirect', () => {
  it('aceita caminhos internos com query e hash', () => {
    expect(getSafeRedirect('/perfumes/malbec-signature?x=1#topo')).toBe(
      '/perfumes/malbec-signature?x=1#topo'
    );
  });

  it.each([
    null,
    undefined,
    '',
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    'javascript:alert(1)',
    'profile',
  ])('rejeita %s', (value) => expect(getSafeRedirect(value)).toBe('/'));

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

describe('buildGatePath', () => {
  it('manda para a Landing levando o destino codificado', () => {
    expect(buildGatePath('/perfumes/malbec-signature?x=1')).toBe(
      '/?redirect=%2Fperfumes%2Fmalbec-signature%3Fx%3D1'
    );
  });
});

describe('withRedirect', () => {
  it('repassa um destino interno válido', () => {
    expect(withRedirect('/login', '/catalog?q=a')).toBe('/login?redirect=%2Fcatalog%3Fq%3Da');
  });

  it.each([null, '', '//evil.com', 'https://evil.com', 'javascript:alert(1)', '/login'])(
    'descarta %s e devolve o caminho puro',
    (value) => expect(withRedirect('/register', value)).toBe('/register')
  );
});
