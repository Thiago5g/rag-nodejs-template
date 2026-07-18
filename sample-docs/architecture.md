# System Architecture

## Overview

The platform follows a microservices architecture deployed on Kubernetes. Each service is independently deployable and communicates through asynchronous message queues.

## Core Services

### API Gateway
The API Gateway handles authentication, rate limiting, and request routing. It validates JWT tokens and forwards requests to the appropriate backend service.

### User Service
Manages user accounts, profiles, and preferences. Stores data in PostgreSQL with row-level security for multi-tenant isolation.

### Payment Service
Processes payments through Stripe integration. Implements idempotency keys to prevent duplicate charges. Failed payments are retried with exponential backoff.

### Notification Service
Sends emails, push notifications, and SMS. Uses a priority queue to ensure critical notifications (password reset, payment confirmation) are delivered first.

## Infrastructure

All services run on AWS ECS with auto-scaling based on CPU and memory metrics. PostgreSQL is hosted on RDS with read replicas for query-heavy workloads.

## Monitoring

We use structured JSON logging with correlation IDs across all services. Metrics are collected via Prometheus and visualized in Grafana dashboards.
