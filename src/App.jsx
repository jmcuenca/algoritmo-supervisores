import { useState } from 'react';
import { FiCalendar } from 'react-icons/fi';
import InputForm from './components/InputForm';
import ScheduleGrid from './components/ScheduleGrid';
import { generateSchedule } from './utils/scheduleGenerator';
import './App.css';

function App() {
  const [schedule, setSchedule] = useState(null);
  const [config, setConfig] = useState(null);

  const handleCalculate = (params) => {
    const result = generateSchedule(
      params.workDays,
      params.restDays,
      params.inductionDays,
      params.totalDrillingDays
    );
    setSchedule(result);
    setConfig(params);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <FiCalendar className="header-icon" />
          <div>
            <h1>Cronograma de Supervisores</h1>
            <p>Sistema de planificacion de turnos de perforacion</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <InputForm onCalculate={handleCalculate} />

        {schedule && (
          <>
            <div className="config-summary">
              <span>Regimen: <strong>{config.workDays}x{config.restDays}</strong></span>
              <span>Induccion: <strong>{config.inductionDays} dias</strong></span>
              <span>Perforacion total: <strong>{config.totalDrillingDays} dias</strong></span>
            </div>
            <ScheduleGrid schedule={schedule} />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Algoritmo de Cronograma de Supervisores - Prueba Tecnica</p>
      </footer>
    </div>
  );
}

export default App;
