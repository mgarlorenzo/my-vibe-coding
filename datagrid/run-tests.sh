#!/bin/bash

set -e

echo "=========================================="
echo "Employee Manager - Full Test Suite"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    # Kill any remaining processes on the ports
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
}

trap cleanup EXIT

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "\n${YELLOW}Step 1: Running Backend Tests${NC}"
echo "----------------------------------------"
cd backend
./mvnw test -q
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Backend tests passed!${NC}"
else
    echo -e "${RED}Backend tests failed!${NC}"
    exit 1
fi
cd ..

echo -e "\n${YELLOW}Step 2: Installing Frontend Dependencies${NC}"
echo "----------------------------------------"
cd frontend
npm install --silent
cd ..

echo -e "\n${YELLOW}Step 3: Running Frontend Tests${NC}"
echo "----------------------------------------"
cd frontend
npm test
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Frontend tests passed!${NC}"
else
    echo -e "${RED}Frontend tests failed!${NC}"
    exit 1
fi
cd ..

echo -e "\n${YELLOW}Step 4: Starting Backend for E2E Tests${NC}"
echo "----------------------------------------"
cd backend
./mvnw spring-boot:run -q &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in {1..60}; do
    if curl -s http://localhost:8080/graphiql > /dev/null 2>&1; then
        echo -e "${GREEN}Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}Backend failed to start!${NC}"
        exit 1
    fi
    sleep 2
done

echo -e "\n${YELLOW}Step 5: Starting Frontend for E2E Tests${NC}"
echo "----------------------------------------"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
echo "Waiting for frontend to start..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}Frontend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Frontend failed to start!${NC}"
        exit 1
    fi
    sleep 2
done

echo -e "\n${YELLOW}Step 6: Installing E2E Dependencies${NC}"
echo "----------------------------------------"
cd e2e
npm install --silent
npx playwright install chromium --with-deps
cd ..

echo -e "\n${YELLOW}Step 7: Running E2E Tests${NC}"
echo "----------------------------------------"
cd e2e
npx playwright test
E2E_RESULT=$?
cd ..

if [ $E2E_RESULT -eq 0 ]; then
    echo -e "\n${GREEN}=========================================="
    echo "All tests passed successfully!"
    echo "==========================================${NC}"
else
    echo -e "\n${RED}=========================================="
    echo "E2E tests failed!"
    echo "==========================================${NC}"
    exit 1
fi
