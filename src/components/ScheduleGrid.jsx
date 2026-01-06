import { useMemo } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { STATES, getDrillingCount, validateSchedule } from '../utils/scheduleGenerator';
import './ScheduleGrid.css';

const STATE_CONFIG = {
  [STATES.SUBIDA]: { label: 'S', className: 'state-subida', title: 'Subida' },
  [STATES.INDUCCION]: { label: 'I', className: 'state-induccion', title: 'Induccion' },
  [STATES.PERFORACION]: { label: 'P', className: 'state-perforacion', title: 'Perforacion' },
  [STATES.BAJADA]: { label: 'B', className: 'state-bajada', title: 'Bajada' },
  [STATES.DESCANSO]: { label: 'D', className: 'state-descanso', title: 'Descanso' },
  [STATES.EMPTY]: { label: '-', className: 'state-empty', title: 'Sin actividad' }
};

function ScheduleGrid({ schedule }) {
  const { s1, s2, s3 } = schedule;

  const drillingCounts = useMemo(() => getDrillingCount(s1, s2, s3), [s1, s2, s3]);
  const errors = useMemo(() => validateSchedule(s1, s2, s3), [s1, s2, s3]);

  const errorDays = useMemo(() => {
    const days = new Set();
    errors.forEach(err => days.add(err.day));
    return days;
  }, [errors]);

  // Encontrar cuando S3 entra
  const s3FirstActive = useMemo(() => {
    for (let i = 0; i < s3.length; i++) {
      if (s3[i] !== STATES.EMPTY) return i;
    }
    return -1;
  }, [s3]);

  const totalDays = Math.max(s1.length, s2.length, s3.length);

  const renderCell = (state, day, supervisor) => {
    const config = STATE_CONFIG[state] || STATE_CONFIG[STATES.EMPTY];
    const hasError = errorDays.has(day);

    return (
      <td
        key={`${supervisor}-${day}`}
        className={`schedule-cell ${config.className} ${hasError ? 'has-error' : ''}`}
        title={`${config.title} - Dia ${day}`}
      >
        {config.label}
      </td>
    );
  };

  const renderDrillingCount = (count, day) => {
    const isAfterS3 = s3FirstActive !== -1 && day >= s3FirstActive;
    const isError = isAfterS3 && count !== 2;
    const isWarning = !isAfterS3 && count === 0;

    return (
      <td
        key={`count-${day}`}
        className={`drilling-count ${isError ? 'count-error' : ''} ${isWarning ? 'count-warning' : ''} ${count === 2 ? 'count-ok' : ''}`}
      >
        {count}
      </td>
    );
  };

  // Agrupar días en chunks para mejor visualización
  const chunkSize = 15;
  const chunks = [];
  for (let i = 0; i < totalDays; i += chunkSize) {
    chunks.push({
      start: i,
      end: Math.min(i + chunkSize, totalDays)
    });
  }

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <h2>Cronograma Generado</h2>
        <div className="schedule-stats">
          <span className="stat">
            <FiCheckCircle className="stat-icon success" />
            Total dias: {totalDays}
          </span>
          {errors.length === 0 ? (
            <span className="stat success-text">
              <FiCheckCircle className="stat-icon success" />
              Sin errores
            </span>
          ) : (
            <span className="stat error-text">
              <FiAlertTriangle className="stat-icon error" />
              {errors.length} error{errors.length > 1 ? 'es' : ''}
            </span>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="errors-panel">
          <div className="errors-header">
            <FiAlertCircle />
            <span>Errores detectados</span>
          </div>
          <ul className="errors-list">
            {errors.slice(0, 10).map((err, idx) => (
              <li key={idx}>{err.message}</li>
            ))}
            {errors.length > 10 && (
              <li className="more-errors">... y {errors.length - 10} errores mas</li>
            )}
          </ul>
        </div>
      )}

      <div className="legend">
        <div className="legend-item">
          <span className="legend-color state-subida"></span>
          <span>S - Subida</span>
        </div>
        <div className="legend-item">
          <span className="legend-color state-induccion"></span>
          <span>I - Induccion</span>
        </div>
        <div className="legend-item">
          <span className="legend-color state-perforacion"></span>
          <span>P - Perforacion</span>
        </div>
        <div className="legend-item">
          <span className="legend-color state-bajada"></span>
          <span>B - Bajada</span>
        </div>
        <div className="legend-item">
          <span className="legend-color state-descanso"></span>
          <span>D - Descanso</span>
        </div>
      </div>

      {chunks.map((chunk, chunkIdx) => (
        <div key={chunkIdx} className="schedule-chunk">
          <div className="chunk-label">Dias {chunk.start} - {chunk.end - 1}</div>
          <div className="table-wrapper">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th className="supervisor-header">Sup.</th>
                  {Array.from({ length: chunk.end - chunk.start }, (_, i) => (
                    <th key={chunk.start + i} className="day-header">
                      {chunk.start + i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="supervisor-label">S1</td>
                  {Array.from({ length: chunk.end - chunk.start }, (_, i) => {
                    const day = chunk.start + i;
                    return renderCell(s1[day] || STATES.EMPTY, day, 'S1');
                  })}
                </tr>
                <tr>
                  <td className="supervisor-label">S2</td>
                  {Array.from({ length: chunk.end - chunk.start }, (_, i) => {
                    const day = chunk.start + i;
                    return renderCell(s2[day] || STATES.EMPTY, day, 'S2');
                  })}
                </tr>
                <tr>
                  <td className="supervisor-label">S3</td>
                  {Array.from({ length: chunk.end - chunk.start }, (_, i) => {
                    const day = chunk.start + i;
                    return renderCell(s3[day] || STATES.EMPTY, day, 'S3');
                  })}
                </tr>
                <tr className="drilling-row">
                  <td className="supervisor-label">#P</td>
                  {Array.from({ length: chunk.end - chunk.start }, (_, i) => {
                    const day = chunk.start + i;
                    return renderDrillingCount(drillingCounts[day] || 0, day);
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ScheduleGrid;
