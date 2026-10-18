# 👁️ EchoSight AI — Visual Assistant for Visually Impaired

> **Sub-2-Second Multimodal AI Accessibility Progressive Web App (PWA)**  
> Empowers blind and low-vision individuals by answering questions about their physical surroundings in real-time using multimodal AI and voice speech synthesis.

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-Flash-purple.svg)](https://aistudio.google.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Accessibility](https://img.shields.io/badge/WCAG-AAA%20Compliant-brightgreen.svg)]()

---

## 💡 The Problem & The Solution

- **The Problem**: Traditional screen readers flood the user with walls of verbose text, narrating every button and element on screen. Heavy native apps take minutes to download and drain device batteries.
- **Our Solution**: A zero-download, instant Progressive Web App where a visually impaired user simply **double-taps anywhere on the screen**, asks a specific question (*"Is there a chair in front of me?"*, *"What obstacles are in my walking path?"*), and multimodal AI inspects the camera feed to **answer out loud in under 2 seconds**.

---

## ⚡ Zero-Cost, Lightning-Fast Architecture

We deliberately eliminated costly voice APIs (like ElevenLabs) and expensive WebRTC streaming servers by utilizing browser-native capabilities:

- **The Eyes (Camera)**: Native HTML5 `<video>` & `getUserMedia` with automatic 800px frame compression for sub-second uploads.
- **The Ears (Voice-to-Text)**: Native Web Speech API (`SpeechRecognition`) with zero download or installation.
- **The Brain (AI Vision)**: Google Gemini Flash Multimodal API (accepts image + prompt, returns concise spatial guidance).
- **The Mouth (Text-to-Voice)**: Native Web Speech API (`SpeechSynthesis`) with customizable speech rates and pitch.
- **Offline Earcons**: Web Audio API oscillator synthesis for rising listening chimes, processing ticks, and completion tones.
- **Tactile Feedback**: Browser `navigator.vibrate` haptic pulses on gestures and answers.

---

## 💻 How to Run on Any Laptop (Windows, Mac, Linux)

Follow these quick steps to run EchoSight on your laptop:

### 1. Prerequisites
- **Node.js**: Version 18.0 or higher ([Download Node.js](https://nodejs.org/))
- **Browser**: Google Chrome, Microsoft Edge, Brave, or Safari (Chrome/Edge are recommended for full Web Speech API support).
- **Webcam / Microphone**: Built-in or external camera and mic.

---

### 2. Step-by-Step Setup

#### Step 1: Clone the Repository
Open Terminal (macOS/Linux) or PowerShell / Command Prompt (Windows):
```bash
git clone https://github.com/ninadgowdru/EchoSight.git
cd EchoSight
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Environment Setup (Pre-Configured!)
This repository already comes pre-configured with a working [`.env`](file:///c:/Anime/Visually_impared/.env) file:
```env
GEMINI_API_KEY=AQ.Ab8RN6JL_O1bDdxS27bTE_IboNVou7j1YhKQ7O4cjUbNqOU3wg
PORT=5000
```
> **Note**: If you ever want to use your own free key in the future, get one at [Google AI Studio](https://aistudio.google.com/app/apikey) and paste it into `.env` or directly inside the app's Settings drawer.

#### Step 4: Start the App
```bash
npm run dev
```

Both the backend and frontend will start simultaneously:
```
[SERVER] [EchoSight Server] Running on http://localhost:5000
[SERVER] [EchoSight Server] Gemini API Key configured: true
[CLIENT] Local: http://localhost:5173/
[CLIENT] Network: http://192.168.x.x:5173/
```

#### Step 5: Open in Your Browser
Visit:
👉 **[http://localhost:5173](http://localhost:5173)**

When prompted by the browser, click **"Allow"** for Camera and Microphone access.

---

## 📱 How to Run on a Mobile Phone (Over Local Wi-Fi)

1. Make sure your phone and laptop are connected to the **same Wi-Fi network**.
2. Run `npm run dev` on your laptop.
3. Look for the **Network URL** printed in your terminal (e.g., `http://192.168.0.119:5173`).
4. Type that URL into Chrome or Safari on your phone.
5. Tap the browser menu and select **"Add to Home Screen"** or **"Install App"** to install it as a standalone PWA!

---

## 🎮 How to Use EchoSight

1. **Double-Tap Anywhere**:
   - Double-tap any point on the screen (no need to look for buttons).
   - You will hear a pleasant rising chime and feel a haptic pulse indicating it is listening.
2. **Ask Your Question**:
   - Speak naturally:
     - *"Is there a chair in front of me?"*
     - *"What obstacles are in my walking path?"*
     - *"Read the text on the paper in front of me."*
     - *"What color is this shirt?"*
3. **Instant Audio Answer**:
   - In ~1.5 seconds, the AI speaks the answer clearly out loud with spatial guidance (e.g., *"There is a wooden chair about three feet directly ahead of you"*).
4. **Keyboard Shortcut**:
   - If using a laptop keyboard, press <kbd>Spacebar</kbd> or <kbd>Enter</kbd> anytime to start voice input.
5. **High-Contrast Vision Mode**:
   - Click the 🎛️ **Settings** icon to enable **High Contrast Mode** (vivid electric yellow text on pure black background, WCAG AAA compliant).
6. **Simulated Camera Mode**:
   - If testing on a desktop without a webcam, toggle **"Simulated Camera Feed"** in Settings to test against a simulated living room scene.

---

## 🛠️ Project Structure

```
├── .env                  # Environment variables with Gemini API Key
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore file (excludes node_modules/ and dist/)
├── package.json          # Scripts, dependencies, and metadata
├── vite.config.js        # Vite frontend tooling & API proxy configuration
├── render.yaml           # 1-Click Render Web Service blueprint
├── index.html            # PWA entry point with Google Fonts & Meta tags
├── public/
│   ├── manifest.webmanifest # PWA install manifest
│   ├── sw.js             # Service Worker for offline caching
│   ├── icon-192.svg      # PWA App Icon (192px)
│   └── icon-512.svg      # PWA App Icon (512px)
├── server/
│   └── index.js          # Express backend (Gemini Flash multimodal endpoint)
└── src/
    ├── main.jsx          # React DOM root
    ├── App.jsx           # Main orchestrator (Camera, Voice, Audio, Haptics)
    ├── index.css         # Modern glassmorphism design system & WCAG tokens
    ├── components/
    │   ├── CameraView.jsx       # Native HTML5 video feed, torch & radar HUD
    │   ├── AudioVisualizer.jsx  # Animated equalizer wave bars
    │   ├── SettingsModal.jsx    # Voice rate, contrast, API key & camera simulation
    │   ├── HistoryModal.jsx     # Query history & "Replay Audio" feature
    │   └── HelpModal.jsx        # Accessible walkthrough guide
    └── utils/
        ├── audioFeedback.js     # Web Audio API offline earcon synthesis
        ├── camera.js            # getUserMedia, torch, and canvas frame capture
        ├── geminiClient.js      # Backend & direct client API handlers
        └── speech.js            # Web Speech API recognition & synthesis
```

---

## 🌐 Deploy to Render Web Service (Hackman X Sponsor Track)

This project includes [`render.yaml`](file:///c:/Anime/Visually_impared/render.yaml) for 1-click cloud deployment:

1. Push this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New > Blueprint**.
3. Connect your repository.
4. Set the `GEMINI_API_KEY` environment variable in the Render dashboard.
5. Render builds the React static bundle and starts the Node.js server automatically!

---

## ❓ Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **"Microphone not allowed"** | Click the lock/tune icon in your browser address bar and set Microphone to **Allow**, then refresh. |
| **"Camera not allowed"** | Enable camera permissions in your browser or toggle **Simulated Camera Feed** in Settings. |
| **Speech recognition not working** | Use **Google Chrome** or **Microsoft Edge**, which have full native support for Web Speech API. |
| **Port 5000 in use** | Change `PORT=5001` in your `.env` file and restart `npm run dev`. |

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
