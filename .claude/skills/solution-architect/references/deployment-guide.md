# Deployment Strategy Guide

## Decision Tree

```
Start here →

Is this an MVP or proof-of-concept?
├── YES → Budget tight?
│         ├── YES → [Option 1] Vercel + Supabase (free tier)
│         └── NO  → [Option 2] Railway or Render
└── NO  → Team size?
          ├── Solo / 1–2 devs → [Option 3] VPS (Hetzner / DigitalOcean)
          ├── Small team (3–10) → Need multi-region?
          │                       ├── YES → [Option 5] Fly.io
          │                       └── NO  → [Option 4] DigitalOcean App Platform
          └── Growing company (10+) → Ops team available?
                                       ├── YES → [Option 6] AWS / GCP managed
                                       └── NO  → [Option 7] Cloudflare (edge-first)
```

---

## Option 1: Vercel + Supabase (Serverless, Free Tier)

### Best for
MVP, side projects, early-stage SaaS, hackathons

### Architecture
```
Browser → Vercel Edge Network → Next.js Functions (serverless)
                                       ↓
                              Supabase (PostgreSQL + Auth + Storage + Realtime)
```

### What you get
- **Vercel**: Next.js hosting, edge CDN, preview deployments per PR, serverless functions
- **Supabase**: Managed PostgreSQL, row-level security, built-in auth, S3-compatible storage, realtime subscriptions

### Cost estimate
| Tier | Vercel | Supabase | Total |
|------|--------|----------|-------|
| Free | $0 (100GB bandwidth) | $0 (500MB DB, 1GB storage) | $0 |
| Pro | $20/mo | $25/mo | ~$45/mo |
| Scale | $20+ usage | $25+ usage | $100–300/mo |

### Pros
- Zero DevOps — deploy with `git push`
- Global edge CDN included
- PR preview URLs built-in
- Supabase dashboard for quick DB inspection

### Cons
- Cold starts on serverless functions (50–500ms)
- Vendor lock-in (Vercel's edge runtime has limits)
- Supabase free tier pauses after 1 week inactivity
- Not ideal for long-running background jobs

### CI/CD
```yaml
# .github/workflows/deploy.yml
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```
Vercel also auto-deploys on push — GitHub Action is optional.

---

## Option 2: Railway or Render (Managed PaaS)

### Best for
Early-to-mid stage products, indie developers, teams without DevOps

### Architecture
```
GitHub Push → CI/CD (built-in) → Container Deploy
                                         ↓
                               App Service + PostgreSQL
                               (same platform, private network)
```

### Railway vs Render comparison

| Feature | Railway | Render |
|---------|---------|--------|
| Free tier | $5 credit/mo | Yes (sleeps after 15min) |
| Pricing model | Usage-based | Instance-based |
| PostgreSQL | ✓ Managed | ✓ Managed |
| Redis | ✓ | ✓ |
| Cron jobs | ✓ | ✓ |
| Docker support | ✓ | ✓ |
| Private networking | ✓ | ✓ |
| Multi-region | Limited | US/EU/SG |
| DX / Dashboard | Excellent | Good |

### Cost estimate
| Scale | Railway | Render |
|-------|---------|--------|
| Hobby | $5–20/mo | $7–25/mo |
| Production | $20–100/mo | $25–100/mo |

### Pros
- One-click PostgreSQL + Redis provisioning
- Automatic deploys from GitHub
- Private network between services (no egress cost)
- Built-in metrics and logs

### Cons
- Less control than VPS / K8s
- Can get expensive at scale vs self-managed
- Railway usage-based pricing can surprise

### Typical setup
```
Services:
  web    → Node/Python/Go app (auto-scale horizontal)
  worker → Background job processor
  db     → PostgreSQL (managed)
  cache  → Redis
```

---

## Option 3: Self-Hosted VPS (Hetzner / DigitalOcean / Linode)

### Best for
Cost-conscious teams, full control needed, steady traffic

### Recommended providers

| Provider | Entry VPS | Best for |
|----------|-----------|----------|
| Hetzner | €4.51/mo (2 vCPU, 4GB) | Europe-based, best price/perf |
| DigitalOcean | $6/mo (1 vCPU, 1GB) | Familiarity, good docs |
| Vultr | $6/mo | Global PoPs |
| Linode (Akamai) | $5/mo | Stable, good support |

### Architecture
```
GitHub Actions → Docker build → Push to Registry → SSH deploy

Internet → Nginx (reverse proxy + SSL) → Docker containers
                                               ├── App (Node/Go/Python)
                                               ├── PostgreSQL
                                               └── Redis
```

### Docker Compose production setup
```yaml
# docker-compose.prod.yml
services:
  app:
    image: ghcr.io/yourorg/app:${TAG}
    restart: always
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/appdb
    depends_on:
      - db
      - cache

  db:
    image: postgres:16
    restart: always
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

  cache:
    image: redis:7-alpine
    restart: always

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - certbot-certs:/etc/letsencrypt

volumes:
  pgdata:
  certbot-certs:
```

### Cost estimate
| Setup | Monthly Cost |
|-------|-------------|
| Single VPS (Hetzner CX22) | ~€5/mo |
| VPS + backups | ~€7/mo |
| 2-node HA + load balancer | ~€20/mo |
| Full prod stack (app + DB server) | ~€30–60/mo |

### Pros
- Best price per compute unit
- Full control over every layer
- No cold starts
- Easy to migrate away

### Cons
- You own uptime, backups, security patches
- Manual SSL renewal (use Certbot/Caddy to automate)
- No auto-scaling without extra work (Nomad/K3s)

### Checklist
- [ ] Firewall: allow only 22, 80, 443
- [ ] Fail2ban for SSH brute force protection
- [ ] Automated daily DB backups (pg_dump → S3/R2)
- [ ] Certbot or Caddy for auto-SSL
- [ ] Monitoring: Uptime Kuma (self-hosted) or Better Uptime

---

## Option 4: DigitalOcean App Platform

### Best for
Small teams that want PaaS simplicity with DO's ecosystem

### Architecture
```
GitHub → App Platform (auto-build) → Managed App Instances
                                             ↓
                                    DO Managed PostgreSQL
                                    DO Managed Redis
                                    DO Spaces (S3-compatible)
```

### Cost estimate
| Component | Cost |
|-----------|------|
| Basic app (512MB) | $5/mo |
| Pro app (1GB) | $12/mo |
| Managed PostgreSQL (1GB) | $15/mo |
| Managed Redis | $15/mo |
| **Typical production stack** | **~$50–80/mo** |

### Pros
- Simple dashboard, easy to reason about
- Managed DB with automated backups
- VPC networking between services
- Built-in CDN for static assets

### Cons
- Pricier than Hetzner VPS for same compute
- Less flexible than raw K8s
- No built-in PR preview environments

---

## Option 5: Fly.io (Multi-Region, Edge-Native)

### Best for
Global products, latency-sensitive apps, teams wanting K8s power without K8s complexity

### Architecture
```
User (any region) → Fly Anycast → Nearest Fly region
                                        ↓
                              App VM (Firecracker microVM)
                                        ↓
                              Fly Postgres (primary + replicas)
                              OR Tigris (S3-compatible, global)
```

### Regions
30+ regions including US, EU, Asia, Australia, South America. Requests automatically route to nearest healthy instance.

### Cost estimate
| Component | Cost |
|-----------|------|
| Shared VM (256MB) | ~$2/mo |
| Shared VM (1GB) | ~$7/mo |
| Fly Postgres (1GB) | ~$5/mo |
| **Typical stack (2 regions)** | **~$30–60/mo** |

### Key features
- `fly deploy` — deploy from local Dockerfile
- `fly scale count 3 --region ams,sjc,nrt` — instant multi-region
- Persistent volumes per VM
- Private networking (WireGuard mesh between VMs)
- Built-in metrics (Prometheus-compatible)

### Pros
- Best DX for globally-distributed apps
- True multi-region with read replicas
- Fast cold starts (~50ms) vs serverless
- Fly Machines API for dynamic scaling

### Cons
- Postgres HA requires manual setup (or use Supabase + Fly for app)
- Smaller community than AWS/DO
- Cost can climb with many regions

---

## Option 6: AWS / GCP Managed Services

### Best for
Growing companies, enterprises, teams with DevOps, compliance requirements

### AWS Reference Architecture
```
Route 53 (DNS) → CloudFront (CDN) → ALB (Load Balancer)
                                           ↓
                               ECS Fargate (containers)
                               or EKS (Kubernetes)
                                           ↓
                         ┌─────────────────────────────┐
                         │  RDS PostgreSQL (Multi-AZ)  │
                         │  ElastiCache Redis           │
                         │  S3 (storage)                │
                         │  SQS (queues)                │
                         │  SES (email)                 │
                         └─────────────────────────────┘

Observability:
  CloudWatch (logs + metrics)
  X-Ray (tracing)
  OR: Datadog / Grafana Cloud
```

### GCP Reference Architecture
```
Cloud DNS → Cloud CDN → Cloud Load Balancing
                               ↓
                    Cloud Run (serverless containers)
                    or GKE (Kubernetes)
                               ↓
                    Cloud SQL (PostgreSQL)
                    Memorystore (Redis)
                    Cloud Storage
                    Cloud Pub/Sub (queues)
```

### Cost estimate (AWS, small production)
| Component | Monthly |
|-----------|---------|
| ECS Fargate (2 tasks, 0.5 vCPU/1GB) | ~$30 |
| RDS PostgreSQL (db.t3.medium, Multi-AZ) | ~$100 |
| ElastiCache (cache.t3.micro) | ~$20 |
| ALB | ~$20 |
| CloudFront + S3 | ~$10 |
| **Total** | **~$180–250/mo** |

### Pros
- Highest reliability and compliance (SOC2, HIPAA, PCI available)
- Infinite scale
- Rich ecosystem (200+ services)
- Enterprise support contracts

### Cons
- Complex pricing (egress costs catch teams off guard)
- Steep learning curve
- Requires dedicated DevOps or Platform team
- Easy to over-provision and overspend

### Cost control tips
- Use Savings Plans / Reserved Instances for predictable workloads (up to 60% off)
- Set billing alerts at $50, $100, $200
- Use AWS Cost Explorer weekly
- Prefer Fargate Spot for non-critical workers

---

## Option 7: Cloudflare (Edge-First)

### Best for
Global latency requirements, DDoS protection, API-at-the-edge, JAMstack

### Architecture
```
User → Cloudflare Edge (300+ PoPs)
              ├── Workers (serverless JS/WASM at edge)
              ├── Pages (static + SSR hosting)
              ├── R2 (S3-compatible, zero egress)
              ├── KV (key-value at edge)
              ├── D1 (SQLite at edge, distributed)
              └── Durable Objects (stateful edge)
```

### Cost estimate
| Tier | Workers | Pages | R2 | Total |
|------|---------|-------|----|-------|
| Free | 100k req/day | Unlimited | 10GB | $0 |
| Paid ($5/mo) | 10M req/mo | Unlimited | 10GB + $0.015/GB | ~$5–30/mo |

### Pros
- Fastest global response times (P50 < 20ms worldwide)
- Best-in-class DDoS mitigation included
- R2 has zero egress fees (vs AWS S3 $0.09/GB)
- Workers run in V8 isolates (no cold starts)

### Cons
- Workers runtime has limits (no Node.js APIs, 128MB memory, 50ms CPU per request)
- D1 is SQLite — not suitable for heavy relational workloads
- Complex state management at edge

### Best paired with
- Supabase or PlanetScale for heavy DB needs
- Cloudflare as CDN/WAF in front of any Option 1–6

---

## CI/CD Pipeline Templates

### GitHub Actions — Standard Web App
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker image
        run: |
          docker build -t ghcr.io/${{ github.repository }}:${{ github.sha }} .
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/${{ github.repository }}:${{ github.sha }}
      - name: Deploy to server
        run: |
          ssh ${{ secrets.DEPLOY_HOST }} "
            docker pull ghcr.io/${{ github.repository }}:${{ github.sha }} &&
            docker-compose up -d
          "
```

### Environment strategy
```
branch: feature/* → preview environment (Vercel/Railway)
branch: main      → staging environment (auto-deploy)
tag:    v*        → production (manual approval gate)
```

---

## Monitoring Stack Recommendations

### Lightweight (free / low cost)
| Need | Tool | Cost |
|------|------|------|
| Uptime | Uptime Kuma (self-host) or Better Uptime | Free |
| Error tracking | Sentry | Free (5k errors/mo) |
| Logs | Logtail / Axiom | Free tier |
| Metrics | Grafana Cloud | Free tier |

### Production (paid)
| Need | Tool | Cost |
|------|------|------|
| APM + logs + traces | Datadog | $15–31/host/mo |
| Error tracking | Sentry Team | $26/mo |
| Uptime + alerting | PagerDuty | $21/user/mo |
| Status page | Statuspage | $29/mo |

### Self-hosted observability stack
```
Grafana + Prometheus + Loki + Tempo
  ↑ metrics      ↑ logs    ↑ traces
  
Deploy via: docker-compose or grafana/lgtm Docker image
Cost: ~€10/mo extra VPS
```

---

## Backup Strategy

### PostgreSQL backup checklist
```bash
# Daily pg_dump to S3/R2 (add to cron)
pg_dump $DATABASE_URL | gzip | aws s3 cp - s3://backups/$(date +%Y-%m-%d).sql.gz

# Retention: 7 daily, 4 weekly, 3 monthly
# Test restores monthly
# RTO target: < 1 hour
# RPO target: < 24 hours (daily) or < 5 min (WAL streaming)
```

### WAL streaming (near-zero RPO)
- AWS RDS: enabled by default with Multi-AZ
- Supabase: Point-in-Time Recovery available on Pro
- Self-hosted: use pgBackRest or Barman

---

## Summary Comparison Table

| Option | Best for | Monthly cost | Ops effort | Scale ceiling |
|--------|----------|-------------|------------|---------------|
| Vercel + Supabase | MVP / SaaS | $0–100 | Minimal | High |
| Railway / Render | Early product | $20–150 | Low | Medium |
| Self-hosted VPS | Cost control | $5–60 | Medium | Medium |
| DO App Platform | Simple PaaS | $50–200 | Low | Medium |
| Fly.io | Global / latency | $30–200 | Low-Medium | High |
| AWS / GCP | Enterprise | $150–1000+ | High | Unlimited |
| Cloudflare | Edge / CDN | $0–50 | Low | Very High |
