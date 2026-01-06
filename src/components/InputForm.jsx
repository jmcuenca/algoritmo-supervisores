import { useState } from 'react';
import { FiPlay, FiSettings } from 'react-icons/fi';
import './InputForm.css';

function InputForm({ onCalculate }) {
  const [workDays, setWorkDays] = useState(14);
  const [restDays, setRestDays] = useState(7);
  const [inductionDays, setInductionDays] = useState(5);
  const [totalDrillingDays, setTotalDrillingDays] = useState(90);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCalculate({
      workDays: parseInt(workDays),
      restDays: parseInt(restDays),
      inductionDays: parseInt(inductionDays),
      totalDrillingDays: parseInt(totalDrillingDays)
    });
  };

  return (
    <form className="input-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <FiSettings className="form-icon" />
        <h2>Configuracion del Cronograma</h2>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="workDays">Dias de trabajo (N)</label>
          <input
            type="number"
            id="workDays"
            value={workDays}
            onChange={(e) => setWorkDays(e.target.value)}
            min="5"
            max="30"
            required
          />
          <span className="helper-text">Incluye subida, induccion y perforacion</span>
        </div>

        <div className="form-group">
          <label htmlFor="restDays">Dias libres (M)</label>
          <input
            type="number"
            id="restDays"
            value={restDays}
            onChange={(e) => setRestDays(e.target.value)}
            min="3"
            max="14"
            required
          />
          <span className="helper-text">Incluye bajada y descanso</span>
        </div>

        <div className="form-group">
          <label htmlFor="inductionDays">Dias de induccion</label>
          <input
            type="number"
            id="inductionDays"
            value={inductionDays}
            onChange={(e) => setInductionDays(e.target.value)}
            min="1"
            max="5"
            required
          />
          <span className="helper-text">Solo aplica en el primer ciclo</span>
        </div>

        <div className="form-group">
          <label htmlFor="totalDrillingDays">Total dias de perforacion</label>
          <input
            type="number"
            id="totalDrillingDays"
            value={totalDrillingDays}
            onChange={(e) => setTotalDrillingDays(e.target.value)}
            min="10"
            max="365"
            required
          />
          <span className="helper-text">Dias totales requeridos de perforacion</span>
        </div>
      </div>

      <div className="form-summary">
        <span>Regimen: <strong>{workDays}x{restDays}</strong></span>
        <span>Descanso real: <strong>{Math.max(0, restDays - 2)} dias</strong></span>
        <span>Perforacion primer ciclo: <strong>{Math.max(0, workDays - inductionDays - 1)} dias</strong></span>
      </div>

      <button type="submit" className="btn-calculate">
        <FiPlay />
        Calcular Cronograma
      </button>
    </form>
  );
}

export default InputForm;
