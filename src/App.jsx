import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Sliders,
  History,
  HelpCircle,
  Volume2,
  VolumeX,
  Zap,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Eye,
  Send,
  MessageSquare
} from 'lucide-react';

import CameraView from './components/CameraView';
import AudioVisualizer from './components/AudioVisualizer';
import SettingsModal from './components/SettingsModal';
import HistoryModal from './components/HistoryModal';
import HelpModal from './components/HelpModal';

import { playEarcon, triggerHaptic } from './utils/audioFeedback';
import { startListening, stopListening, speakAnswer, stopSpeaking, isSpeechRecognitionSupported } from './utils/speech';
import { analyzeSceneWithGemini } from './utils/geminiClient';

const PRESET_QUESTIONS = [
  'Is there a chair in front of me?',
  'What obstacles are in my walking path?',
  'Read the text in front of me',
  'What color is this item?',
  'Describe the table surface in front of me',
];

export default function App() {
  const cameraRef = useRef(null);
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });

  // Core Assistant States
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
  const [spokenQuery, setSpokenQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [latencyMs, setLatencyMs] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [srAnnouncement, setSrAnnouncement] = useState('');

  // Settings & Preferences
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('echosight_gemini_key') || '');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('echosight_high_contrast') === 'true');
  const [textSize, setTextSize] = useState(() => localStorage.getItem('echosight_text_size') || 'normal');
  const [useSimulatedFeed, setUseSimulatedFeed] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('echosight_voice_settings');
      return saved ? JSON.parse(saved) : { rate: 1.1, pitch: 1.0, voiceURI: '' };
    } catch {
      return { rate: 1.1, pitch: 1.0, voiceURI: '' };
    }
  });

  // History
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('echosight_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Manual text query fallback
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputVal, setTextInputVal] = useState('');

  // Visual tap ripples
  const [ripples, setRipples] = useState([]);

  // Sync body accessibility classes
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    localStorage.setItem('echosight_high_contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    document.body.classList.remove('text-large', 'text-jumbo');
    if (textSize === 'large') document.body.classList.add('text-large');
    if (textSize === 'jumbo') document.body.classList.add('text-jumbo');
    localStorage.setItem('echosight_text_size', textSize);
  }, [textSize]);

  useEffect(() => {
    localStorage.setItem('echosight_voice_settings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  useEffect(() => {
    localStorage.setItem('echosight_history', JSON.stringify(history));
  }, [history]);

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    localStorage.setItem('echosight_gemini_key', newKey);
  };

  /**
   * Main AI Multimodal Analysis pipeline
   */
  const executeVisualQuery = useCallback(async (queryText) => {
    const finalQuestion = queryText?.trim() || 'What is directly in front of me and are there any obstacles?';
    setSpokenQuery(finalQuestion);
    setStatus('processing');
    setErrorMessage('');
    setSrAnnouncement('Processing your surroundings with Gemini 1.5 Flash AI...');
    playEarcon('processing');

    try {
      // 1. Capture current frame from camera
      let imageBase64;
      if (cameraRef.current) {
        imageBase64 = cameraRef.current.captureImage();
      }

      if (!imageBase64) {
        throw new Error('Could not capture frame from camera.');
      }

      // 2. Multimodal API Call to Gemini 1.5 Flash
      const result = await analyzeSceneWithGemini({
        imageBase64,
        question: finalQuestion,
        customApiKey: apiKey,
      });

      if (!result.success || !result.answer) {
        throw new Error(result.error || 'Failed to receive a valid response.');
      }

      const answerText = result.answer;
      setAiAnswer(answerText);
      setLatencyMs(result.durationMs);
      setStatus('speaking');
      setSrAnnouncement(`Answer: ${answerText}`);

      // Haptic and Earcon confirmation
      triggerHaptic([60]);
      playEarcon('success');

      // 3. Spoken Audio Feedback (The Mouth)
      speakAnswer(answerText, {
        rate: voiceSettings.rate,
        pitch: voiceSettings.pitch,
        voiceURI: voiceSettings.voiceURI,
        onEnd: () => {
          setStatus('idle');
        },
        onError: () => {
          setStatus('idle');
        },
      });

      // 4. Save to history
      const newEntry = {
        id: Date.now().toString(),
        question: finalQuestion,
        answer: answerText,
        durationMs: result.durationMs,
        timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 24)]);
    } catch (err) {
      console.error('Vision query failed:', err);
      const msg = err.message || 'Error analyzing camera view.';
      setErrorMessage(msg);
      setStatus('error');
      setSrAnnouncement(`Error: ${msg}`);
      playEarcon('error');

      // Voice warning if API key error
      if (msg.includes('API key') || msg.includes('401')) {
        speakAnswer('Please configure your Gemini API Key in Settings to enable visual assistance.', {
          rate: voiceSettings.rate,
        });
      }
    }
  }, [apiKey, voiceSettings]);

  /**
   * Start Voice Listening (The Ears)
   */
  const handleStartVoiceInteraction = useCallback(() => {
    // If speaking or listening, interrupt
    stopSpeaking();
    stopListening();

    if (!isSpeechRecognitionSupported()) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use the text input below.');
      setShowTextInput(true);
      return;
    }

    setSpokenQuery('');
    setAiAnswer('');
    setErrorMessage('');
    setStatus('listening');
    setSrAnnouncement('Listening for your question. Speak now.');

    triggerHaptic([35, 45]);
    playEarcon('startListening');

    startListening({
      onStart: () => {
        setStatus('listening');
      },
      onInterim: (interim) => {
        setSpokenQuery(interim);
      },
      onFinal: (final) => {
        setSpokenQuery(final);
        playEarcon('stopListening');
        executeVisualQuery(final);
      },
      onError: (err) => {
        setErrorMessage(err);
        setStatus('error');
        playEarcon('error');
        setSrAnnouncement(err);
      },
      onEnd: () => {
        // Handled in onFinal / onError
      },
    });
  }, [executeVisualQuery]);

  /**
   * Double-Tap anywhere handler for effortless visually impaired interaction
   */
  const handleScreenTouch = (e) => {
    // Ignore clicks if clicking inside buttons or modals
    if (e.target.closest('button') || e.target.closest('.modal-content') || e.target.closest('input')) {
      return;
    }

    const now = Date.now();
    const touch = e.touches ? e.touches[0] : e;
    const clientX = touch.clientX || window.innerWidth / 2;
    const clientY = touch.clientY || window.innerHeight / 2;

    const timeDiff = now - lastTapRef.current.time;
    const dist = Math.hypot(clientX - lastTapRef.current.x, clientY - lastTapRef.current.y);

    // Add visual tap ripple
    const rippleId = Math.random();
    setRipples(prev => [...prev.slice(-3), { id: rippleId, x: clientX, y: clientY }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 600);

    // Double-tap detected (under 340ms, within 70px)
    if (timeDiff < 340 && dist < 70) {
      lastTapRef.current = { time: 0, x: 0, y: 0 };
      handleStartVoiceInteraction();
    } else {
      lastTapRef.current = { time: now, x: clientX, y: clientY };
    }
  };

  /**
   * Keyboard shortcuts (Spacebar / Enter to talk, Esc to close modals)
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleStartVoiceInteraction();
      } else if (e.code === 'Escape') {
        setSettingsOpen(false);
        setHistoryOpen(false);
        setHelpOpen(false);
        stopSpeaking();
        stopListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStartVoiceInteraction]);

  const handleManualTextSubmit = (e) => {
    e.preventDefault();
    if (textInputVal.trim()) {
      executeVisualQuery(textInputVal.trim());
      setTextInputVal('');
      setShowTextInput(false);
    }
  };

  return (
    <div className="app-container" onTouchStart={handleScreenTouch} onClick={handleScreenTouch}>
      {/* Screen reader live announcements */}
      <div aria-live="assertive" className="sr-only">
        {srAnnouncement}
      </div>

      {/* Tap Ripples */}
      {ripples.map(r => (
        <div key={r.id} className="tap-ripple" style={{ left: r.x, top: r.y }} />
      ))}

      {/* Top Navigation Bar */}
      <header className="top-nav">
        <div className="brand-badge" tabIndex={0} aria-label="EchoSight AI Visual Assistant">
          <div className="brand-icon-wrapper">
            <Eye size={22} color="var(--accent-cyan)" />
          </div>
          <div>
            <h1 className="brand-title">EchoSight</h1>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
              GEMINI 1.5 FLASH • SUB-2S
            </div>
          </div>
        </div>

        <nav className="nav-actions" aria-label="Quick actions">
          <button
            type="button"
            className="nav-btn"
            onClick={(e) => { e.stopPropagation(); setShowTextInput(!showTextInput); }}
            title="Type a question"
            aria-label="Toggle text question input"
          >
            <MessageSquare size={18} />
          </button>

          <button
            type="button"
            className="nav-btn"
            onClick={(e) => { e.stopPropagation(); setHistoryOpen(true); }}
            title="History"
            aria-label={`Open history, ${history.length} items`}
          >
            <History size={18} />
          </button>

          <button
            type="button"
            className="nav-btn"
            onClick={(e) => { e.stopPropagation(); setHelpOpen(true); }}
            title="Help"
            aria-label="Open how-to guide"
          >
            <HelpCircle size={18} />
          </button>

          <button
            type="button"
            className="nav-btn"
            onClick={(e) => { e.stopPropagation(); setSettingsOpen(true); }}
            title="Settings & Accessibility"
            aria-label="Open settings and accessibility controls"
          >
            <Sliders size={18} />
          </button>
        </nav>
      </header>

      {/* Camera Viewport (The Eyes) */}
      <CameraView
        ref={cameraRef}
        isProcessing={status === 'processing'}
        useSimulatedFeed={useSimulatedFeed}
        onCameraError={(err) => setErrorMessage(`Camera notice: ${err}`)}
      />

      {/* Bottom Floating Interaction Deck */}
      <main className="touch-trigger-layer">
        <div className="interaction-deck" onClick={(e) => e.stopPropagation()}>
          {/* Real-time Query & AI Response Display Card */}
          {(spokenQuery || aiAnswer || status !== 'idle' || errorMessage) && (
            <section
              className={`live-feedback-card ${status}`}
              aria-live="polite"
            >
              {/* Audio Wave Visualizer */}
              <AudioVisualizer isActive={status === 'listening' || status === 'speaking'} mode={status} />

              {/* Status Pill */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`status-pill ${status}`}>
                  {status === 'listening' && '● Listening for question...'}
                  {status === 'processing' && '⚡ Gemini 1.5 Flash Analyzing...'}
                  {status === 'speaking' && '🔊 Speaking Answer...'}
                  {status === 'idle' && '✓ Answer Ready'}
                  {status === 'error' && '⚠ Attention'}
                </span>

                {latencyMs && (
                  <span className="latency-badge" title="Multimodal processing latency">
                    <Zap size={13} /> {(latencyMs / 1000).toFixed(2)}s
                  </span>
                )}
              </div>

              {/* Spoken Query */}
              {spokenQuery && (
                <div className="live-query-text">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ask:</span>
                  <span>"{spokenQuery}"</span>
                </div>
              )}

              {/* Spoken Answer */}
              {aiAnswer && (
                <div className={`live-answer-text ${highContrast ? 'high-contrast' : ''}`}>
                  {aiAnswer}
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div style={{ color: 'var(--accent-rose)', fontSize: '0.88rem', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Stop Speaking / Replay Button */}
              {status === 'speaking' && (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <VolumeX size={14} /> Mute Audio
                </button>
              )}
            </section>
          )}

          {/* Quick Preset Questions */}
          <div className="preset-chips-scroll" role="toolbar" aria-label="Suggested quick questions">
            {PRESET_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                className="preset-chip"
                onClick={() => executeVisualQuery(q)}
                title={`Ask: ${q}`}
              >
                <Sparkles size={14} color="var(--accent-cyan)" />
                {q}
              </button>
            ))}
          </div>

          {/* Manual Text Query Form (if enabled or fallback) */}
          {showTextInput && (
            <form onSubmit={handleManualTextSubmit} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="text-input"
                placeholder="Type question about what camera sees..."
                value={textInputVal}
                onChange={(e) => setTextInputVal(e.target.value)}
                autoFocus
              />
              <button type="submit" className="nav-btn" style={{ width: 48, flexShrink: 0 }} aria-label="Send text question">
                <Send size={18} color="var(--accent-cyan)" />
              </button>
            </form>
          )}

          {/* Primary Big Tactile Action Button */}
          <button
            type="button"
            className={`big-trigger-btn ${status}`}
            onClick={handleStartVoiceInteraction}
            aria-label={
              status === 'listening'
                ? 'Listening to your question. Tap to cancel.'
                : 'Double-tap screen or tap this button to ask a question'
            }
          >
            {status === 'listening' ? (
              <>
                <MicOff size={28} />
                <span>Listening... (Tap to Cancel)</span>
              </>
            ) : status === 'processing' ? (
              <>
                <Zap size={28} color="var(--accent-amber)" />
                <span>Analyzing Scene...</span>
              </>
            ) : (
              <>
                <Mic size={28} />
                <span>Double-Tap Anywhere to Ask</span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        voiceSettings={voiceSettings}
        onUpdateVoiceSettings={setVoiceSettings}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
        textSize={textSize}
        onChangeTextSize={setTextSize}
        useSimulatedFeed={useSimulatedFeed}
        onToggleSimulatedFeed={() => setUseSimulatedFeed(!useSimulatedFeed)}
      />

      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onReplayAudio={(text) => speakAnswer(text, voiceSettings)}
        onClearHistory={() => setHistory([])}
      />

      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  );
}
