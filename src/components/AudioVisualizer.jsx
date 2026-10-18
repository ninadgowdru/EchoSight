import React from 'react';

export default function AudioVisualizer({ isActive, mode = 'listening' }) {
  // Generate 12 bars with varying animation delays
  const bars = [0.1, 0.4, 0.2, 0.6, 0.3, 0.7, 0.5, 0.3, 0.6, 0.2, 0.5, 0.15];

  return (
    <div className="audio-wave-container" aria-hidden="true">
      {bars.map((delay, index) => (
        <div
          key={index}
          className={`audio-wave-bar ${isActive ? 'active' : ''}`}
          style={{
            animationDelay: `${delay}s`,
            animationDuration: mode === 'speaking' ? '0.7s' : '0.9s',
            background: isActive
              ? mode === 'speaking'
                ? 'linear-gradient(180deg, var(--accent-emerald), #00d9f5)'
                : 'linear-gradient(180deg, var(--accent-cyan), var(--accent-blue))'
              : 'var(--text-muted)',
          }}
        />
      ))}
    </div>
  );
}
