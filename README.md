# FunWattle Size Words Demo — Team ALMOND

This repository contains Team ALMOND's Sprint 1 frontend demo for the FunWattle Size Words learning unit.

## Project Overview

The project is a child-facing speech and language learning prototype for FunWattle.  
The current MVP focuses on one Size Words learning unit: **Big, Small and Everything in Between!**

The child starts from a simple learning unit card, enters Activity 1, interacts with Kool the Koala, and then reaches a demo report view.

## Sprint 1 Demo Scope

The current Sprint 1 demo includes:

- Home / Size Words unit entry screen
- Activity 1 visual interaction screen
- Kool the Koala dialogue and speech bubble/subtitle presentation
- Scaffold states for child support during the activity
- Mock child response / SpeechAttempt structure
- Session state foundation for Activity 1
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
Mock child response
↓
Activity complete
↓
Demo Report
↓
Parent / Therapist view
↓
Back Home
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

## Current Limitations

This is a Sprint 1 demo baseline, not the final product.

Current limitations:

- Production speech-to-text is not fully implemented yet.
- Tier scoring is currently prepared as a demo/mock path.
- Only Activity 1 is available as a demo flow.
- Reward checkpoints will be completed in later sprints.
- The final full-unit report will be completed in later sprints.
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
