#!/bin/bash
# Corre las nightly E2E local (dev Supabase, dev build)
# Equivalente al workflow e2e-nightly.yml de GitHub Actions

set -e
cd "$(dirname "$0")/.."

echo "🚀 Starting local dev server..."
export $(cat .env.test | xargs)

# Build y serve en background
npx vite build --mode development 2>/dev/null
npx vite preview --port 5173 &
SERVER_PID=$!

echo "⏳ Waiting for server..."
sleep 3

echo "🎭 Running E2E tests (chromium + webkit)..."
npx playwright test --project=chromium --project=webkit --reporter=html

RESULT=$?
kill $SERVER_PID 2>/dev/null

if [ $RESULT -eq 0 ]; then
  echo "✅ All E2E tests passed!"
else
  echo "❌ E2E tests failed. Opening report..."
  npx playwright show-report
fi

exit $RESULT
