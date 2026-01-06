// Estados posibles
export const STATES = {
  EMPTY: '-',
  SUBIDA: 'S',
  INDUCCION: 'I',
  PERFORACION: 'P',
  BAJADA: 'B',
  DESCANSO: 'D'
};

// Genera S1 (regimen fijo)
function generateS1(workDays, restDays, inductionDays, totalDrillingDays) {
  const schedule = [];
  let drillingCount = 0;
  let day = 0;
  let firstCycle = true;

  while (drillingCount < totalDrillingDays) {
    schedule[day++] = STATES.SUBIDA;

    if (firstCycle) {
      for (let i = 0; i < inductionDays; i++) schedule[day++] = STATES.INDUCCION;
    }

    const drillDays = firstCycle ? workDays - inductionDays - 1 : workDays - 1;
    for (let i = 0; i < drillDays && drillingCount < totalDrillingDays; i++) {
      schedule[day++] = STATES.PERFORACION;
      drillingCount++;
    }

    if (drillingCount >= totalDrillingDays) break;

    schedule[day++] = STATES.BAJADA;
    for (let i = 0; i < restDays - 2; i++) schedule[day++] = STATES.DESCANSO;

    firstCycle = false;
  }
  return schedule;
}

export function generateSchedule(workDays, restDays, inductionDays, totalDrillingDays) {
  const s1 = generateS1(workDays, restDays, inductionDays, totalDrillingDays);
  const totalDays = s1.length + 30;

  while (s1.length < totalDays) s1.push(STATES.EMPTY);

  const s2 = new Array(totalDays).fill(STATES.EMPTY);
  const s3 = new Array(totalDays).fill(STATES.EMPTY);

  // Encontrar primera bajada de S1
  let s1FirstBajada = s1.findIndex(s => s === STATES.BAJADA);
  if (s1FirstBajada === -1) s1FirstBajada = s1.length;

  // S3 entra para cubrir cuando S1 baja
  const s3Entry = s1FirstBajada - inductionDays - 1;
  const s3FirstDrill = s3Entry + inductionDays + 1;

  // === FASE 1: Antes de S3 (S1 y S2 perforan) ===
  // S2 inicia dia 0, igual que S1
  let d = 0;
  s2[d++] = STATES.SUBIDA;
  for (let i = 0; i < inductionDays; i++) s2[d++] = STATES.INDUCCION;
  // S2 perfora hasta el dia antes de que S3 entre (para que haya 2 perforando siempre)
  while (d < s3Entry) s2[d++] = STATES.PERFORACION;

  // === FASE 2: S3 entra con induccion ===
  d = s3Entry;
  if (d >= 0) {
    s3[d++] = STATES.SUBIDA;
    for (let i = 0; i < inductionDays && d < totalDays; i++) s3[d++] = STATES.INDUCCION;
  }

  // Durante la induccion de S3, necesitamos S1 + S2 perforando
  // S2 continua perforando durante induccion de S3
  for (let day = s3Entry; day < s3FirstDrill && day < totalDays; day++) {
    if (s2[day] === STATES.EMPTY) {
      s2[day] = STATES.PERFORACION;
    }
  }

  // === FASE 3: Generacion dia por dia desde s3FirstDrill ===
  // Regla: siempre exactamente 2 perforando
  // Si S1 perfora: exactamente 1 de S2/S3 perfora
  // Si S1 no perfora: ambos S2 y S3 perforan

  // Trackers para S2 y S3
  let s2State = {
    drilling: true,
    drilledDays: s3FirstDrill - 1 - inductionDays, // dias ya perforados
    restDays: 0
  };
  let s3State = {
    drilling: false, // aun no empieza a perforar
    drilledDays: 0,
    restDays: 0
  };

  const maxDrill = workDays - 1;
  const minDrill = 2;
  const normalRest = restDays - 2;
  const minRest = 1;

  for (let day = s3FirstDrill; day < totalDays; day++) {
    const s1Drilling = s1[day] === STATES.PERFORACION;
    const needBothS2S3 = !s1Drilling; // Si S1 no perfora, necesitamos S2 y S3
    const needOneOfS2S3 = s1Drilling; // Si S1 perfora, solo uno de S2/S3

    // Determinar estado anterior de S2
    const prevS2 = s2[day - 1];
    const s2WasDrilling = prevS2 === STATES.PERFORACION;
    const s2WasResting = prevS2 === STATES.BAJADA || prevS2 === STATES.DESCANSO;
    const s2WasSubida = prevS2 === STATES.SUBIDA;

    // Determinar estado anterior de S3
    const prevS3 = s3[day - 1];
    const s3WasDrilling = prevS3 === STATES.PERFORACION;
    const s3WasResting = prevS3 === STATES.BAJADA || prevS3 === STATES.DESCANSO;
    const s3WasSubida = prevS3 === STATES.SUBIDA;
    const s3WasInduction = prevS3 === STATES.INDUCCION;

    // Actualizar trackers
    if (s2WasDrilling) {
      s2State.drilling = true;
      s2State.drilledDays++;
      s2State.restDays = 0;
    } else if (s2WasResting) {
      s2State.drilling = false;
      s2State.restDays++;
    } else if (s2WasSubida) {
      s2State.drilling = false;
      s2State.drilledDays = 0;
    }

    if (s3WasDrilling) {
      s3State.drilling = true;
      s3State.drilledDays++;
      s3State.restDays = 0;
    } else if (s3WasResting) {
      s3State.drilling = false;
      s3State.restDays++;
    } else if (s3WasSubida || s3WasInduction) {
      s3State.drilling = false;
      s3State.drilledDays = 0;
    }

    // Determinar acciones para hoy
    let s2Action = null;
    let s3Action = null;

    // S3 despues de induccion debe perforar
    if (s3WasInduction) {
      s3Action = STATES.PERFORACION;
      s3State.drilling = true;
      s3State.drilledDays = 1;
    }

    // S2 despues de subida debe perforar
    if (s2WasSubida) {
      s2Action = STATES.PERFORACION;
      s2State.drilling = true;
      s2State.drilledDays = 1;
    }

    // S3 despues de subida debe perforar
    if (s3WasSubida) {
      s3Action = STATES.PERFORACION;
      s3State.drilling = true;
      s3State.drilledDays = 1;
    }

    // Logica principal basada en necesidades
    if (needBothS2S3) {
      // S1 no perfora, necesitamos ambos S2 y S3
      if (s2Action === null) {
        if (s2WasDrilling) {
          // S2 sigue perforando (no importa si excede maximo, es necesario)
          s2Action = STATES.PERFORACION;
        } else if (s2WasResting) {
          if (s2State.restDays >= minRest) {
            // S2 puede subir
            s2Action = STATES.SUBIDA;
          } else {
            // S2 debe seguir descansando pero necesitamos que perfore...
            // Forzar subida con descanso minimo
            s2Action = STATES.SUBIDA;
          }
        }
      }
      if (s3Action === null) {
        if (s3WasDrilling) {
          s3Action = STATES.PERFORACION;
        } else if (s3WasResting) {
          if (s3State.restDays >= minRest) {
            s3Action = STATES.SUBIDA;
          } else {
            s3Action = STATES.SUBIDA;
          }
        }
      }
    } else if (needOneOfS2S3) {
      // S1 perfora, solo necesitamos uno de S2/S3
      // Preferir que el que ha descansado mas perfore, el otro descansa

      const s2CanRest = s2State.drilledDays >= minDrill;
      const s3CanRest = s3State.drilledDays >= minDrill;
      const s2MustRest = s2State.drilledDays >= maxDrill;
      const s3MustRest = s3State.drilledDays >= maxDrill;
      const s2NeedsToWork = s2WasSubida || (s2WasResting && s2State.restDays >= normalRest);

      if (s2Action === null && s3Action === null) {
        if (s2WasDrilling && s3WasDrilling) {
          // Ambos perforando, uno debe bajar
          if (s2MustRest || (s2CanRest && !s3CanRest)) {
            s2Action = STATES.BAJADA;
            s3Action = STATES.PERFORACION;
          } else if (s3MustRest || (s3CanRest && !s2CanRest)) {
            s3Action = STATES.BAJADA;
            s2Action = STATES.PERFORACION;
          } else if (s2State.drilledDays >= s3State.drilledDays) {
            s2Action = STATES.BAJADA;
            s3Action = STATES.PERFORACION;
          } else {
            s3Action = STATES.BAJADA;
            s2Action = STATES.PERFORACION;
          }
        } else if (s2WasDrilling && !s3WasDrilling) {
          // Solo S2 perforando
          if (s2MustRest) {
            s2Action = STATES.BAJADA;
            // S3 debe subir para cubrir
            s3Action = s3WasResting ? STATES.SUBIDA : STATES.DESCANSO;
          } else {
            s2Action = STATES.PERFORACION;
            s3Action = s3WasResting ? STATES.DESCANSO : s3[day - 1];
            if (s3State.restDays >= normalRest && s3WasResting) {
              s3Action = STATES.SUBIDA;
            }
          }
        } else if (!s2WasDrilling && s3WasDrilling) {
          // Solo S3 perforando
          if (s3MustRest) {
            s3Action = STATES.BAJADA;
            s2Action = s2WasResting ? STATES.SUBIDA : STATES.DESCANSO;
          } else {
            s3Action = STATES.PERFORACION;
            s2Action = s2WasResting ? STATES.DESCANSO : s2[day - 1];
            if (s2State.restDays >= normalRest && s2WasResting) {
              s2Action = STATES.SUBIDA;
            }
          }
        } else {
          // Ninguno perforando, uno debe subir
          if (s2NeedsToWork || s2State.restDays > s3State.restDays) {
            s2Action = s2WasResting ? STATES.SUBIDA : STATES.PERFORACION;
            s3Action = s3WasResting ? STATES.DESCANSO : STATES.BAJADA;
          } else {
            s3Action = s3WasResting ? STATES.SUBIDA : STATES.PERFORACION;
            s2Action = s2WasResting ? STATES.DESCANSO : STATES.BAJADA;
          }
        }
      }
    }

    // Aplicar acciones
    if (s2Action !== null && s2[day] === STATES.EMPTY) s2[day] = s2Action;
    if (s3Action !== null && s3[day] === STATES.EMPTY) s3[day] = s3Action;

    // Llenar vacios con logica de continuacion
    if (s2[day] === STATES.EMPTY) {
      if (s2WasDrilling) s2[day] = STATES.PERFORACION;
      else if (s2WasResting) s2[day] = STATES.DESCANSO;
      else if (s2WasSubida) s2[day] = STATES.PERFORACION;
    }
    if (s3[day] === STATES.EMPTY) {
      if (s3WasDrilling) s3[day] = STATES.PERFORACION;
      else if (s3WasResting) s3[day] = STATES.DESCANSO;
      else if (s3WasSubida || s3WasInduction) s3[day] = STATES.PERFORACION;
    }
  }

  // === PASADA DE CORRECCION ===
  for (let pass = 0; pass < 200; pass++) {
    let fixed = 0;

    for (let day = s3Entry; day < totalDays; day++) {
      const s1D = s1[day] === STATES.PERFORACION ? 1 : 0;
      const s2D = s2[day] === STATES.PERFORACION ? 1 : 0;
      const s3D = s3[day] === STATES.PERFORACION ? 1 : 0;
      const total = s1D + s2D + s3D;

      if (total === 3) {
        // Demasiados - hacer que uno baje
        if (s2[day] === STATES.PERFORACION && s2[day - 1] === STATES.PERFORACION) {
          s2[day] = STATES.BAJADA;
          fixed++;
        } else if (s3[day] === STATES.PERFORACION && s3[day - 1] === STATES.PERFORACION) {
          s3[day] = STATES.BAJADA;
          fixed++;
        }
      } else if (total < 2) {
        // Muy pocos - hacer que alguien perfore
        let didFix = false;

        // Opcion 1: Extender perforacion si ayer estaba perforando
        if (!didFix && s2[day] === STATES.BAJADA && s2[day - 1] === STATES.PERFORACION) {
          s2[day] = STATES.PERFORACION;
          fixed++;
          didFix = true;
        }
        if (!didFix && s3[day] === STATES.BAJADA && s3[day - 1] === STATES.PERFORACION) {
          s3[day] = STATES.PERFORACION;
          fixed++;
          didFix = true;
        }

        // Opcion 2: Si esta en subida con descanso antes, convertir a perforacion
        if (!didFix && s2[day] === STATES.SUBIDA && day > 0 &&
            (s2[day - 1] === STATES.DESCANSO || s2[day - 1] === STATES.BAJADA)) {
          s2[day] = STATES.PERFORACION;
          fixed++;
          didFix = true;
        }
        if (!didFix && s3[day] === STATES.SUBIDA && day > 0 &&
            (s3[day - 1] === STATES.DESCANSO || s3[day - 1] === STATES.BAJADA)) {
          s3[day] = STATES.PERFORACION;
          fixed++;
          didFix = true;
        }

        // Opcion 3: Si alguien esta en subida, mover la subida un dia antes
        if (!didFix && s2[day] === STATES.SUBIDA && day > 0 && s2[day - 1] === STATES.DESCANSO) {
          s2[day - 1] = STATES.SUBIDA;
          s2[day] = STATES.PERFORACION;
          fixed++;
          didFix = true;
        }
        if (!didFix && s3[day] === STATES.SUBIDA && day > 0 && s3[day - 1] === STATES.DESCANSO) {
          s3[day - 1] = STATES.SUBIDA;
          s3[day] = STATES.PERFORACION;
          fixed++;
          didFix = true;
        }

        // Opcion 4: Si esta en descanso, acortar y subir
        if (!didFix && s2[day] === STATES.DESCANSO && day > 0) {
          s2[day] = STATES.SUBIDA;
          if (day + 1 < totalDays) s2[day + 1] = STATES.PERFORACION;
          fixed++;
          didFix = true;
        }
        if (!didFix && s3[day] === STATES.DESCANSO && day > 0) {
          s3[day] = STATES.SUBIDA;
          if (day + 1 < totalDays) s3[day + 1] = STATES.PERFORACION;
          fixed++;
          didFix = true;
        }

        // Opcion 5: Forzar perforacion en cualquier estado que no sea S o I
        if (!didFix && s2[day] !== STATES.PERFORACION && s2[day] !== STATES.SUBIDA && s2[day] !== STATES.INDUCCION) {
          s2[day] = STATES.PERFORACION;
          fixed++;
          didFix = true;
        }
        if (!didFix && s3[day] !== STATES.PERFORACION && s3[day] !== STATES.SUBIDA && s3[day] !== STATES.INDUCCION) {
          s3[day] = STATES.PERFORACION;
          fixed++;
          didFix = true;
        }

        // Opcion 6: Si S2 o S3 estan en SUBIDA y no pudimos arreglar, forzar perforacion
        if (!didFix && s2[day] === STATES.SUBIDA) {
          s2[day] = STATES.PERFORACION;
          fixed++;
          didFix = true;
        }
        if (!didFix && s3[day] === STATES.SUBIDA) {
          s3[day] = STATES.PERFORACION;
          fixed++;
          didFix = true;
        }
      }
    }

    if (fixed === 0) break;
  }

  // Limpiar patrones invalidos S-S, S-B
  for (let arr of [s2, s3]) {
    for (let i = 1; i < arr.length; i++) {
      if (arr[i - 1] === STATES.SUBIDA && arr[i] === STATES.SUBIDA) {
        arr[i - 1] = STATES.DESCANSO;
      }
      if (arr[i - 1] === STATES.SUBIDA && arr[i] === STATES.BAJADA) {
        arr[i] = STATES.PERFORACION;
      }
    }
  }

  // Recortar al tamano necesario
  let last = 0;
  for (let d = 0; d < totalDays; d++) {
    if (s1[d] !== STATES.EMPTY || s2[d] !== STATES.EMPTY || s3[d] !== STATES.EMPTY) last = d;
  }

  return {
    s1: s1.slice(0, last + 1),
    s2: s2.slice(0, last + 1),
    s3: s3.slice(0, last + 1)
  };
}

export function validateSchedule(s1, s2, s3) {
  const errors = [];
  const len = Math.max(s1.length, s2.length, s3.length);

  let s3Start = s3.findIndex(s => s !== STATES.EMPTY);
  if (s3Start === -1) s3Start = len;

  for (let day = 0; day < len; day++) {
    const count = [s1[day], s2[day], s3[day]].filter(s => s === STATES.PERFORACION).length;

    if (count === 3) errors.push({ day, type: 'THREE_DRILLING', message: `Dia ${day}: 3 perforando` });
    if (count === 1 && day >= s3Start) errors.push({ day, type: 'ONE_DRILLING', message: `Dia ${day}: 1 perforando` });
    if (count === 0 && day >= s3Start) errors.push({ day, type: 'ZERO_DRILLING', message: `Dia ${day}: 0 perforando` });
  }

  for (let idx = 0; idx < 3; idx++) {
    const arr = [s1, s2, s3][idx];
    const name = `S${idx + 1}`;
    for (let i = 1; i < arr.length; i++) {
      if (arr[i - 1] === STATES.SUBIDA && arr[i] === STATES.SUBIDA)
        errors.push({ day: i, type: 'INVALID_PATTERN', message: `${name}: S-S` });
      if (arr[i - 1] === STATES.SUBIDA && arr[i] === STATES.BAJADA)
        errors.push({ day: i, type: 'INVALID_PATTERN', message: `${name}: S-B` });
    }
  }

  return errors;
}

export function getDrillingCount(s1, s2, s3) {
  const len = Math.max(s1.length, s2.length, s3.length);
  return Array.from({ length: len }, (_, i) =>
    [s1[i], s2[i], s3[i]].filter(s => s === STATES.PERFORACION).length
  );
}
