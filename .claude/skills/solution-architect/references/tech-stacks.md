# Technology Stack Reference Templates

## 1. Modern Web Full-Stack (Next.js + React)

### Overview
Best for: SaaS products, content platforms, e-commerce, dashboards
Team fit: JavaScript/TypeScript-first teams

### Stack

```
Frontend:
  Framework:     Next.js 14+ (App Router)
  UI Library:    React 19
  Styling:       Tailwind CSS v4 or CSS Modules
  State:         Zustand (global) + React Query (server state)
  Forms:         React Hook Form + Zod
  Components:    shadcn/ui or Radix UI primitives
  Testing:       Vitest + React Testing Library + Playwright (E2E)

Backend (API Routes or separate service):
  Runtime:       Node.js 20 LTS
  Framework:     Next.js API Routes / Hono / Fastify
  ORM:           Prisma or Drizzle
  Auth:          NextAuth.js / Clerk / Auth.js
  Validation:    Zod

Database:
  Primary:       PostgreSQL (Supabase / Neon / RDS)
  Cache:         Redis (Upstash / ElastiCache)
  Search:        Postgres full-text / Algolia / Typesense

Infrastructure:
  Hosting:       Vercel (frontend) + Railway/Render (backend)
  CDN:           Vercel Edge / Cloudflare
  Storage:       S3-compatible (Cloudflare R2 / AWS S3)
  Email:         Resend / SendGrid
  Monitoring:    Sentry + Vercel Analytics

CI/CD:
  Pipeline:      GitHub Actions
  Preview:       Vercel Preview Deployments
```

### When to use
- Need SEO or server rendering
- Small-to-medium team (1–10 engineers)
- Fast iteration is priority
- Budget: $0–$200/mo (Vercel free tier scales well)

### When NOT to use
- Heavy compute (use Go/Rust service instead)
- Complex microservices (adds unnecessary complexity)
- Pure mobile app

---

## 2. Traditional Enterprise Java Stack (Spring Boot)

### Overview
Best for: Enterprise software, financial systems, large teams, regulated industries
Team fit: Java/Kotlin teams; existing Spring experience

### Stack

```
Framework:      Spring Boot 3.x
Language:       Java 21 LTS or Kotlin 1.9
Build:          Gradle (preferred) or Maven

Web Layer:
  API:          Spring MVC (REST) or Spring WebFlux (reactive)
  Docs:         Springdoc OpenAPI (Swagger UI)
  Validation:   Jakarta Bean Validation

Security:
  Auth:         Spring Security + JWT or OAuth2 Resource Server
  Secrets:      Spring Cloud Config / HashiCorp Vault

Data Access Layer — 7 Options:
  1. Spring Data JPA + Hibernate
     Use when: Standard CRUD, team knows JPA, complex object graph
     Pros: Rich ORM, lazy loading, second-level cache
     Cons: N+1 problem, magic queries, heavy for simple reads

  2. Spring Data JPA + Hibernate + QueryDSL
     Use when: Needs type-safe dynamic queries on top of JPA
     Pros: Compile-time safety, composable predicates
     Cons: Extra codegen step

  3. Spring JDBC + NamedParameterJdbcTemplate
     Use when: Full SQL control, performance-critical reads, reporting
     Pros: Lightweight, no ORM magic, predictable SQL
     Cons: Manual mapping, verbose

  4. MyBatis
     Use when: Team prefers SQL-first, complex joins, legacy DB schema
     Pros: SQL in XML/annotations, fine-grained control
     Cons: Boilerplate mapper interfaces

  5. jOOQ
     Use when: Typesafe SQL, code-gen from schema, complex queries
     Pros: Compile-time SQL validation, fluent DSL, schema-first
     Cons: License cost for non-open DBs, learning curve

  6. Spring Data R2DBC (Reactive)
     Use when: High-concurrency, non-blocking I/O (with WebFlux)
     Pros: Reactive pipeline end-to-end
     Cons: Less mature, no lazy loading

  7. Spring Data MongoDB
     Use when: Document storage, flexible schema, rapid prototyping
     Pros: Schema flexibility, embedded documents
     Cons: No joins, eventual consistency tradeoffs

Database:
  Relational:   PostgreSQL / MySQL / Oracle
  Migrations:   Flyway (preferred) or Liquibase
  Cache:        Redis via Spring Cache abstraction
  Search:       Elasticsearch via Spring Data Elasticsearch

Messaging:
  Async:        Apache Kafka / RabbitMQ via Spring Messaging
  Scheduling:   Spring Batch / Quartz

Testing:
  Unit:         JUnit 5 + Mockito
  Integration:  Spring Boot Test + Testcontainers
  API:          RestAssured

Infrastructure:
  Container:    Docker + Docker Compose
  Orchestration: Kubernetes (EKS/GKE) or AWS ECS
  Service Mesh: (optional) Istio / Linkerd for microservices
  Observability: Micrometer + Prometheus + Grafana; ELK stack
```

### When to use
- Enterprise / regulated environment (banking, healthcare, government)
- Large team (10+ engineers), existing Java expertise
- Long project lifecycle (5+ years)
- Complex domain with rich business logic

### When NOT to use
- Startup / MVP (too heavy)
- Pure frontend team
- Budget < $100/mo

---

## 3. High-Performance Backend (Go)

### Overview
Best for: APIs serving high RPS, CLI tools, infrastructure services, microservices
Team fit: Backend engineers comfortable with static typing; willing to learn Go

### Stack

```
Language:       Go 1.22+
Framework:      Gin / Echo / Fiber / Chi (all are fine; Chi is stdlib-aligned)
  Minimal:      net/http + gorilla/mux for maximum control

API:
  REST:         Standard + oapi-codegen (OpenAPI → Go stubs)
  gRPC:         protobuf + grpc-go (inter-service)
  GraphQL:      gqlgen

Data Access:
  ORM:          GORM (quick) or sqlc (codegen from SQL, recommended)
  Migrations:   golang-migrate / goose
  DB Driver:    pgx (PostgreSQL), database/sql

Auth:
  JWT:          golang-jwt/jwt
  OAuth2:       golang.org/x/oauth2

Caching:        go-redis
Messaging:      confluent-kafka-go / amqp091-go (RabbitMQ)

Config:         viper + godotenv
Logging:        zap (structured, fast) or slog (stdlib, Go 1.21+)
Tracing:        OpenTelemetry Go SDK

Testing:
  Unit:         testing (stdlib) + testify
  Mocks:        mockery (codegen)
  Integration:  testcontainers-go

Infrastructure:
  Container:    Docker (multi-stage builds → tiny images ~10MB)
  Orchestration: Kubernetes or Fly.io
  CI:           GitHub Actions
```

### Performance profile
- Handles 10k–100k RPS on modest hardware
- ~10MB Docker image vs ~300MB for JVM
- Low memory footprint, great for serverless/edge

### When to use
- High-throughput API (payments, feeds, auth service)
- Infrastructure tooling
- Replacing a slow Python/Node service under load

### When NOT to use
- Rapid UI prototyping
- Data science / ML pipelines (Python wins here)
- Team has zero Go experience and timeline is tight

---

## 4. High-Performance Backend (Rust)

### Overview
Best for: Systems programming, near-zero latency services, WebAssembly, security-critical code
Team fit: Experienced engineers; expect 2–4x longer initial dev time vs Go

### Stack

```
Language:       Rust (stable)
Web Framework:  Axum (recommended) / Actix-web / Warp
Async Runtime:  Tokio

Data Access:
  ORM:          SeaORM / Diesel
  Query Builder: sqlx (async, compile-time checked queries — recommended)
  Migrations:   sqlx-cli / refinery

Serialization:  serde + serde_json
Validation:     validator
Auth:           jsonwebtoken
Config:         config / dotenvy
Logging:        tracing + tracing-subscriber
Error handling: thiserror + anyhow

Testing:        built-in #[test] + tokio::test (async)

Infrastructure:
  Container:    Docker (multi-stage → ~5MB images)
  Deploy:       Fly.io / Shuttle.rs (Rust-native PaaS) / K8s
```

### When to use
- Absolute performance requirements (trading, real-time, game servers)
- Memory safety without GC (embedded, WASM)
- Security-critical code (cryptography, parsers)

### When NOT to use
- Most web applications (Go or Node is sufficient and faster to write)
- Team without Rust experience + tight deadline

---

## 5. Mobile Cross-Platform (React Native)

### Overview
Best for: Consumer mobile apps where web team wants to ship mobile fast
Team fit: JavaScript/TypeScript teams; existing React knowledge

### Stack

```
Framework:      React Native 0.73+ (New Architecture enabled)
Toolchain:      Expo SDK 50+ (recommended) or bare React Native
Language:       TypeScript

Navigation:     React Navigation v6 / Expo Router (file-based)
State:          Zustand + React Query (TanStack Query)
UI Components:  React Native Paper / NativeWind (Tailwind for RN)
Forms:          React Hook Form + Zod
Animations:     Reanimated 3 + Gesture Handler

Storage:
  Local:        MMKV (fast) or AsyncStorage
  Secure:       expo-secure-store
  Offline DB:   WatermelonDB / SQLite (expo-sqlite)

Auth:           expo-auth-session / Clerk
Push Notifs:    Expo Notifications / Firebase Cloud Messaging
Analytics:      Expo Analytics / Mixpanel / Amplitude

Testing:
  Unit:         Jest + React Native Testing Library
  E2E:          Maestro or Detox

CI/CD:          EAS Build + EAS Submit (Expo Application Services)
OTA Updates:    EAS Update (skip app store for JS-only changes)
```

### When to use
- Need iOS + Android from one codebase
- Web team shipping mobile (shared business logic)
- Moderate performance requirements (not games)
- Budget: EAS free tier covers small apps

### When NOT to use
- Games or graphics-heavy apps (use Unity/Unreal)
- Requires deep native APIs not yet bridged
- Team has strong native iOS/Android expertise

---

## 6. Mobile Cross-Platform (Flutter)

### Overview
Best for: Pixel-perfect custom UI, desktop+mobile+web from one codebase
Team fit: Teams willing to learn Dart; designers wanting full control

### Stack

```
Framework:      Flutter 3.x (Dart)
Language:       Dart 3

State Management:
  Simple:       Riverpod (recommended) / Bloc
  Complex:      Bloc + Freezed (immutable state)

Navigation:     GoRouter (declarative, deep-link ready)
Networking:     Dio + Retrofit (codegen from OpenAPI)
Serialization:  json_serializable + freezed

Local Storage:
  Key-value:    Hive / SharedPreferences
  Database:     Drift (SQLite ORM) / Isar

Auth:           firebase_auth / supabase_flutter
Push Notifs:    firebase_messaging / flutter_local_notifications
Analytics:      Firebase Analytics / Mixpanel

Testing:
  Unit:         flutter_test (built-in)
  Widget:       flutter_test
  Integration:  integration_test + Patrol

CI/CD:          Fastlane + GitHub Actions / Codemagic
```

### When to use
- Custom design system (full render control, no native widgets)
- Target: iOS + Android + Web + Desktop from one codebase
- Team can invest in learning Dart

### When NOT to use
- Strong web SEO requirement (Flutter web has SEO limits)
- Very tight timeline with no Flutter experience
- Simple app where React Native + Expo is faster

---

## Quick Selection Matrix

| Need | Recommended Stack |
|------|------------------|
| SaaS web app, small team | Next.js + PostgreSQL + Vercel |
| Enterprise Java system | Spring Boot + JPA/jOOQ + PostgreSQL |
| High-RPS API service | Go + sqlc + PostgreSQL |
| Systems / zero-latency | Rust + sqlx + PostgreSQL |
| Mobile (JS team) | React Native + Expo |
| Mobile (custom UI) | Flutter |
| ML / data pipeline | Python + FastAPI + SQLAlchemy |
| Serverless / edge | Next.js + Cloudflare Workers |
