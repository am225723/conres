#!/bin/bash
echo "🧪 Testing Session Creation API"
echo "================================"

# Test 1: Check if API endpoint exists
echo "Test 1: Checking API endpoint..."
curl -I https://conres.vercel.app/api/create-session

echo -e "\nTest 2: Testing POST request..."
curl -X POST https://conres.vercel.app/api/create-session \
  -H "Content-Type: application/json" \
  -d '{"user1_id": "test1", "user2_id": "test2"}' \
  -v

echo -e "\n✅ Tests completed"
