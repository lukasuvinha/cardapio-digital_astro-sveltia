import { describe, it, expect } from 'vitest';
import { formatFornadaData, resolveFornadaBanner } from '../src/lib/fornada-banner';

describe('formatFornadaData', () => {
  it('formata data sem hora (so o dia)', () => {
    expect(formatFornadaData('2026-08-01')).toBe('Sábado, 1 de Agosto');
  });

  it('formata data com hora', () => {
    expect(formatFornadaData('2026-08-01', '14:30')).toBe('Sábado, 1 de Agosto às 14h30');
  });

  it('data invalida retorna string vazia (nao lanca)', () => {
    expect(formatFornadaData('data-invalida')).toBe('');
  });
});

describe('resolveFornadaBanner', () => {
  it('sem config (undefined): banner invisivel', () => {
    expect(resolveFornadaBanner(undefined)).toEqual({ visivel: false, texto: '' });
  });

  it('banner_habilitado false: invisivel mesmo com data preenchida', () => {
    const banner = resolveFornadaBanner({
      banner_habilitado: false,
      modo: 'data',
      data: '2026-08-01',
    });
    expect(banner.visivel).toBe(false);
  });

  it('modo "em_breve": mostra o aviso generico', () => {
    const banner = resolveFornadaBanner({ banner_habilitado: true, modo: 'em_breve' });
    expect(banner.visivel).toBe(true);
    expect(banner.texto).toBe('Próxima fornada: Em preparação');
  });

  it('modo "data" com data valida: mostra a data formatada', () => {
    const banner = resolveFornadaBanner({
      banner_habilitado: true,
      modo: 'data',
      data: '2026-08-01',
      hora: '14:30',
    });
    expect(banner.visivel).toBe(true);
    expect(banner.texto).toBe('Próxima fornada: Sábado, 1 de Agosto às 14h30');
  });

  it('modo "data" sem hora: mostra so o dia', () => {
    const banner = resolveFornadaBanner({ banner_habilitado: true, modo: 'data', data: '2026-08-01' });
    expect(banner.texto).toBe('Próxima fornada: Sábado, 1 de Agosto');
  });

  it('modo "data" mas sem data preenchida: cai no aviso generico (nao quebra, nao esconde)', () => {
    const banner = resolveFornadaBanner({ banner_habilitado: true, modo: 'data' });
    expect(banner.visivel).toBe(true);
    expect(banner.texto).toBe('Próxima fornada: Em preparação');
  });

  it('modo "data" com data invalida: cai no aviso generico', () => {
    const banner = resolveFornadaBanner({ banner_habilitado: true, modo: 'data', data: 'lixo' });
    expect(banner.visivel).toBe(true);
    expect(banner.texto).toBe('Próxima fornada: Em preparação');
  });
});
