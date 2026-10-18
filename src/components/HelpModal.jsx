import React from 'react';
import { X, HelpCircle, Eye, Mic, Zap, Volume2, ShieldCheck, Smartphone } from 'lucide-react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="help-title" className="modal-title">
            <HelpCircle size={22} color="var(--accent-cyan)" />
            How EchoSight Works
          </h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close help">
            <X size={22} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'rgba(0, 242, 254, 0.08)', padding: 14, borderRadius: 14, border: '1px solid rgba(0, 242, 254, 0.2)' }}>
            <h4 style={{ color: 'var(--accent-cyan)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Smartphone size={18} /> The Double-Tap Gesture
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Double-tap anywhere on your screen. You will hear an ascending chime indicating the microphone is listening. Ask your question naturally and release.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0, 245, 160, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Eye size={20} color="var(--accent-emerald)" />
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>1. The Eyes (Camera)</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Native HTML5 camera captures your environment in high fidelity with zero battery waste.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0, 242, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Mic size={20} color="var(--accent-cyan)" />
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>2. The Ears (Voice Recognition)</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Free browser-native SpeechRecognition translates your speech instantly without heavy app downloads.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255, 183, 3, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={20} color="var(--accent-amber)" />
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>3. The Brain (Gemini 1.5 Flash)</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Processes image + query in under 2 seconds, delivering spatial warnings and direct answers.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(79, 172, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Volume2 size={20} color="var(--accent-blue)" />
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>4. The Mouth (SpeechSynthesis)</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Reads the answer clearly aloud into your headphones or phone speaker.
                </p>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: 12, borderRadius: 12, border: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Keyboard Navigation:</span> Press <kbd style={{ padding: '2px 6px', background: '#222', borderRadius: 4, color: '#fff' }}>Spacebar</kbd> or <kbd style={{ padding: '2px 6px', background: '#222', borderRadius: 4, color: '#fff' }}>Enter</kbd> to trigger voice input instantly.
          </div>

          <button
            type="button"
            className="big-trigger-btn"
            style={{ fontSize: '1rem', padding: '12px' }}
            onClick={onClose}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
