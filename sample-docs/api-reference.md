# API Reference

## Authentication

All endpoints except `/health` and `/ready` require a Bearer token in the Authorization header.

Tokens are obtained via `POST /auth/login` and expire after 24 hours.

## Endpoints

### POST /auth/login
Authenticate a user and receive a JWT token.

Request body:
- `email` (string, required): User's email address
- `password` (string, required): User's password

Response: `{ "token": "eyJ...", "expiresAt": "2025-01-01T00:00:00Z" }`

### GET /users/me
Get the authenticated user's profile.

Response: `{ "id": 1, "email": "user@example.com", "name": "John", "createdAt": "..." }`

### POST /payments
Create a new payment.

Request body:
- `amount` (number, required): Amount in cents
- `currency` (string, default: "usd"): ISO currency code
- `description` (string, optional): Payment description
- `idempotencyKey` (string, required): Unique key to prevent duplicates

Response: `{ "id": "pay_123", "status": "processing", "amount": 1000 }`

### GET /payments/:id
Get payment status by ID.

Response: `{ "id": "pay_123", "status": "completed", "amount": 1000, "paidAt": "..." }`

## Error Handling

All errors follow the format:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Human-readable description",
  "details": [{ "field": "email", "issue": "invalid format" }]
}
```

Status codes:
- 400: Validation error
- 401: Authentication required
- 403: Insufficient permissions
- 404: Resource not found
- 429: Rate limit exceeded
- 500: Internal server error

## Rate Limits

- Authentication endpoints: 5 requests per minute
- General API: 100 requests per minute
- File uploads: 10 requests per minute

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets
