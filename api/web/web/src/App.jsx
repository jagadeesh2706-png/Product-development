import React, { useState } from 'react';

function App() {
  const [minutes, setMinutes] = useState(20);
  const [muscle, setMuscle] = useState('');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  async function getPlan() {
    setLoading(true);
    try {
      const resp = await fetch('/api/plan-time-split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_minutes: Number(minutes),
          muscle_group: muscle
        })
      });

      const json = await resp.json();
      setPlan(json);

    } catch (error) {
      console.error(error);
      alert("Error fetching plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: 'auto', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center' }}>Time-Splitting Smart Planner</h1>

      {/* Input for minutes */}
      <div style={{ margin: '15px 0' }}>
        <label>
          <strong>Available Minutes:</strong>
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            style={{
              marginLeft: 10,
              padding: 5,
              width: '80px',
              borderRadius: 4,
              border: '1px solid #ccc'
            }}
          />
        </label>
      </div>

      {/* Input for muscle group */}
      <div style={{ margin: '15px 0' }}>
        <label>
          <strong>Muscle (Optional):</strong>
          <input
            type="text"
            placeholder="legs, arms, core..."
            value={muscle}
            onChange={(e) => setMuscle(e.target.value)}
            style={{
              marginLeft: 10,
              padding: 5,
              width: '200px',
              borderRadius: 4,
              border: '1px solid #ccc'
            }}
          />
        </label>
      </div>

      {/* Button */}
      <button
        onClick={getPlan}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          border: 'none',
          color: 'white',
          borderRadius: 5,
          cursor: 'pointer',
          fontSize: 16
        }}
      >
        {loading ? 'Creating Plan...' : 'Generate Plan'}
      </button>

      {/* Workout Plan Output */}
      {plan && (
        <div style={{ marginTop: 30 }}>
          <h2>Your Plan ({plan.total_minutes} minutes)</h2>

          {plan.blocks.map((b) => (
            <div
              key={b.id}
              style={{
                border: '1px solid #ddd',
                padding: 12,
                margin: '10px 0',
                borderRadius: 6,
                background: '#f9f9f9'
              }}
            >
              <h3 style={{ margin: 0 }}>{b.type}</h3>
              <p style={{ margin: '5px 0' }}>
                <strong>Duration:</strong> {b.duration_min} min
                <br />
                <strong>Intensity:</strong> {b.intensity}
                <br />
                <strong>Muscles:</strong> {b.target_muscles.join(', ')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
