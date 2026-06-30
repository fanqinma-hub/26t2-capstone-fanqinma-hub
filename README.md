# FunWattle Size Words Demo — Team ALMOND

This repository contains Team ALMOND's Sprint 1 frontend demo for the FunWattle Size Words learning unit.

## Project Overview

The project is a child-facing speech and language learning prototype for FunWattle.  
The current MVP focuses on one Size Words learning unit: **Big, Small and Everything in Between!**

The child starts from a simple learning unit card, enters Activity 1, interacts with Kool the Koala, and then reaches a demo report view.

## Sprint 1 Demo Scope

The current Sprint 1 demo includes:

- Home / Size Words unit entry screen
- Activity 1 visual interaction screen with its multi-prompt kitchen-scene conversation
- Kool the Koala dialogue and speech bubble/subtitle presentation
- Silence scaffold states (3 / 6 / 10s gentle cue, reprompt, tap-to-help) for child support during the activity
- Press-and-hold voice answer via the browser Web Speech API (Chrome), with deterministic Tier 1/2/3 scoring on the transcript
- `SpeechAttempt` (transcript, detected size words, tier) written into the in-memory session
- Coin reward popup at the activity checkpoint
- Parent and therapist demo report views
- Basic app navigation flow between Home, Activity 1, and Demo Report

## Current Demo Flow

```text
Home
↓
Start Activity
↓
Activity 1
↓
Kool prompt / scaffold states
↓
Press-and-hold voice answer (Web Speech STT → Tier 1/2/3)
↓
Coin reward → Activity complete
↓
Demo Report
↓
Parent / Therapist view
↓
Back Home
```

## Run with Docker

1. (Optional) Open `docker-compose.yml` and update your local IP address for the environment variable:

   ```yaml
   REACT_NATIVE_PACKAGER_HOSTNAME: 192.168.1.103 # Fill in your computer's local IP here
   ```

   *Note: If this is not set correctly, it will not affect your testing; you can still connect manually-> exp://<YOUR_COMPUTER_LAN_IP>:8081*

2. Start the development server:

   ```bash
   docker-compose up
   ```

## Run Locally

Install dependencies:

```bash
npm install
```

Run lint:

```bash
npm run lint
```

Start the Expo development server:

```bash
npx expo start -c
```

Press `w` in the terminal to open the web version.

For the voice demo, use **Chrome on the web**: press and hold the microphone to talk, then release. The browser will ask for microphone permission on first use. The Web Speech API is web-only, so the spoken-answer path is not available in the native (Expo Go) build.

## Current Limitations

This is a Sprint 1 demo baseline, not the final product.

Current limitations:

- The voice demo uses the browser Web Speech API and is best run in **Chrome on the web** (`w`). It is demo-grade, not production-grade or cross-browser/native hardened. The repo also ships `ISTTAdapter` mock/Azure adapters as the future/native path.
- Tier scoring runs deterministically on the captured transcript for Activity 1; thresholds and edge cases are still being tuned.
- Only Activity 1 is available as a demo flow.
- The polished parent/therapist report cards still use sample fixtures; the report surfaces the real captured session payload alongside them. Dynamic full-unit report generation comes in a later sprint.
- Session state is in-memory only; no persistence.
- No backend, login, database, or deployment is included in the MVP scope.

## Development Notes

The Sprint 1 goal is to provide a stable frontend baseline that can be extended by each role in later sprints.

The current implementation focuses on:

- Clear child-facing interaction
- A simple Size Words activity flow
- Reusable data and session-state structure
- Early report and reward direction
- Integration readiness for future STT, scoring, rewards, and full report generation

## Team

Team ALMOND  
COMP9900 26T2
