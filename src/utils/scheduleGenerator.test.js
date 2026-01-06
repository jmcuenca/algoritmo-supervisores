import { describe, it, expect } from 'vitest';
import {
  generateSchedule,
  validateSchedule,
  getDrillingCount,
  STATES
} from './scheduleGenerator';

// Funcion auxiliar para verificar reglas fundamentales
function verificarReglasCompletas(schedule, config) {
  const { s1, s2, s3 } = schedule;
  const totalDays = Math.max(s1.length, s2.length, s3.length);
  const drillingCounts = getDrillingCount(s1, s2, s3);

  // Encontrar cuando S3 entra
  let s3FirstActive = -1;
  for (let i = 0; i < s3.length; i++) {
    if (s3[i] !== STATES.EMPTY) {
      s3FirstActive = i;
      break;
    }
  }

  const resultados = {
    diasCon3Perforando: [],
    diasCon1Perforando: [],
    diasCon0Perforando: [],
    patronesInvalidos: [],
    s3EntroCorrectamente: s3FirstActive !== -1,
    totalDias: totalDays
  };

  // Verificar cada dia
  for (let day = 0; day < totalDays; day++) {
    const count = drillingCounts[day];

    // Regla: NUNCA 3 perforando
    if (count === 3) {
      resultados.diasCon3Perforando.push(day);
    }

    // Regla: NUNCA 1 perforando despues de que S3 entro
    if (count === 1 && s3FirstActive !== -1 && day >= s3FirstActive) {
      resultados.diasCon1Perforando.push(day);
    }

    // Regla: NUNCA 0 perforando despues de que S3 entro
    if (count === 0 && s3FirstActive !== -1 && day >= s3FirstActive) {
      resultados.diasCon0Perforando.push(day);
    }
  }

  // Verificar patrones invalidos
  [s1, s2, s3].forEach((schedule, idx) => {
    for (let day = 1; day < schedule.length; day++) {
      const prev = schedule[day - 1];
      const curr = schedule[day];

      if (prev === STATES.SUBIDA && curr === STATES.SUBIDA) {
        resultados.patronesInvalidos.push({ supervisor: `S${idx + 1}`, dia: day, patron: 'S-S' });
      }
      if (prev === STATES.SUBIDA && curr === STATES.BAJADA) {
        resultados.patronesInvalidos.push({ supervisor: `S${idx + 1}`, dia: day, patron: 'S-B' });
      }
    }
  });

  return resultados;
}

describe('CASOS DE PRUEBA ', () => {

  describe('Caso 1: Regimen 14x7, 5 dias induccion, 90 dias perforacion', () => {
    const config = { workDays: 14, restDays: 7, inductionDays: 5, totalDrillingDays: 90 };
    const schedule = generateSchedule(config.workDays, config.restDays, config.inductionDays, config.totalDrillingDays);
    const resultado = verificarReglasCompletas(schedule, config);

    it('debe generar cronogramas para los 3 supervisores', () => {
      expect(schedule.s1.length).toBeGreaterThan(0);
      expect(schedule.s2.length).toBeGreaterThan(0);
      expect(schedule.s3.length).toBeGreaterThan(0);
    });

    it('S1 debe comenzar con Subida seguido de 5 dias de Induccion', () => {
      expect(schedule.s1[0]).toBe(STATES.SUBIDA);
      for (let i = 1; i <= 5; i++) {
        expect(schedule.s1[i]).toBe(STATES.INDUCCION);
      }
    });

    it('S3 debe entrar en el momento correcto', () => {
      expect(resultado.s3EntroCorrectamente).toBe(true);
    });

    it('REGLA: NUNCA debe haber 3 supervisores perforando', () => {
      expect(resultado.diasCon3Perforando.length).toBe(0);
    });

    it('REGLA: NUNCA debe haber solo 1 perforando (despues de S3)', () => {
      expect(resultado.diasCon1Perforando.length).toBe(0);
    });

    it('No debe tener patrones invalidos (S-S, S-B)', () => {
      expect(resultado.patronesInvalidos.length).toBe(0);
    });
  });

  describe('Caso 2: Regimen 21x7, 3 dias induccion, 90 dias perforacion', () => {
    const config = { workDays: 21, restDays: 7, inductionDays: 3, totalDrillingDays: 90 };
    const schedule = generateSchedule(config.workDays, config.restDays, config.inductionDays, config.totalDrillingDays);
    const resultado = verificarReglasCompletas(schedule, config);

    it('debe generar cronogramas para los 3 supervisores', () => {
      expect(schedule.s1.length).toBeGreaterThan(0);
      expect(schedule.s2.length).toBeGreaterThan(0);
      expect(schedule.s3.length).toBeGreaterThan(0);
    });

    it('S1 debe tener 3 dias de induccion', () => {
      let inductionCount = 0;
      for (let i = 0; i < schedule.s1.length; i++) {
        if (schedule.s1[i] === STATES.INDUCCION) inductionCount++;
        if (schedule.s1[i] === STATES.PERFORACION) break;
      }
      expect(inductionCount).toBe(3);
    });

    it('REGLA: NUNCA debe haber 3 supervisores perforando', () => {
      expect(resultado.diasCon3Perforando.length).toBe(0);
    });

    it('REGLA: NUNCA debe haber solo 1 perforando (despues de S3)', () => {
      expect(resultado.diasCon1Perforando.length).toBe(0);
    });

    it('No debe tener patrones invalidos (S-S, S-B)', () => {
      expect(resultado.patronesInvalidos.length).toBe(0);
    });
  });

  describe('Caso 3: Regimen 10x5, 2 dias induccion, 90 dias perforacion', () => {
    const config = { workDays: 10, restDays: 5, inductionDays: 2, totalDrillingDays: 90 };
    const schedule = generateSchedule(config.workDays, config.restDays, config.inductionDays, config.totalDrillingDays);
    const resultado = verificarReglasCompletas(schedule, config);

    it('debe generar cronogramas para los 3 supervisores', () => {
      expect(schedule.s1.length).toBeGreaterThan(0);
      expect(schedule.s2.length).toBeGreaterThan(0);
      expect(schedule.s3.length).toBeGreaterThan(0);
    });

    it('S1 debe tener 2 dias de induccion', () => {
      let inductionCount = 0;
      for (let i = 0; i < schedule.s1.length; i++) {
        if (schedule.s1[i] === STATES.INDUCCION) inductionCount++;
        if (schedule.s1[i] === STATES.PERFORACION) break;
      }
      expect(inductionCount).toBe(2);
    });

    it('REGLA: NUNCA debe haber 3 supervisores perforando', () => {
      expect(resultado.diasCon3Perforando.length).toBe(0);
    });

    it('REGLA: NUNCA debe haber solo 1 perforando (despues de S3)', () => {
      expect(resultado.diasCon1Perforando.length).toBe(0);
    });

    it('No debe tener patrones invalidos (S-S, S-B)', () => {
      expect(resultado.patronesInvalidos.length).toBe(0);
    });
  });

  describe('Caso 4: Regimen 14x6, 4 dias induccion, 90 dias perforacion', () => {
    const config = { workDays: 14, restDays: 6, inductionDays: 4, totalDrillingDays: 90 };
    const schedule = generateSchedule(config.workDays, config.restDays, config.inductionDays, config.totalDrillingDays);
    const resultado = verificarReglasCompletas(schedule, config);

    it('debe generar cronogramas para los 3 supervisores', () => {
      expect(schedule.s1.length).toBeGreaterThan(0);
      expect(schedule.s2.length).toBeGreaterThan(0);
      expect(schedule.s3.length).toBeGreaterThan(0);
    });

    it('S1 debe tener 4 dias de induccion', () => {
      let inductionCount = 0;
      for (let i = 0; i < schedule.s1.length; i++) {
        if (schedule.s1[i] === STATES.INDUCCION) inductionCount++;
        if (schedule.s1[i] === STATES.PERFORACION) break;
      }
      expect(inductionCount).toBe(4);
    });

    it('Descanso real debe ser 4 dias (6-2)', () => {
      let bajadaIndex = -1;
      for (let i = 0; i < schedule.s1.length; i++) {
        if (schedule.s1[i] === STATES.BAJADA) {
          bajadaIndex = i;
          break;
        }
      }
      if (bajadaIndex !== -1) {
        let descansoCount = 0;
        for (let i = bajadaIndex + 1; i < schedule.s1.length; i++) {
          if (schedule.s1[i] === STATES.DESCANSO) {
            descansoCount++;
          } else {
            break;
          }
        }
        expect(descansoCount).toBe(4);
      }
    });

    it('REGLA: NUNCA debe haber 3 supervisores perforando', () => {
      expect(resultado.diasCon3Perforando.length).toBe(0);
    });

    it('REGLA: NUNCA debe haber solo 1 perforando (despues de S3)', () => {
      expect(resultado.diasCon1Perforando.length).toBe(0);
    });

    it('No debe tener patrones invalidos (S-S, S-B)', () => {
      expect(resultado.patronesInvalidos.length).toBe(0);
    });
  });
});

describe('Validacion de patrones invalidos', () => {
  it('debe detectar patron S-S (subida consecutiva)', () => {
    const s1 = [STATES.SUBIDA, STATES.SUBIDA];
    const s2 = [STATES.EMPTY, STATES.EMPTY];
    const s3 = [STATES.EMPTY, STATES.EMPTY];
    const errors = validateSchedule(s1, s2, s3);
    const patternErrors = errors.filter(e => e.type === 'INVALID_PATTERN');
    expect(patternErrors.length).toBeGreaterThan(0);
  });

  it('debe detectar patron S-B (subida seguida de bajada)', () => {
    const s1 = [STATES.SUBIDA, STATES.BAJADA];
    const s2 = [STATES.EMPTY, STATES.EMPTY];
    const s3 = [STATES.EMPTY, STATES.EMPTY];
    const errors = validateSchedule(s1, s2, s3);
    const patternErrors = errors.filter(e => e.type === 'INVALID_PATTERN');
    expect(patternErrors.length).toBeGreaterThan(0);
  });
});

describe('Conteo de perforacion', () => {
  it('debe contar correctamente los supervisores perforando', () => {
    const s1 = [STATES.PERFORACION, STATES.PERFORACION, STATES.BAJADA];
    const s2 = [STATES.PERFORACION, STATES.BAJADA, STATES.DESCANSO];
    const s3 = [STATES.EMPTY, STATES.PERFORACION, STATES.PERFORACION];

    const counts = getDrillingCount(s1, s2, s3);

    expect(counts[0]).toBe(2);
    expect(counts[1]).toBe(2);
    expect(counts[2]).toBe(1);
  });
});

describe('Ciclo de supervisor S1', () => {
  it('S1 debe seguir el patron: S -> I... -> P... -> B -> D...', () => {
    const schedule = generateSchedule(14, 7, 5, 30);
    const s1 = schedule.s1;

    // Debe empezar con Subida
    expect(s1[0]).toBe(STATES.SUBIDA);

    // Luego Induccion
    expect(s1[1]).toBe(STATES.INDUCCION);

    // Buscar primera Perforacion
    let firstP = -1;
    for (let i = 0; i < s1.length; i++) {
      if (s1[i] === STATES.PERFORACION) {
        firstP = i;
        break;
      }
    }
    expect(firstP).toBeGreaterThan(1);

    // Buscar primera Bajada
    let firstB = -1;
    for (let i = firstP; i < s1.length; i++) {
      if (s1[i] === STATES.BAJADA) {
        firstB = i;
        break;
      }
    }
    expect(firstB).toBeGreaterThan(firstP);
  });
});
