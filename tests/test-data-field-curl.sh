#!/bin/bash

# Simple test for data field functionality using curl
# Assumes server is already running on localhost:3001

SERVER_URL="http://localhost:3001"

echo "🧪 Simple Data Field Test with curl"
echo "Make sure the server is running on localhost:3001"
echo ""

# Test data
TEST_DATA='{
  "x": 100,
  "y": 150,
  "title": "Test Node with Data",
  "radius": 25,
  "data": {
    "type": "test",
    "description": "This is test data for verification",
    "metadata": {
      "created": "2025-01-01",
      "importance": "high"
    },
    "count": 42,
    "active": true
  },
  "edges": []
}'

# Clear existing data
echo "🧹 Clearing existing data..."
curl -s -X DELETE "$SERVER_URL/data" > /dev/null
if [ $? -eq 0 ]; then
    echo "✓ Data cleared successfully"
else
    echo "❌ Failed to clear data"
    exit 1
fi

# Create node with data
echo "📝 Creating node with data..."
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$SERVER_URL/particle/test-node-with-data" \
    -H "Content-Type: application/json" \
    -d "$TEST_DATA")

HTTP_CODE="${RESPONSE: -3}"
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Node created successfully"
else
    echo "❌ Failed to create node (HTTP $HTTP_CODE)"
    exit 1
fi

# Retrieve and verify data
echo "🔍 Retrieving data..."
RETRIEVED_DATA=$(curl -s "$SERVER_URL/data")
if [ $? -eq 0 ]; then
    echo "✓ Data retrieved successfully"
    echo "Retrieved data:"
    echo "$RETRIEVED_DATA" | python3 -m json.tool 2>/dev/null || echo "$RETRIEVED_DATA"
else
    echo "❌ Failed to retrieve data"
    exit 1
fi

# Check if the node has data field
echo ""
echo "🔍 Checking if node has data field..."
HAS_DATA=$(echo "$RETRIEVED_DATA" | grep -o '"data"' | wc -l)
if [ "$HAS_DATA" -gt 0 ]; then
    echo "✓ Node has data field"
else
    echo "❌ Node missing data field"
    exit 1
fi

# Test retrieving specific node
echo "🔍 Testing specific node retrieval..."
SPECIFIC_NODE=$(curl -s "$SERVER_URL/particle/test-node-with-data")
if [ $? -eq 0 ]; then
    echo "✓ Specific node retrieved successfully"
    echo "Specific node data:"
    echo "$SPECIFIC_NODE" | python3 -m json.tool 2>/dev/null || echo "$SPECIFIC_NODE"
else
    echo "❌ Failed to retrieve specific node"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Data field functionality is working correctly."
