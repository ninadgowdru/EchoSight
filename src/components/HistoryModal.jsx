import React from 'react';
import { X, History, Volume2, Trash2, Clock, Zap } from 'lucide-react';

export default function HistoryModal({
  isOpen,
  onClose,
  history,
  onReplayAudio,
  onClearHistory,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="history-title">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="history-title" className="modal-title">
            <History size={22} color="var(--accent-cyan)" />
            Query History ({history.length})
          </h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close history">
            <X size={22} />
          </button>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)' }}>
            <p>No questions asked yet.</p>
            <p style={{ fontSize: '0.88rem', marginTop: 6 }}>
              Double-tap the screen to ask your first question.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClearHistory}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-rose)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} /> Clear all history
              </button>
            </div>

            {history.map((item, index) => (
              <div key={item.id || index} className="history-item">
                <div className="history-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {item.timeStr || 'Just now'}
                  </span>
                  {item.durationMs && (
                    <span style={{ color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Zap size={12} /> {(item.durationMs / 1000).toFixed(2)}s
                    </span>
                  )}
                </div>

                <div className="history-q">Q: {item.question}</div>
                <div className="history-a">A: {item.answer}</div>

                <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="nav-btn"
                    style={{ width: 'auto', height: 36, padding: '0 12px', borderRadius: 8, gap: 6, fontSize: '0.82rem' }}
                    onClick={() => onReplayAudio(item.answer)}
                    aria-label={`Listen again to answer: ${item.answer}`}
                  >
                    <Volume2 size={16} color="var(--accent-emerald)" />
                    Replay Audio
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
