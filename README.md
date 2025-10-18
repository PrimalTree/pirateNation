Live Score Poller — Worker Queue Model

Overview

- Replaces cron-based polling with a worker-queue model.
- Each match is a job with its own schedule, retries, and backoff.
- Workers run with configurable concurrency; jobs are de-duplicated by key.
- Demonstrates dynamic re-enqueue until a match finishes.

Why a queue over cron

- Fine-grained control: schedule per match, not batch sweeps.
- Backpressure-aware: respect concurrency and avoid stampedes.
- Resilient: retries with exponential backoff and jitter.
- Idempotent: job keys prevent overlapping duplicate work.

Quick Start

- Requires Python 3.9+
- Run: `python -m src.app`

What it does

- Seeds a few mock matches and starts polling each on its own cadence.
- Simulates score updates until matches complete, then stops polling them.

Project Structure

- `src/queue.py` — Minimal async worker-queue with retries, delay, dedupe, concurrency.
- `src/poller.py` — Live score poller that uses a provider and storage.
- `src/providers/base.py` — Provider interface.
- `src/providers/mock.py` — Mock provider returning deterministic evolving scores.
- `src/storage.py` — In-memory store for match states.
- `src/app.py` — Entry point: wires queue, poller, producer, and runs the loop.

Notes

- Networking is mocked; swap `MockLiveScoreProvider` with a real provider.
- The queue is in-memory; for production, replace with Redis/SQS and a proper worker.
