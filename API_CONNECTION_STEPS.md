# GBC App – API Connection Guide

This guide documents the current API key, required headers, request/response bodies, and step‑by‑step instructions to integrate the real‑time API used in the app.

---

## Current API configuration

- Base URL: https://jsonplaceholder.typicode.com
- WebSocket URL: wss://socketio-api-server.herokuapp.com
- API Key: gbc_api_key_2024_secure_token_12345

Source of truth: services/api.ts (getConfig / constructor)

---

## Standard HTTP headers

Include these headers on write requests. For GET you typically only need Accept.

- Content-Type: application/json
- X-API-Key: gbc_api_key_2024_secure_token_12345
- Authorization: Bearer gbc_api_key_2024_secure_token_12345
- X-API-Version: 1.0

Note: The app supports both X-API-Key and Authorization headers for compatibility.

---

## Endpoints used by the app

1) Fetch orders (demo data)
- Method: GET
- URL: /posts
- Example cURL:

curl -X GET \
  "https://jsonplaceholder.typicode.com/posts" \
  -H "Accept: application/json"

Response: Array of post objects (used to mock orders in the UI).

2) Create order (demo)
- Method: POST
- URL: /posts
- Headers:
  - Content-Type: application/json
  - X-API-Key: gbc_api_key_2024_secure_token_12345
- Body example:

{
  "order": {
    "id": "temp_123",
    "orderNumber": "ORD-1723456789-1",
    "items": [
      { "id": 1, "name": "Tea", "quantity": 2, "price": 1.5 }
    ],
    "total": 3.0,
    "status": "New",
    "timestamp": "2025-01-01T12:00:00.000Z",
    "apiSource": true,
    "realTime": true
  }
}

Example cURL:

curl -X POST \
  "https://jsonplaceholder.typicode.com/posts" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: gbc_api_key_2024_secure_token_12345" \
  -d '{
    "order": {
      "id": "temp_123",
      "orderNumber": "ORD-1723456789-1",
      "items": [{"id":1,"name":"Tea","quantity":2,"price":1.5}],
      "total": 3.0,
      "status": "New",
      "timestamp": "2025-01-01T12:00:00.000Z",
      "apiSource": true,
      "realTime": true
    }
  }'

3) Update order status (demo)
- Method: PUT
- URL: /:id (example: /1)
- Headers: Content-Type, X-API-Key
- Body example:

{
  "data": {
    "status": "Completed",
    "updatedAt": "2025-01-01T12:05:00.000Z"
  }
}

Example cURL:

curl -X PUT \
  "https://jsonplaceholder.typicode.com/1" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: gbc_api_key_2024_secure_token_12345" \
  -d '{
    "data": { "status": "Completed", "updatedAt": "2025-01-01T12:05:00.000Z" }
  }'

4) Send notification (demo)
- Method: POST
- URL: /
- Headers: Content-Type, X-API-Key
- Body example:

{
  "notification": {
    "title": "Order Ready",
    "message": "Your order is ready for pickup",
    "timestamp": "2025-01-01T12:10:00.000Z",
    "data": {}
  }
}

Example cURL:

curl -X POST \
  "https://jsonplaceholder.typicode.com" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: gbc_api_key_2024_secure_token_12345" \
  -d '{
    "notification": { "title": "Order Ready", "message": "Your order is ready for pickup", "timestamp": "2025-01-01T12:10:00.000Z", "data": {} }
  }'

---

## WebSocket (real-time)

The codebase contains a WebSocket path used by realTimeApi and a placeholder Socket.IO URL in services/api.ts. In Expo Go, Socket.IO is disabled and real-time is handled via HTTP polling and WebSocket where available.

- Connect URL: wss://socketio-api-server.herokuapp.com
- Query params (if used): userId, apiKey

---

## Implementation notes

- All examples above mirror the shapes constructed in services/api.ts.
- For production, replace the base URL and move the API key to secure configuration.
- To test locally, you can run the cURL commands above and verify 200 responses.

---

## Where this is used in code

- services/api.ts: config, getOrders, createOrder, updateOrderStatus, sendNotification, makeApiRequest
- services/realTimeApi.ts: additional HTTP polling to simulate real-time updates


