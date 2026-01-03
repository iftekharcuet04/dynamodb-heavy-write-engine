# High-Throughput DynamoDB Integration Service

## Project Overview

This service is a production-ready Node.js implementation designed to solve the challenges of ingesting massive datasets into Amazon DynamoDB. It focuses on handling the physical limitations of distributed databases, such as partition throttling, payload limits, and network latency.

```js
dynamodb-heavy-write/
├── src/
│   ├── dbClient.js          (AWS SDK Setup)
│   ├── dbService.js         (The Retry & Manager Logic)
│   ├── user-db-service.js   (Business logic & Schema mapping)
│   └── index.js             (Express Server)
├── routes/
│   └── userRoutes.js        (The 202 Accepted Route)
├── docker-compose.yml       (Local DynamoDB)
├── createTable.js           (Table Schema Setup)
└── README.md                (The documentation we wrote)

```

## System Architecture

### 1. Data Access Layer (`dbService.js`)

A table-agnostic engine that abstracts the AWS SDK v3 complexities.

- **Batch Optimization:** Utilizes `BatchWriteCommand` to group 25 items per request, reducing network overhead by 96%.
- **Recursive Retry Engine:** Implements a self-healing loop for `UnprocessedItems`. If DynamoDB returns a partial success due to throughput limits, the service automatically re-queues only the failed items.
- **Resilience:** Uses Exponential Backoff with Jitter ($delay = 2^{attempt} \times 50ms + jitter$) to prevent collision during retries.

### 2. Service Orchestration (`user-db-service.js`)

Handles business logic and data preparation.

- **Single Table Design:** Implements a Partition Key (PK) and Sort Key (SK) pattern, allowing for polymorphic data structures within a single table.
- **Data Transformation:** Standardizes raw input into schema-compliant items before ingestion.

### 3. API Design (Asynchronous Job Pattern)

Designed to handle long-running migrations without blocking the application.

- **Non-Blocking I/O:** The controller validates the payload and immediately returns an `HTTP 202 Accepted` response.
- **Background Processing:** The heavy write manager executes the ingestion in the background, allowing the API to remain responsive to other users.

---

## Heavy Write Strategy

### Bounded Concurrency

To protect the Node.js event loop and local network sockets, the system implements a concurrency limit. It processes 5 batches (125 items total) in parallel. This ensures high throughput while preventing "Socket Hang Up" errors or memory exhaustion.

### Edge Case Management: 400KB Limit (progressing)

DynamoDB has a strict 400KB limit per item.

- **Pre-Validation:** The service calculates the byte size of each item before transmission using `Buffer.byteLength`.
- **Proactive Filtering:** Any item exceeding 400KB is caught and logged as an error in the final report, preventing a `ValidationException` from failing an entire batch.
- **Payload Safety:** By capping batches at 25 items, the system stays safely below the 16MB total batch size limit (Max $25 \times 400KB = 10MB$).

---

## Reporting and Observability

The system utilizes `Promise.allSettled` to track the outcome of every batch. At the end of a "Heavy Write" operation, it generates a comprehensive report:

- **Total Items:** The original count of the ingestion request.
- **Succeeded:** Total items successfully persisted.
- **Failed Batches:** A count of batches that failed after 8 retry attempts.
- **Error Logs:** Detailed reasons for any permanent failures (e.g., Validation Errors).

---

## How to Run

### Infrastructure

Start the local DynamoDB instance using Docker:

```bash
docker-compose up -d

```

### Run Migration

Trigger the heavy-write migration via the API:

```bash
curl -X POST http://localhost:3000/api/users/migrate

```

### View Progress

Monitor the background logs for chunking and retry events:

```bash
docker logs -f [container_id]

```

### Create Table

inside project run

```bash

node createTable.js Users

```
