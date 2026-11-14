// Decisao do "arrastar para fechar" das bottom sheets (celular).
import { describe, it, expect } from 'vitest';
import {
  decidirArrasto,
  posicaoDoPainel,
  opacidadeDoFundo,
  velocidadeFinal,
  LIMIAR_DISTANCIA,
  LIMIAR_VELOCIDADE,
} from '../src/lib/sheet-drag';

describe('decidirArrasto', () => {
  const altura = 800;

  it('fecha quando arrastou mais de 25% da altura, mesmo devagar', () => {
    expect(decidirArrasto({ deslocamento: 201, altura, velocidade: 0.05 })).toBe('fechar');
  });

  it('volta quando arrastou ate 25% da altura e soltou devagar', () => {
    expect(decidirArrasto({ deslocamento: 200, altura, velocidade: 0.1 })).toBe('voltar');
    expect(decidirArrasto({ deslocamento: 40, altura, velocidade: 0 })).toBe('voltar');
  });

  it('fecha com um "peteleco": pouca distancia mas velocidade > 0,5 px/ms', () => {
    expect(decidirArrasto({ deslocamento: 30, altura, velocidade: 0.6 })).toBe('fechar');
  });

  it('velocidade exatamente no limite nao fecha (precisa ser maior)', () => {
    expect(decidirArrasto({ deslocamento: 30, altura, velocidade: LIMIAR_VELOCIDADE })).toBe('voltar');
  });

  it('gesto para cima (ou parado) nunca fecha, por mais rapido que seja', () => {
    expect(decidirArrasto({ deslocamento: -50, altura, velocidade: 2 })).toBe('voltar');
    expect(decidirArrasto({ deslocamento: 0, altura, velocidade: 2 })).toBe('voltar');
  });

  it('subiu rapido no fim (velocidade negativa) e ficou abaixo de 25%: volta', () => {
    expect(decidirArrasto({ deslocamento: 150, altura, velocidade: -1 })).toBe('voltar');
  });

  it('altura desconhecida (0) so fecha pela velocidade', () => {
    expect(decidirArrasto({ deslocamento: 500, altura: 0, velocidade: 0.1 })).toBe('voltar');
    expect(decidirArrasto({ deslocamento: 500, altura: 0, velocidade: 0.8 })).toBe('fechar');
  });

  it('o limiar de distancia e 25%', () => {
    expect(LIMIAR_DISTANCIA).toBe(0.25);
  });
});

describe('posicaoDoPainel e opacidadeDoFundo', () => {
  it('o painel segue o dedo para baixo e nao passa da posicao aberta para cima', () => {
    expect(posicaoDoPainel(120)).toBe(120);
    expect(posicaoDoPainel(-80)).toBe(0);
  });

  it('o fundo clareia proporcionalmente ao arrasto', () => {
    expect(opacidadeDoFundo(0, 800)).toBe(1);
    expect(opacidadeDoFundo(400, 800)).toBe(0.5);
    expect(opacidadeDoFundo(-100, 800)).toBe(1);
    expect(opacidadeDoFundo(1200, 800)).toBe(0);
  });
});

describe('velocidadeFinal', () => {
  it('usa so o movimento dos ultimos ~100ms', () => {
    const amostras = [
      { y: 0, t: 0 },
      { y: 10, t: 300 }, // trecho lento e antigo
      { y: 20, t: 400 },
      { y: 80, t: 460 }, // final rapido
    ];
    expect(velocidadeFinal(amostras)).toBeCloseTo((80 - 20) / 60);
  });

  it('com menos de duas amostras, velocidade 0', () => {
    expect(velocidadeFinal([])).toBe(0);
    expect(velocidadeFinal([{ y: 5, t: 1 }])).toBe(0);
  });

  it('pausa longa no fim: usa as duas ultimas amostras (quase parado)', () => {
    expect(velocidadeFinal([{ y: 0, t: 0 }, { y: 300, t: 100 }, { y: 302, t: 600 }])).toBeCloseTo(2 / 500);
  });
});
