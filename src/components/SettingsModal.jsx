import React, { useState, useEffect } from 'react';
import { X, Key, Volume2, Contrast, Sliders, Eye, Sparkles } from 'lucide-react';
import { getSystemVoices } from '../utils/speech';

export default function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  voiceSettings,
  onUpdateVoiceSettings,
  highContrast,
  onToggleHighContrast,
  textSize,
  onChangeTextSize,
  useSimulatedFeed,
  onToggleSimulatedFeed,
}) {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    setKeyInput(apiKey || '');
  }, [apiKey]);

  useEffect(() => {
    if (isOpen) {
      const vList = getSystemVoices();
      setVoices(vList.filter(v => v.lang.startsWith('en') || v.default));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveApiKey(keyInput.trim());
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="settings-title" className="modal-title">
            <Sliders size={22} color="var(--accent-cyan)" />
            Accessibility & Settings
          </h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close settings">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Gemini API Key */}
          <div className="control-group">
            <label className="control-label" htmlFor="apiKeyInput">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Key size={16} /> Google Gemini API Key
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', textDecoration: 'none' }}
              >
                Get Free Key ↗
              </a>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="apiKeyInput"
                type={showKey ? 'text' : 'password'}
                className="text-input"
                placeholder="AIzaSy... (leave blank to use backend server key)"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                style={{ paddingRight: 64 }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Uses Gemini 1.5 Flash for sub-2s response. Free tier includes 15 RPM.
            </span>
          </div>

          {/* High Contrast Mode */}
          <div className="control-group">
            <label className="control-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Contrast size={16} /> High Contrast Vision Mode
              </span>
              <span>{highContrast ? 'Active (WCAG AAA)' : 'Standard'}</span>
            </label>
            <button
              type="button"
              className={`nav-btn ${highContrast ? 'active' : ''}`}
              style={{ width: '100%', borderRadius: 12, justifyContent: 'center', gap: 10 }}
              onClick={onToggleHighContrast}
            >
              <Contrast size={18} />
              {highContrast ? 'Disable Yellow-on-Black Contrast' : 'Enable High Contrast (Yellow on Pure Black)'}
            </button>
          </div>

          {/* Text Size Scale */}
          <div className="control-group">
            <label className="control-label">Text Size for Low Vision</label>
            <div className="segmented-toggle">
              <button
                type="button"
                className={`segment-btn ${textSize === 'normal' ? 'active' : ''}`}
                onClick={() => onChangeTextSize('normal')}
              >
                Standard
              </button>
              <button
                type="button"
                className={`segment-btn ${textSize === 'large' ? 'active' : ''}`}
                onClick={() => onChangeTextSize('large')}
              >
                Large
              </button>
              <button
                type="button"
                className={`segment-btn ${textSize === 'jumbo' ? 'active' : ''}`}
                onClick={() => onChangeTextSize('jumbo')}
              >
                Jumbo
              </button>
            </div>
          </div>

          {/* Voice Speech Rate */}
          <div className="control-group">
            <label className="control-label" htmlFor="rateSlider">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Volume2 size={16} /> Speech Rate: {voiceSettings.rate}x
              </span>
            </label>
            <input
              id="rateSlider"
              type="range"
              min="0.8"
              max="1.6"
              step="0.05"
              className="range-slider"
              value={voiceSettings.rate}
              onChange={e => onUpdateVoiceSettings({ ...voiceSettings, rate: parseFloat(e.target.value) })}
            />
          </div>

          {/* Voice Selector */}
          {voices.length > 0 && (
            <div className="control-group">
              <label className="control-label" htmlFor="voiceSelector">
                Voice Output
              </label>
              <select
                id="voiceSelector"
                className="text-input"
                value={voiceSettings.voiceURI || ''}
                onChange={e => onUpdateVoiceSettings({ ...voiceSettings, voiceURI: e.target.value })}
              >
                <option value="">Default System Natural Voice</option>
                {voices.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Camera Simulation Mode */}
          <div className="control-group">
            <label className="control-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye size={16} /> Simulated Camera Feed
              </span>
              <span>{useSimulatedFeed ? 'Active' : 'Off'}</span>
            </label>
            <button
              type="button"
              className={`nav-btn ${useSimulatedFeed ? 'active' : ''}`}
              style={{ width: '100%', borderRadius: 12, justifyContent: 'center', gap: 10 }}
              onClick={onToggleSimulatedFeed}
            >
              <Eye size={18} />
              {useSimulatedFeed ? 'Switch to Real Camera' : 'Use Simulated Living Room Scene (Test Mode)'}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="big-trigger-btn"
            style={{ fontSize: '1.05rem', padding: '14px', marginTop: 8 }}
          >
            Save & Return to App
          </button>
        </form>
      </div>
    </div>
  );
}
