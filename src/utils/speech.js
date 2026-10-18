// Web Speech API wrapper for SpeechRecognition (Ears) and SpeechSynthesis (Mouth)

export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean('speechSynthesis' in window);
}

let activeRecognition = null;

/**
 * Start listening for a spoken question
 */
export function startListening({ onInterim, onFinal, onError, onStart, onEnd }) {
  if (!isSpeechRecognitionSupported()) {
    onError?.('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    return null;
  }

  // Cancel any existing recognition
  if (activeRecognition) {
    try {
      activeRecognition.abort();
    } catch (e) {
      // ignore
    }
    activeRecognition = null;
  }

  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();

  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  let finalTranscript = '';
  let speechStarted = false;

  recognition.onstart = () => {
    speechStarted = true;
    onStart?.();
  };

  recognition.onresult = (event) => {
    let interimText = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const part = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += part;
      } else {
        interimText += part;
      }
    }

    if (finalTranscript) {
      onFinal?.(finalTranscript.trim());
    } else if (interimText) {
      onInterim?.(interimText.trim());
    }
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    if (event.error === 'no-speech') {
      onError?.('No voice detected. Please double-tap and try again.');
    } else if (event.error === 'audio-capture') {
      onError?.('Microphone not found or permission denied.');
    } else if (event.error === 'not-allowed') {
      onError?.('Microphone permission blocked. Please allow mic access in browser.');
    } else {
      onError?.(`Voice error: ${event.error}`);
    }
  };

  recognition.onend = () => {
    activeRecognition = null;
    onEnd?.();
  };

  try {
    recognition.start();
    activeRecognition = recognition;
  } catch (err) {
    console.error('Failed to start recognition:', err);
    onError?.(err.message);
  }

  return recognition;
}

export function stopListening() {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (e) {
      // ignore
    }
    activeRecognition = null;
  }
}

/**
 * Text-to-Speech (The Mouth) using native browser SpeechSynthesis
 */
export function speakAnswer(text, options = {}) {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis not supported');
    options.onError?.('Speech synthesis not supported');
    return;
  }

  // Cancel any ongoing speech
  stopSpeaking();

  if (!text || text.trim().length === 0) return;

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Settings
  utterance.rate = options.rate || 1.05; // Slightly faster than normal for rapid feedback
  utterance.pitch = options.pitch || 1.0;
  utterance.volume = options.volume || 1.0;

  // Select voice if specified or choose a natural voice
  const voices = window.speechSynthesis.getVoices();
  if (options.voiceURI) {
    const selected = voices.find(v => v.voiceURI === options.voiceURI);
    if (selected) utterance.voice = selected;
  } else {
    // Pick standard English natural voice
    const naturalVoice = voices.find(v => 
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) &&
      v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (naturalVoice) utterance.voice = naturalVoice;
  }

  utterance.onstart = () => {
    options.onStart?.();
  };

  utterance.onend = () => {
    options.onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis utterance error:', e);
    options.onError?.(e);
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function getSystemVoices() {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}
