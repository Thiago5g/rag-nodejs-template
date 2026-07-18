# Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- AWS CLI configured with appropriate credentials
- kubectl configured for the target cluster
- Node.js 20+ for running build scripts

## Environment Setup

1. Copy the environment template:
   ```
   cp .env.example .env
   ```

2. Configure the required variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `REDIS_URL`: Redis connection for queue processing
   - `STRIPE_SECRET_KEY`: Payment processing credentials
   - `JWT_SECRET`: Token signing key (min 32 characters)

## Local Development

Run all services locally with Docker Compose:

```
docker compose up -d
```

This starts PostgreSQL, Redis, and all application services with hot reload enabled.

## Production Deployment

### Build Phase
```
npm run build
docker build -t app:latest .
```

### Deploy Phase
```
kubectl apply -f k8s/
kubectl rollout status deployment/api
```

### Health Verification
After deployment, verify all health endpoints respond:
- GET /health — returns 200 with service status
- GET /ready — returns 200 only when all dependencies are connected

## Rollback Procedure

If issues are detected after deployment:
```
kubectl rollout undo deployment/api
```

The previous version will be restored within 30 seconds.
