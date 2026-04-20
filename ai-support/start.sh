#!/bin/bash
# ╔══════════════════════════════════════════╗
# ║  SupportAI - Start Script                ║
# ╚══════════════════════════════════════════╝

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        SupportAI - Startup               ║"
echo "╚══════════════════════════════════════════╝"

# Check .env exists
if [ ! -f "./backend/.env" ]; then
  echo "ERROR: backend/.env not found. Copy .env.example and add your OpenAI key."
  exit 1
fi

# Check OpenAI key is set
if grep -q "sk-your-openai-key-here" ./backend/.env; then
  echo ""
  echo "⚠️  WARNING: OpenAI API key not set!"
  echo "   Edit backend/.env and set OPENAI_API_KEY=sk-..."
  echo ""
fi

# Start backend
echo "Starting backend on :5000..."
cd backend && npm start &
BACKEND_PID=$!
cd ..
sleep 2

# Seed demo data
echo "Seeding demo data..."
cd backend && node src/utils/seed.js 2>/dev/null
cd ..

# Start frontend
echo "Starting frontend on :5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!

sleep 3

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Services Ready!                         ║"
echo "║                                          ║"
echo "║  Admin:  http://localhost:5174           ║"
echo "║  Chat:   http://localhost:5174/chat/demo-company"
echo "║  API:    http://localhost:5000/health    ║"
echo "║                                          ║"
echo "║  Demo Login:                             ║"
echo "║  Email:    admin@demo.com               ║"
echo "║  Password: password123                  ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Press Ctrl+C to stop all servers"

wait $BACKEND_PID $FRONTEND_PID
