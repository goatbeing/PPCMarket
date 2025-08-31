# docs.siwe.xyz llms.txt

> Offering resources and guidance for integrating Sign-In with Ethereum, enhancing user control over digital identities in web applications, while promoting best practices and supporting community involvement within the Ethereum ecosystem.

> Updated at: 21:35 08/27/25

# ⭐ Deployment Guide

This guide covers deploying the SIWE OIDC Provider in production environments. Choose from multiple deployment options based on your infrastructure needs.

## Deployment Options

The SIWE OIDC Provider can be deployed in two primary modes:

1. **[Cloudflare Workers](#cloudflare-workers-deployment)** - Serverless, globally distributed
2. **[Standalone Binary](#standalone-binary-deployment)** - Self-hosted with full control

## Prerequisites

### General Requirements

-   Domain name with HTTPS support
-   Basic knowledge of OIDC flows
-   Client applications that support OpenID Connect

### For Standalone Deployment

-   **Redis** database instance
-   **Docker** or container runtime (recommended)
-   **Reverse proxy** (nginx, Apache, or cloud load balancer)

### For Cloudflare Workers

-   **Cloudflare account** with Workers enabled
-   **Wrangler CLI** installed locally

## Cloudflare Workers Deployment

Cloudflare Workers provide a serverless, globally distributed deployment option.

### 1. Setup Repository

```bash
# Clone the SIWE OIDC repository
git clone https://github.com/signinwithethereum/siwe-oidc
cd siwe-oidc
```

### 2. Install Wrangler CLI

```bash
# Install Wrangler globally
npm install -g @cloudflare/wrangler

# Or install locally in project
npm install --save-dev @cloudflare/wrangler
```

### 3. Authenticate with Cloudflare

```bash
# Login to Cloudflare
wrangler auth

# Verify authentication
wrangler whoami
```

### 4. Create KV Namespace

KV storage is used for session and client data:

```bash
# Create production KV namespace
wrangler kv:namespace create "SIWE_OIDC_KV"

# Create preview KV namespace for staging
wrangler kv:namespace create "SIWE_OIDC_KV" --preview
```

### 5. Configure wrangler.toml

Update `wrangler.toml` with your account details:

```toml
name = "siwe-oidc-provider"
type = "webpack"
account_id = "your-account-id"
workers_dev = true
route = ""
zone_id = ""

[build]
command = "npm run build"

[build.upload]
format = "service-worker"

[[kv_namespaces]]
binding = "SIWE_OIDC_KV"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"

[vars]
SIWEOIDC_BASE_URL = "https://your-worker.your-subdomain.workers.dev"
```

### 6. Deploy to Cloudflare

```bash
# Deploy to production
wrangler publish

# Deploy to preview environment
wrangler publish --env preview
```

### 7. Configure Custom Domain (Optional)

```bash
# Add custom domain
wrangler route add "oidc.yourdomain.com/*" your-zone-id
```

## Standalone Binary Deployment

For self-hosted environments, deploy as a standalone service with Redis.

### 1. Using Docker (Recommended)

#### Quick Start

```bash
# Run with docker-compose (includes Redis)
curl -O https://raw.githubusercontent.com/spruceid/siwe-oidc/main/docker-compose.yml
docker-compose up -d
```

#### Manual Docker Deployment

```bash
# Start Redis container
docker run -d --name redis \
  -p 6379:6379 \
  redis:7-alpine

# Run SIWE OIDC Provider
docker run -d --name siwe-oidc \
  -p 8000:8000 \
  -e SIWEOIDC_ADDRESS="0.0.0.0" \
  -e SIWEOIDC_PORT="8000" \
  -e SIWEOIDC_REDIS_URL="redis://redis:6379" \
  -e SIWEOIDC_BASE_URL="https://oidc.yourdomain.com" \
  --link redis \
  ghcr.io/spruceid/siwe_oidc:latest
```

### 2. Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
    redis:
        image: redis:7-alpine
        restart: unless-stopped
        volumes:
            - redis_data:/data
        healthcheck:
            test: ['CMD', 'redis-cli', 'ping']
            interval: 10s
            timeout: 5s
            retries: 3

    siwe-oidc:
        image: ghcr.io/spruceid/siwe_oidc:latest
        restart: unless-stopped
        ports:
            - '8000:8000'
        environment:
            - SIWEOIDC_ADDRESS=0.0.0.0
            - SIWEOIDC_PORT=8000
            - SIWEOIDC_REDIS_URL=redis://redis:6379
            - SIWEOIDC_BASE_URL=https://oidc.yourdomain.com
            - SIWEOIDC_RSA_PEM=${SIWEOIDC_RSA_PEM:-}
        depends_on:
            - redis
        healthcheck:
            test:
                [
                    'CMD',
                    'curl',
                    '-f',
                    'http://localhost:8000/.well-known/openid-configuration',
                ]
            interval: 30s
            timeout: 10s
            retries: 3

volumes:
    redis_data:
```

Deploy with:

```bash
docker-compose up -d
```

### 3. Binary Installation

For direct binary installation:

```bash
# Download latest release
wget https://github.com/spruceid/siwe-oidc/releases/latest/download/siwe-oidc-linux-x86_64
chmod +x siwe-oidc-linux-x86_64

# Run with environment variables
SIWEOIDC_REDIS_URL=redis://localhost:6379 \
SIWEOIDC_BASE_URL=https://oidc.yourdomain.com \
./siwe-oidc-linux-x86_64
```

## Configuration Options

### Environment Variables

| Variable             | Description                     | Default                  | Required |
| -------------------- | ------------------------------- | ------------------------ | -------- |
| `SIWEOIDC_ADDRESS`   | IP address to bind to           | `127.0.0.1`              | No       |
| `SIWEOIDC_PORT`      | Port to listen on               | `8000`                   | No       |
| `SIWEOIDC_REDIS_URL` | Redis connection URL            | `redis://localhost:6379` | Yes      |
| `SIWEOIDC_BASE_URL`  | Public-facing base URL          | None                     | Yes      |
| `SIWEOIDC_RSA_PEM`   | RSA private key for JWT signing | Auto-generated           | No       |

### Advanced Configuration

#### Custom Signing Key

Generate and use a custom RSA key for JWT signing:

```bash
# Generate RSA private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem

# Use in deployment
export SIWEOIDC_RSA_PEM=$(cat private.pem)
```

#### Redis Configuration

For production, configure Redis with persistence and security:

```bash
# Redis with persistence and password
docker run -d --name redis \
  -p 6379:6379 \
  -v redis_data:/data \
  -e REDIS_PASSWORD=your-secure-password \
  redis:7-alpine \
  redis-server --requirepass your-secure-password --appendonly yes
```

## Reverse Proxy Setup

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name oidc.yourdomain.com;

    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers for OIDC
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    }
}
```

### Apache Configuration

```apache
<VirtualHost *:443>
    ServerName oidc.yourdomain.com

    SSLEngine on
    SSLCertificateFile /path/to/your/cert.pem
    SSLCertificateKeyFile /path/to/your/key.pem

    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass / http://localhost:8000/
    ProxyPassReverse / http://localhost:8000/

    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
</VirtualHost>
```

## Local Development

### Development Setup

```bash
# Clone repository
git clone https://github.com/spruceid/siwe-oidc
cd siwe-oidc

# Start development environment with Docker Compose
docker-compose -f docker-compose.dev.yml up

# Edit /etc/hosts for local testing
echo "127.0.0.1 oidc.localhost" >> /etc/hosts
```

### Testing the Deployment

```bash
# Test OIDC configuration endpoint
curl https://oidc.yourdomain.com/.well-known/openid-configuration

# Register a test client
curl -X POST https://oidc.yourdomain.com/register \
  -H 'Content-Type: application/json' \
  -d '{
    "redirect_uris": ["https://yourapp.com/callback"],
    "client_name": "Test Client",
    "token_endpoint_auth_method": "client_secret_basic"
  }'
```

## Health Monitoring

### Health Check Endpoints

-   **Status**: `GET /.well-known/openid-configuration` - Returns 200 if service is healthy
-   **Metrics**: Custom monitoring endpoints can be added via environment variables

### Monitoring Setup

```yaml
# docker-compose monitoring addition
services:
    prometheus:
        image: prom/prometheus
        ports:
            - '9090:9090'
        volumes:
            - ./prometheus.yml:/etc/prometheus/prometheus.yml

    grafana:
        image: grafana/grafana
        ports:
            - '3000:3000'
        environment:
            - GF_SECURITY_ADMIN_PASSWORD=admin
```

## Security Considerations

### Production Checklist

-   [ ] **HTTPS Only**: Ensure all traffic uses HTTPS
-   [ ] **Secure Redis**: Use authentication and encryption
-   [ ] **Custom Keys**: Generate and securely store RSA signing keys
-   [ ] **Domain Validation**: Verify redirect URI domains
-   [ ] **Rate Limiting**: Implement request rate limiting
-   [ ] **Monitoring**: Set up logging and alerting
-   [ ] **Backups**: Regular Redis data backups
-   [ ] **Updates**: Keep container images updated

### Important Notes

⚠️ **Frontend-API Domain Requirement**: The frontend application must be served from the same subdomain as the OIDC API endpoint for security reasons.

✅ **Valid**: `app.yourdomain.com` → `oidc.yourdomain.com`  
❌ **Invalid**: `yourapp.com` → `oidc.anotherdomain.com`

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure proper CORS headers in reverse proxy
2. **Redis Connection**: Verify Redis is running and accessible
3. **Domain Issues**: Check that frontend and API share subdomain
4. **SSL Issues**: Verify certificate is valid and properly configured

### Debug Mode

Enable debug logging:

```bash
# Add debug environment variable
RUST_LOG=debug \
SIWEOIDC_REDIS_URL=redis://localhost:6379 \
./siwe-oidc
```

---

import FullWidthLink from '@site/src/components/full-width-link'

# OIDC Provider

## Rationale

Many organizations want to consolidate the Sign in with Ethereum workflow to a single identity service (Identity Provider or IdP) that could be used to access all their federated services (Relying Parties or RPs) using [OpenID Connect](https://openid.net/connect/) to forward the user's session. This reduces overhead and mitigates security risks by consolidating authentication to one protected site instead of several, especially in complex IT systems that have many services for their users to access.

## Getting Started

The OIDC Provider implementation of Sign in with Ethereum can be found here:

<FullWidthLink
	href='https://github.com/signinwithethereum/siwe-oidc'
	logo='/img/github.svg'
	text='signinwithethereum/siwe-oidc'
	themeAware={true}
/>
<br />

Currently, two runtime modes are supported: (1) a standalone executable (using
Axum and Redis) and (2) a WASM module within a Cloudflare Worker. Both are built
from the same codebase, specializing at build time. Compilation with a `cargo` target
of `wasm32` will build for Cloudflare Worker deployments.

---

import FullWidthLink from '@site/src/components/full-width-link'

# 🦀 Rust

The Rust implementation of Sign in with Ethereum can be found here:

<FullWidthLink
	href='https://github.com/signinwithethereum/siwe-rs'
	logo='/img/github.svg'
	text='signinwithethereum/siwe-rs'
	themeAware={true}
/>

## Getting Started

<FullWidthLink
	href='https://crates.io/crates/siwe'
	logo='/img/cargo.png'
	text='Sign in with Ethereum on crates.io'
/>

For detailed implementation and usage instructions, refer to the GitHub repository and crates.io documentation.

---

# Library Implementations

SIWE provides official libraries in multiple programming languages, making it easy to integrate Sign in with Ethereum authentication into applications regardless of your tech stack. Each library implements the [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) specification and provides both message creation and signature verification capabilities.

## Supported Languages

### [TypeScript/JavaScript](typescript)

The original and most feature-complete SIWE implementation.

-   **Package**: `siwe` on npm
-   **Platforms**: Node.js, Browser, React Native
-   **Features**: Complete [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) support, TypeScript definitions, extensive testing
-   **Best for**: Web applications, React/Vue/Angular apps, Node.js backends

### [Rust](rust)

High-performance implementation for Rust applications.

-   **Package**: `siwe` on crates.io
-   **Platforms**: Server applications, CLI tools, embedded systems
-   **Features**: Memory-safe, fast verification, serde serialization
-   **Best for**: High-performance backends, blockchain infrastructure, CLI tools

### [Python](python)

Pythonic implementation for Python developers.

-   **Package**: `siwe` on PyPI
-   **Platforms**: Django, Flask, FastAPI applications
-   **Features**: Async/await support, dataclass integration, type hints
-   **Best for**: Django/Flask apps, data analysis tools, ML/AI applications

### [Ruby](ruby)

Ruby gem with Rails integration support.

-   **Package**: `siwe` gem on RubyGems
-   **Platforms**: Rails applications, Sinatra, standalone Ruby scripts
-   **Features**: ActiveSupport integration, Rails middleware, comprehensive docs
-   **Best for**: Ruby on Rails applications, API backends

### [Go](go)

Go implementation for Go developers.

-   **Package**: `github.com/signinwithethereum/siwe-go`
-   **Platforms**: Go web servers, microservices, CLI applications
-   **Features**: Standard library compatibility, efficient verification, minimal dependencies
-   **Best for**: Microservices, Go web applications, infrastructure tools

### [Elixir](elixir)

Functional implementation for Elixir/Phoenix applications.

-   **Package**: `siwe` on Hex
-   **Platforms**: Phoenix applications, LiveView, OTP applications
-   **Features**: GenServer integration, Phoenix plugs, fault tolerance
-   **Best for**: Phoenix web apps, real-time applications, distributed systems

## Quick Start Comparison

Here's how to get started with each library:

### JavaScript/TypeScript

```bash
npm install siwe ethers
```

```javascript
import { SiweMessage } from 'siwe'

const message = new SiweMessage({
	domain: 'example.com',
	address: '0x...',
	uri: 'https://example.com',
	version: '1',
	chainId: 1,
})
```

### Rust

```toml
[dependencies]
siwe = "0.6"
```

```rust
use siwe::Message;

let message = Message {
    domain: "example.com".parse()?,
    address: "0x...".parse()?,
    uri: "https://example.com".parse()?,
    version: siwe::Version::V1,
    chain_id: 1,
    // ...
};
```

### Python

```bash
pip install siwe
```

```python
from siwe import SiweMessage

message = SiweMessage(
    domain="example.com",
    address="0x...",
    uri="https://example.com",
    version="1",
    chain_id=1,
)
```

### Ruby

```bash
gem install siwe
```

```ruby
require 'siwe'

message = Siwe::Message.new(
  domain: 'example.com',
  address: '0x...',
  uri: 'https://example.com',
  version: '1',
  chain_id: 1
)
```

### Go

```bash
go get github.com/signinwithethereum/siwe-go
```

```go
import "github.com/signinwithethereum/siwe-go"

message := siwe.Message{
    Domain:  "example.com",
    Address: "0x...",
    URI:     "https://example.com",
    Version: "1",
    ChainID: 1,
}
```

### Elixir

```elixir
# In mix.exs
{:siwe, "~> 0.3"}
```

```elixir
message = %Siwe.Message{
  domain: "example.com",
  address: "0x...",
  uri: "https://example.com",
  version: "1",
  chain_id: 1
}
```

## Feature Comparison

| Feature                | TypeScript     | Rust       | Python        | Ruby           | Go        | Elixir  |
| ---------------------- | -------------- | ---------- | ------------- | -------------- | --------- | ------- |
| Message Creation       | ✅             | ✅         | ✅            | ✅             | ✅        | ✅      |
| Signature Verification | ✅             | ✅         | ✅            | ✅             | ✅        | ✅      |
| Nonce Generation       | ✅             | ✅         | ✅            | ✅             | ✅        | ✅      |
| EIP-191 Support        | ✅             | ✅         | ✅            | ✅             | ✅        | ✅      |
| EIP-712 Support        | ✅             | ✅         | ✅            | ✅             | ✅        | ✅      |
| EIP-1271 Support       | ✅             | ✅         | ✅            | ✅             | ✅        | ✅      |
| Async/Await            | ✅             | ✅         | ✅            | ❌             | ✅        | ✅      |
| Type Safety            | ✅             | ✅         | ✅            | ❌             | ✅        | ✅      |
| Framework Integration  | React, Express | Axum, Warp | Django, Flask | Rails, Sinatra | Gin, Echo | Phoenix |
| Browser Support        | ✅             | ❌         | ❌            | ❌             | ❌        | ❌      |

## Choosing the Right Library

### For Web Applications

-   **Frontend**: Use TypeScript/JavaScript for React, Vue, Angular, or vanilla JS
-   **Backend**: Choose based on your existing backend language and framework

### For Mobile Applications

-   **React Native**: TypeScript/JavaScript
-   **Native iOS/Android**: Use appropriate native HTTP libraries with any backend

### For Enterprise Applications

-   **Java/.NET**: Use HTTP clients to communicate with SIWE backend services
-   **Enterprise backends**: Go, Rust, or TypeScript for high performance

### For Rapid Prototyping

-   **TypeScript/JavaScript**: Fastest to get started, works everywhere
-   **Python**: Great for data-driven applications and ML integration
-   **Ruby**: Excellent for Rails developers

## Installation Guides

Each library has specific installation and setup instructions:

-   **[TypeScript/JavaScript Setup](typescript#installation)**: npm, yarn, browser CDN
-   **[Rust Setup](rust)**: Cargo dependencies and features
-   **[Python Setup](python)**: pip, conda, virtual environments
-   **[Ruby Setup](ruby)**: gem, bundler, Rails integration
-   **[Go Setup](go)**: go mod, dependency management
-   **[Elixir Setup](elixir)**: mix deps, Phoenix integration

## Migration Guides

If you need to switch between libraries or upgrade versions:

-   [TypeScript v1 to v2 Migration](typescript#migration-guide)
-   [Cross-language Migration Tips](#cross-language-migration)
-   Version Compatibility Matrix (see below)

## Cross-Language Migration

When moving between different SIWE library implementations:

### Message Format Compatibility

All libraries generate identical [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) compliant messages, ensuring signatures created in one language can be verified in any other.

### Configuration Mapping

```javascript
// JavaScript
const message = new SiweMessage({
	domain: 'example.com',
	address: '0x...',
	statement: 'Sign in to our app',
	uri: 'https://example.com',
	version: '1',
	chainId: 1,
	nonce: 'abc123',
	issuedAt: '2023-10-31T16:25:24Z',
})
```

```python
# Python equivalent
message = SiweMessage(
    domain="example.com",
    address="0x...",
    statement="Sign in to our app",
    uri="https://example.com",
    version="1",
    chain_id=1,
    nonce="abc123",
    issued_at="2023-10-31T16:25:24Z"
)
```

### Error Handling Patterns

Each library follows language-specific error handling conventions but provides equivalent functionality:

-   **JavaScript/TypeScript**: Promise-based with try/catch
-   **Rust**: Result types with match expressions
-   **Python**: Exception-based with try/except
-   **Ruby**: Exception-based with begin/rescue
-   **Go**: Error return values with if err != nil
-   **Elixir**: `{:ok, result} | {:error, reason}` tuples

## Community Libraries

Beyond official libraries, the community has created additional implementations:

-   **Java**: Community-maintained Spring Boot integration
-   **C#/.NET**: Community library for ASP.NET applications
-   **Swift**: iOS/macOS native implementation
-   **Kotlin**: Android-first implementation
-   **PHP**: Laravel and Symfony integrations

Visit our [GitHub repository](https://github.com/signinwithethereum/siwe) for links to community libraries.

## Version Compatibility

### Library Version Matrix

| Library | Current Version | EIP-4361 Spec | Node.js/Runtime | Notes |
|---------|----------------|---------------|-----------------|-------|
| TypeScript | 2.x | Full support | Node 16+ | Breaking changes from v1 |
| Rust | 0.6.x | Full support | N/A | Stable API |
| Python | 3.x | Full support | Python 3.7+ | Async support added |
| Ruby | 2.x | Full support | Ruby 2.7+ | Rails 6+ recommended |
| Go | 1.x | Full support | Go 1.18+ | Generics support |
| Elixir | 0.3.x | Full support | Elixir 1.12+ | Phoenix 1.6+ |

### Breaking Changes

When upgrading between major versions:

- **TypeScript v1 → v2**: Constructor API changes, see [migration guide](typescript/migrating-to-v2)
- **Python v2 → v3**: Async/await support, dataclass changes
- **Ruby v1 → v2**: Rails integration improvements

### Specification Compliance

All libraries implement:
- EIP-4361 (Sign In with Ethereum)
- EIP-191 (Signed Data Standard)
- EIP-1271 (Contract Signatures)
- RFC 3986 (URI Specification)
- RFC 3339 (Timestamp Format)

## Contributing

All SIWE libraries are open source and welcome contributions:

-   **Bug Reports**: Create issues on the respective GitHub repositories
-   **Feature Requests**: Discuss new features in GitHub Discussions
-   **Pull Requests**: Follow each repository's contributing guidelines
-   **Documentation**: Help improve library documentation and examples
-   **Testing**: Add test cases for edge cases and new features

## Support

Get help with SIWE libraries:

-   **Documentation**: Each library has comprehensive docs and examples
-   **GitHub Issues**: Repository-specific support for bugs and questions
-   **Discord**: Real-time help from the community
-   **Stack Overflow**: Tag questions with `sign-in-with-ethereum`
-   **Twitter**: Follow [@signinwithethereum](https://twitter.com/signinwithethereum) for updates

---

_Ready to implement SIWE in your application? Choose your language and dive into the detailed documentation for your selected library._

---

import FullWidthLink from '@site/src/components/full-width-link'

# 🍷 Elixir

The Elixir implementation of Sign in with Ethereum can be found here:

<FullWidthLink
	href='https://github.com/signinwithethereum/siwe-ex'
	logo='/img/github.svg'
	text='signinwithethereum/siwe-ex'
	themeAware={true}
/>

## Installation

Add the library to your `mix.exs` dependencies:

```elixir
def deps do
  [
    {:siwe, "~> 0.3"}
  ]
end
```

## Example Usage

To test the library, clone the repository and run:

```bash
$ mix deps.get
```

Create two files:

`message.txt`:

```
login.xyz wants you to sign in with your Ethereum account:
0xfA151B5453CE69ABf60f0dbdE71F6C9C5868800E

Sign in with Ethereum Example Statement

URI: https://login.xyz
Version: 1
Chain ID: 1
Nonce: ToTaLLyRanDOM
Issued At: 2021-12-17T00:38:39.834Z
```

`signature.txt`:

```
0x8d1327a1abbdf172875e5be41706c50fc3bede8af363b67aefbb543d6d082fb76a22057d7cb6d668ceba883f7d70ab7f1dc015b76b51d226af9d610fa20360ad1c
```

Then in `iex`:

```elixir
iex> {:ok, msg} = File.read("./message.txt")
iex> {:ok, sig} = File.read("./signature.txt")
iex> Siwe.parse_if_valid(String.trim(msg), String.trim(sig))
```

This will return a parsed SIWE message with details like address, chain ID, domain, and other metadata.

---

import FullWidthLink from '@site/src/components/full-width-link'

# 🧩 Ethereum Identity Kit

Ethereum Identity Kit is a library for building Ethereum identity applications. Full documentation can be found at:

<FullWidthLink 
	href='https://ethidentitykit.com'
	logo='/img/eik-logo.svg'
	text='Ethereum identity kit - Complete your dapp with the Ethereum identity stack.'
/>

## Installation

```bash
npm install @ethereum-identity-kit
```

---

# TypeScript Quickstart

## Goals

-   Run a Sign in with Ethereum example locally
-   Sign in using a preferred wallet

## Requirements

-   NodeJS version 14.0 or higher

## Setup and Running the Quickstart

### Clone the Repository

```bash
git clone https://github.com/signinwithethereum/siwe-notepad
```

### Install and Run

```bash
cd siwe-notepad
npm install
npm run dev
```

### Access the Example

-   Visit http://localhost:4361 (or the port allocated by npm)

## Example Walkthrough

1. Load the example in your web browser
2. Click on a wallet option to sign in with Ethereum
3. Enter some text
4. Save the text
5. Disconnect and reconnect to reload the saved text

## Additional Information

-   Full example available on [GitHub - signinwithethereum/siwe-notepad](https://github.com/signinwithethereum/siwe-notepad)

Note: This quickstart guide demonstrates core SIWE functionality using a simple notepad-style application.

---

# Migrating to SIWE TypeScript v2

## Overview

If you are using `siwe v1.1.6`, it is recommended to update to the latest version (`2.1.x`).

## Key Differences in v2.0

### Function Changes

The primary change is the replacement of the `validate(sig, provider)` function with a new `verify(VerifyParams, VerifyOpts)` method.

#### New Verification Parameters

```typescript
export interface VerifyParams {
  /** Signature of the message signed by the wallet */
  signature: string;

  /** RFC 4501 dns authority that is requesting the signing */
  domain?: string;

  /** Randomized token to prevent replay attacks, at least 8 alphanumeric characters */
  nonce?: string;

  /** ISO 8601 datetime string of the current time */
  time?: string;
}

export interface VerifyOpts {
  /** ethers provider to be used for EIP-1271 validation */
  provider?: providers.Provider;

  /** If the library should reject promises on errors, defaults to false */
  suppressExceptions?: boolean;
}
```

### Return Type Changes

The verification now returns a `SiweResponse` with a more detailed structure:

```typescript
export interface SiweResponse {
  /** Boolean representing if the message was verified successfully */
  success: boolean;

  /** If present and success is false, provides extra information on failure reason */
  error?: SiweError;

  /** Original message that was verified */
  data: SiweMessage;
}
```

### Additional Notes

- The new function makes it easier to automatically match fields like `domain`, `nonce`, and compare against current time.
- New error types have been introduced to provide more clarity on verification failures.

## Recommended Upgrade Path

1. Replace `validate()` calls with `verify()`
2. Update error handling to work with the new `SiweResponse` structure
3. Review and adapt to the new parameter and return type interfaces

For more detailed information, refer to the [SIWE TypeScript v2 release notes](https://blog.spruceid.com/sign-in-with-ethereum-typescript).

---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import FullWidthLink from '@site/src/components/full-width-link'

# 💎 Ruby

The Ruby implementation of Sign in with Ethereum can be found here:

<FullWidthLink
	href='https://github.com/signinwithethereum/siwe-rb'
	logo='/img/github.svg'
	text='signinwithethereum/siwe-rb'
	themeAware={true}
/>

## Installation

### Dependencies

<Tabs groupId='operating-systems'>
	<TabItem value='mac' label='macOS'>
		```bash
    brew install automake openssl libtool pkg-config gmp libffi
    ```
	</TabItem>
	<TabItem value='linux' label='Linux'>
		```bash
    sudo apt-get install build-essential automake pkg-config libtool \
    libffi-dev libssl-dev libgmp-dev python-dev
    ```
	</TabItem>
</Tabs>

Install the gem:

```bash
gem install siwe
```

## Usage

### Creating a SIWE Message

```ruby
require 'siwe'
require 'time'

# Only mandatory arguments
Siwe::Message.new("domain.example", "0x9D85ca56217D2bb651b00f15e694EB7E713637D4", "some.uri", "1")

# Complete SIWE message with default values
Siwe::Message.new("domain.example", "0x9D85ca56217D2bb651b00f15e694EB7E713637D4", "some.uri", "1", {
  issued_at: Time.now.utc.iso8601,
  statement: "Example statement for SIWE",
  nonce: Siwe::Util.generate_nonce,
  chain_id: "1",
  expiration_time: "",
  not_before: "",
  request_id: "",
  resources: []
})
```

### Parsing a SIWE Message

```ruby
# From EIP-4361 format
Siwe::Message.from_message "domain.example wants you to sign in with your Ethereum account:..."

# From JSON string
Siwe::Message.from_json_string "{\"domain\":\"domain.example\",\"address\":\"0x9D85ca56217D2bb651b00f15e694EB7E713637D4\",...}"
```

### Verifying and Authenticating a SIWE Message

```ruby
begin
  message.validate(signature) # returns true if valid, throws otherwise
rescue Siwe::ExpiredMessage
  # Handle expired message
rescue Siwe::InvalidSignature
  # Handle invalid signature
end
```

## Error Handling

The library provides specific exception types for different validation failures:

-   `Siwe::ExpiredMessage`: When the message has expired
-   `Siwe::InvalidSignature`: When the signature is invalid
-   Other validation errors as appropriate

---

# 🛤️ Rails

## Overview

Sign in with Ethereum (SIWE) provides authentication for Rails applications through multiple integration approaches. This documentation covers three primary methods of implementation:

### Requirements

-   Ruby version 2.7.0 or above
-   Rails framework
-   MetaMask wallet

### Gems for Integration

1. `siwe_rails`: Adds local sign-in routes
2. `omniauth-siwe`: Provides OmniAuth strategy for SIWE

## Integration Examples

### 1. Custom Controller Approach

-   Manually add endpoints to generate and verify SIWE messages
-   Handle session-based user logins

### 2. Rails Engine Approach

-   Use `siwe_rails` gem to configure authentication endpoints
-   Simplified setup and configuration

### 3. OmniAuth Integration

-   Utilize `omniauth-siwe` provider
-   Integrate with existing OmniAuth authentication flows

## Setup Steps

### Custom Controller Example

```bash
cd siwe-rails-examples/custom-controller
bundle install
bin/rails db:migrate RAILS_ENV=development
bundle exec rails server
```

### Rails Engine Example

```bash
cd siwe-rails-examples/rails-engine
bundle install
bin/rails db:migrate RAILS_ENV=development
bundle exec rails server
```

### OmniAuth Integration

1. Register as a client with OIDC provider
2. Update configuration with client credentials
3. Start Rails server

## Additional Considerations

-   Supports multiple authentication scenarios
-   Flexible integration options
-   Compatible with Ethereum wallets

## Recommended Resources

-   [Security Considerations](/security-considerations)

---

import FullWidthLink from '@site/src/components/full-width-link'

# 🐍 Python

The Python implementation of Sign in with Ethereum can be found here:

<FullWidthLink
	href='https://github.com/signinwithethereum/siwe-py'
	logo='/img/github.svg'
	text='signinwithethereum/siwe-py'
	themeAware={true}
/>

<br />

:::note

Sign in with Ethereum can be found on [pypi](https://pypi.org/project/siwe/)

:::

---

import FullWidthLink from '@site/src/components/full-width-link'

# ⌨️ TypeScript

The TypeScript implementation of Sign in with Ethereum can be found here:

<FullWidthLink
	href='https://github.com/signinwithethereum/siwe'
	logo='/img/github.svg'
	text='signinwithethereum/siwe'
	themeAware={true}
/>

## Getting Started

The TypeScript implementation is available on npm and provides comprehensive [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) support.

### Installation

You can install the Sign in with Ethereum library as an npm package.

### Additional Resources

-   [Quickstart Guide](/quickstart)
-   [Migrating to v2](/libraries/typescript/migrating-to-v2)
-   [TypeScript Quickstart](/libraries/typescript/typescript-quickstart)

### Supported Platforms

The library offers implementations for multiple languages and frameworks:

-   TypeScript
-   Rust
-   Elixir
-   Python
-   Ruby (including Rails)
-   Go

### Integrations

The library supports various integrations:

-   Discourse
-   NextAuth.js
-   Auth0

For detailed implementation instructions and examples, refer to the specific documentation sections in the sidebar.

## API Reference

### SiweMessage Class

The main class for creating and verifying SIWE messages.

#### Constructor

```typescript
new SiweMessage(params: SiweMessageParams)
```

**Parameters:**

| Parameter        | Type       | Required | Description                                                                               |
| ---------------- | ---------- | -------- | ----------------------------------------------------------------------------------------- |
| `domain`         | `string`   | ✅       | RFC 3986 authority requesting the signing                                                 |
| `address`        | `string`   | ✅       | Ethereum address (EIP-55 checksum format)                                                 |
| `uri`            | `string`   | ✅       | RFC 3986 URI referring to the resource                                                    |
| `version`        | `string`   | ✅       | Must be `"1"` for [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) compliance |
| `chainId`        | `number`   | ✅       | EIP-155 Chain ID                                                                          |
| `statement`      | `string`   | ❌       | Human-readable ASCII assertion                                                            |
| `nonce`          | `string`   | ❌       | Randomized token (auto-generated if not provided)                                         |
| `issuedAt`       | `string`   | ❌       | ISO 8601 datetime (defaults to current time)                                              |
| `expirationTime` | `string`   | ❌       | ISO 8601 datetime for expiration                                                          |
| `notBefore`      | `string`   | ❌       | ISO 8601 datetime for validity start                                                      |
| `requestId`      | `string`   | ❌       | System-specific identifier                                                                |
| `resources`      | `string[]` | ❌       | List of URI references                                                                    |

#### Methods

##### `prepareMessage(): string`

Formats the SIWE message according to [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) specification.

```typescript
const message = new SiweMessage({
	/* params */
})
const formattedMessage = message.prepareMessage()
```

##### `verify(params: VerifyParams): Promise<SiweResponse>`

Verifies the cryptographic signature of the message.

```typescript
interface VerifyParams {
	signature: string
	domain?: string // Override domain check
	nonce?: string // Override nonce check
	time?: string // Override time check
}

interface SiweResponse {
	success: boolean
	data?: {
		address: string
		chainId: number
		domain: string
		expirationTime?: string
		issuedAt: string
		nonce: string
		notBefore?: string
		requestId?: string
		resources?: string[]
		statement?: string
		uri: string
		version: string
	}
	error?: SiweError
}
```

##### `validate(params?: ValidateParams): SiweMessage`

Validates message structure without cryptographic verification.

```typescript
interface ValidateParams {
	domain?: string
	nonce?: string
	time?: string
}
```

### Utility Functions

#### `generateNonce(): string`

Generates a cryptographically secure random nonce.

```typescript
import { generateNonce } from 'siwe'

const nonce = generateNonce()
console.log(nonce) // e.g., "a1b2c3d4e5f6g7h8"
```

#### `parseSiweMessage(message: string): SiweMessage`

Parses a SIWE message string into a SiweMessage object.

```typescript
import { parseSiweMessage } from 'siwe'

const messageString = 'example.com wants you to sign in...'
const parsed = parseSiweMessage(messageString)
console.log(parsed.address)
```

## TypeScript Types

### SiweError

```typescript
interface SiweError {
	type: SiweErrorType
	expected?: string
	received?: string
}

enum SiweErrorType {
	INVALID_SIGNATURE = 'Invalid signature.',
	EXPIRED_MESSAGE = 'Expired message.',
	INVALID_DOMAIN = 'Invalid domain.',
	INVALID_NONCE = 'Invalid nonce.',
	INVALID_TIME = 'Invalid time.',
	MALFORMED_SESSION = 'Malformed session.',
}
```

### SiweMessageParams

```typescript
interface SiweMessageParams {
	domain: string
	address: string
	statement?: string
	uri: string
	version: string
	chainId: number
	nonce?: string
	issuedAt?: string
	expirationTime?: string
	notBefore?: string
	requestId?: string
	resources?: string[]
}
```

## Frontend Integration

### React Hook Example

```typescript
import { useState, useCallback } from 'react'
import { SiweMessage } from 'siwe'
import { ethers } from 'ethers'

export function useSiweAuth() {
	const [isLoading, setIsLoading] = useState(false)
	const [user, setUser] = useState(null)

	const signIn = useCallback(
		async (provider: ethers.providers.Web3Provider) => {
			setIsLoading(true)
			try {
				const signer = provider.getSigner()
				const address = await signer.getAddress()
				const chainId = await signer.getChainId()

				// Create message
				const message = new SiweMessage({
					domain: window.location.host,
					address,
					statement: 'Sign in with Ethereum.',
					uri: window.location.origin,
					version: '1',
					chainId,
				})

				const messageString = message.prepareMessage()

				// Request signature
				const signature = await signer.signMessage(messageString)

				// Send to backend for verification
				const response = await fetch('/api/auth/verify', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ message: messageString, signature }),
				})

				if (response.ok) {
					const userData = await response.json()
					setUser(userData)
				}
			} catch (error) {
				console.error('Sign in failed:', error)
			} finally {
				setIsLoading(false)
			}
		},
		[]
	)

	const signOut = useCallback(() => {
		setUser(null)
		// Clear backend session
		fetch('/api/auth/logout', { method: 'POST' })
	}, [])

	return { signIn, signOut, isLoading, user }
}
```

### Vue Composition API Example

```typescript
import { ref, computed } from 'vue'
import { SiweMessage } from 'siwe'
import { ethers } from 'ethers'

export function useSiweAuth() {
	const isLoading = ref(false)
	const user = ref(null)
	const isAuthenticated = computed(() => user.value !== null)

	async function signIn() {
		if (!window.ethereum) {
			throw new Error('No Web3 provider found')
		}

		isLoading.value = true

		try {
			const provider = new ethers.providers.Web3Provider(window.ethereum)
			await provider.send('eth_requestAccounts', [])

			const signer = provider.getSigner()
			const address = await signer.getAddress()
			const chainId = await signer.getChainId()

			const message = new SiweMessage({
				domain: window.location.host,
				address,
				statement: 'Sign in to Vue app with Ethereum.',
				uri: window.location.origin,
				version: '1',
				chainId,
			})

			const messageString = message.prepareMessage()
			const signature = await signer.signMessage(messageString)

			// Verify with backend
			const response = await fetch('/api/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: messageString, signature }),
			})

			if (response.ok) {
				user.value = await response.json()
			}
		} finally {
			isLoading.value = false
		}
	}

	function signOut() {
		user.value = null
	}

	return {
		signIn,
		signOut,
		isLoading: readonly(isLoading),
		user: readonly(user),
		isAuthenticated,
	}
}
```

## Backend Integration

### Express.js Example

```typescript
import express from 'express'
import { SiweMessage, generateNonce } from 'siwe'

const app = express()
app.use(express.json())

// Store nonces (use Redis in production)
const nonces = new Map<string, number>()

app.get('/api/nonce', (req, res) => {
	const nonce = generateNonce()
	nonces.set(nonce, Date.now())

	// Clean up expired nonces
	setTimeout(() => nonces.delete(nonce), 10 * 60 * 1000)

	res.json({ nonce })
})

app.post('/api/verify', async (req, res) => {
	try {
		const { message, signature } = req.body

		const siweMessage = new SiweMessage(message)

		// Validate nonce
		if (!nonces.has(siweMessage.nonce)) {
			return res.status(400).json({ error: 'Invalid nonce' })
		}
		nonces.delete(siweMessage.nonce)

		// Verify signature
		const result = await siweMessage.verify({ signature })

		if (result.success) {
			// Create session/JWT here
			res.json({
				success: true,
				user: {
					address: result.data.address,
					chainId: result.data.chainId,
				},
			})
		} else {
			res.status(401).json({ error: 'Invalid signature' })
		}
	} catch (error) {
		res.status(400).json({ error: error.message })
	}
})
```

### Next.js API Routes

```typescript
// pages/api/nonce.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { generateNonce } from 'siwe'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' })
	}

	const nonce = generateNonce()
	res.json({ nonce })
}

// pages/api/verify.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { SiweMessage } from 'siwe'

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' })
	}

	try {
		const { message, signature } = req.body
		const siweMessage = new SiweMessage(message)

		const result = await siweMessage.verify({ signature })

		if (result.success) {
			res.json({ success: true, user: result.data })
		} else {
			res.status(401).json({ error: 'Verification failed' })
		}
	} catch (error) {
		res.status(400).json({ error: error.message })
	}
}
```

## Advanced Features

### EIP-1271 Smart Contract Signatures

Verify signatures from smart contracts:

```typescript
import { SiweMessage } from 'siwe'
import { ethers } from 'ethers'

const message = new SiweMessage(messageParams)
const provider = new ethers.providers.JsonRpcProvider('https://...')

const result = await message.verify({
	signature,
	provider, // Required for EIP-1271 verification
})
```

### Custom Domain Validation

```typescript
const message = new SiweMessage(messageString)

// Override domain validation
const result = await message.verify({
	signature,
	domain: 'custom-domain.com',
})
```

### Time-based Validation

```typescript
// Verify at specific time
const result = await message.verify({
	signature,
	time: '2023-10-31T16:30:00Z',
})
```

## Migration Guide

### From v1 to v2

Version 2 introduces breaking changes for better TypeScript support:

#### Message Creation

```typescript
// v1
const message = new SiweMessage({
	domain: 'example.com',
	address: '0x...',
	// ... other fields
})

// v2 - Same API, improved types
const message = new SiweMessage({
	domain: 'example.com',
	address: '0x...',
	// ... other fields
})
```

#### Verification Response

```typescript
// v1
const result = await message.verify({ signature })
if (result.success) {
	console.log(result.data) // Direct access
}

// v2 - Enhanced error handling
const result = await message.verify({ signature })
if (result.success) {
	console.log(result.data) // Same structure
} else {
	console.error(result.error) // Detailed error info
}
```

## Troubleshooting

### Common Issues

#### "Invalid signature" Error

-   Verify the message string exactly matches what was signed
-   Check that the address is in EIP-55 checksum format
-   Ensure the signature is in the correct format (0x prefixed hex)

#### "Invalid nonce" Error

-   Verify nonces are only used once
-   Check nonce expiration/cleanup logic
-   Ensure nonce matches between message creation and verification

#### TypeScript Compilation Errors

-   Update to latest TypeScript version (4.5+)
-   Ensure `strict: true` in tsconfig.json
-   Install `@types/node` if using Node.js APIs

### Browser Compatibility

The library supports all modern browsers with ES6+ support:

-   Chrome 60+
-   Firefox 55+
-   Safari 12+
-   Edge 79+

For older browser support, use the ES5 build:

```html
<script src="https://unpkg.com/siwe@latest/dist/siwe.es5.min.js"></script>
```

## Performance

### Bundle Size

-   **Minified**: ~45KB
-   **Gzipped**: ~12KB
-   **Tree-shaking**: Supports ES modules for optimal bundling

### Verification Performance

-   **Message parsing**: ~0.1ms
-   **Signature verification**: ~10-50ms (depends on provider)
-   **Memory usage**: ~2MB per verification

### Optimization Tips

```typescript
// Reuse provider instances
const provider = new ethers.providers.JsonRpcProvider(RPC_URL)

// Cache verification results for identical signatures
const verificationCache = new Map()

async function cachedVerify(message: string, signature: string) {
	const key = `${message}-${signature}`
	if (verificationCache.has(key)) {
		return verificationCache.get(key)
	}

	const result = await new SiweMessage(message).verify({ signature })
	verificationCache.set(key, result)
	return result
}
```

## Resources

-   **GitHub**: [https://github.com/signinwithethereum/siwe](https://github.com/signinwithethereum/siwe)
-   **npm**: [https://www.npmjs.com/package/sign-in-with-ethereum](https://www.npmjs.com/package/sign-in-with-ethereum)
-   **TypeScript Playground**: [https://siwe-demo.vercel.app](https://siwe-demo.vercel.app)
-   **Examples**: [https://github.com/signinwithethereum/siwe-examples](https://github.com/signinwithethereum/siwe-examples)

---

_Need help with integration? Check out our [Quickstart Guide](../quickstart/index.md) or [Integration Examples](../integrations/index.md)._

---

import FullWidthLink from '@site/src/components/full-width-link'

# 🏃 Go

The Go implementation of Sign in with Ethereum can be found here:

<FullWidthLink
	href='https://github.com/signinwithethereum/siwe-go'
	logo='/img/github.svg'
	text='signinwithethereum/siwe-go'
	themeAware={true}
/>

## Installation

Install the library using Go get:

```bash
go get -u github.com/signinwithethereum/siwe-go
```

## Usage

### Parsing a SIWE Message

```go
var message *siwe.Message
var err error

message, err = siwe.ParseMessage(messageStr)
```

### Verifying and Authenticating a SIWE Message

```go
// Verify using EIP-191, returns the Ethereum public key
var publicKey *ecdsa.PublicKey
var err error

publicKey, err = message.VerifyEIP191(signature)

// Check time constraints
if message.ValidNow() {
    // Message is valid
}

// Combined verification with optional nonce and timestamp
publicKey, err = message.Verify(signature, optionalNonce, optionalTimestamp)
```

### Serializing a SIWE Message

```go
fmt.Printf("%s", message.String())
```

### Signing Messages from Go Code

```go
func signHash(data []byte) common.Hash {
    msg := fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(data), data)
    return crypto.Keccak256Hash([]byte(msg))
}

func signMessage(message string, privateKey *ecdsa.PrivateKey) ([]byte, error) {
    sign := signHash([]byte(message))
    signature, err := crypto.Sign(sign.Bytes(), privateKey)

    if err != nil {
        return nil, err
    }

    signature[64] += 27
    return signature, nil
}
```

---

# Sign in with Ethereum

**Sign in with Ethereum** (SIWE) is an authentication method for Ethereum accounts. It can be used by any kind of app, whether crypto-related or not.

## Key Benefits

### 🤝 **Complements other elements of the Ethereum Identity Stack**

After the user authenticates, apps may use their onchain **[ENS](https://ens.domains)** username and profile and **[EFP](https://efp.app)** social graph.

### [⛓️ **Enrich your app's UX with onchain data**](./quickstart/retrieve-onchain-data.mdx)

Seamlessly connects user identity with onchain activities, enabling applications to verify user ownership of NFTs, tokens, and other blockchain assets.

### 🛡️ **Self-Sovereign Identity**

Users maintain control over their identity credentials, eliminating dependency on centralized identity providers like Google or Facebook.

### 🖊️ **Single Sign-On**

Works across any application that implements the SIWE standard, creating a unified authentication and account experience.


## How It Works

SIWE follows a simple authentication flow:

1. **Message Creation**: Application generates a human-readable sign-in message containing domain, address, and security parameters, following the [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) standard.
2. **User Signing**: User signs the message with the Ethereum wallet of their choice.
3. **Signature Verification**: Application verifies the signature cryptographically to authenticate the user.
4. **Session Establishment**: Upon successful verification, a secure session is created for the authenticated user.

## Open EIP standard

SIWE is defined by **[EIP-4361](https://eips.ethereum.org/EIPS/eip-4361)** standard.

## Getting Started

Ready to implement SIWE in your application? Here are some quick paths forward:

### 🚀 **Quick Start**

Follow our [Quickstart Guide](quickstart/index.md) for a step-by-step tutorial on implementing SIWE from scratch.

### 📚 **Choose Your Library**

We provide official libraries for multiple programming languages:

-   [TypeScript](libraries/typescript)
-   [Rust](libraries/rust)
-   [Python](libraries/python)
-   [Ruby](libraries/ruby)
-   [Go](libraries/go)
-   [Elixir](libraries/elixir)

### 🪪 **Ethereum Identity Kit component library and API**

We offer the [Ethereum Identity Kit](https://ethidentitykit.com/) component library and API to help you integrate SIWE and the rest of the Ethereum identity stack.

### 🔌 **Pre-built Integrations**

Get started quickly with existing integrations:

-   [NextAuth.js](./integrations/nextauth.js.mdx)
-   [Auth0](./integrations/auth0.mdx)
-   [Discourse](./integrations/discourse)

## Security First

SIWE prioritizes security through:

-   **Nonce-based replay protection** to prevent message reuse attacks
-   **Domain binding** to prevent cross-site message abuse
-   **Expiration timestamps** for time-limited authentication
-   **Best practices guidance** for secure implementation

Learn more about [Security Best Practices](/security-considerations).

## Enterprise Ready

For enterprise applications, SIWE provides:

-   **[OpenID Connect (OIDC) Provider](./oidc-provider/index.mdx)** for standards-compliant integration
-   **Scalable authentication** supporting millions of users
-   **Compliance-friendly** audit trails and security controls
-   **Professional support** and deployment guidance

Learn more about [OpenID Connect Integration](/integrations/auth0).

## Community & Support

SIWE is an open-source project with an active community:

-   **GitHub**: [Contribute to the project and report issues](https://github.com/signinwithethereum/)
-   **Twitter**: Follow [@signinethereum](https://twitter.com/signinethereum) for updates

Explore the [Integrations](integrations/index.md) section to see SIWE implementations in production.

## Standards Compliance

SIWE fully complies with:

-   [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361): Sign in with Ethereum specification
-   [OpenID Connect](oidc-provider/index.mdx) 1.0 for enterprise integration
-   [OAuth 2.0](integrations/auth0.mdx) for authorization flows
-   Web3 wallet standards for broad compatibility

---

import FullWidthLink from '@site/src/components/full-width-link'

# Onchain Data

Once the user has authenticated with their Ethereum account, you may want to consider making use of their onchain data to enrich their experience of your app.

## Ethereum Name Service (ENS)

ENS enables onchain usernames and profiles.

<FullWidthLink
	href='resolve-ens-profiles'
	logo='/img/ens.svg'
	text='ENS Profiles'
	themeAware={true}
/>

## Ethereum Follow Protocol (EFP)

EFP enables an onchain social graph for Ethereum accounts.

<FullWidthLink
	href='resolve-efp-data'
	logo='/img/efp.svg'
	text='EFP Social Graph'
/>

## Other Onchain Assets

You may also want to retrieve the user's NFTs, token balances, and other onchain assets.

<FullWidthLink
	href='resolve-onchain-holdings'
	logo='/img/cargo.png'
	text='Other Onchain Assets'
/>

---

# Connect the Frontend

In this section of the Sign in with Ethereum quickstart guide, you'll learn how to update the frontend to send signed messages to the server.

## Prerequisites

-   A completed backend from the previous steps
-   Basic understanding of JavaScript and web development

## Step-by-Step Implementation

### 1. Update `src/index.js`

```javascript
import { BrowserProvider } from 'ethers'
import { SiweMessage } from 'siwe'

const domain = window.location.host
const origin = window.location.origin
const provider = new BrowserProvider(window.ethereum)

const BACKEND_ADDR = 'http://localhost:3000'

async function createSiweMessage(address, statement) {
	const res = await fetch(`${BACKEND_ADDR}/nonce`)
	const message = new SiweMessage({
		domain,
		address,
		statement,
		uri: origin,
		version: '1',
		chainId: '1',
		nonce: await res.text(),
	})
	return message.prepareMessage()
}

function connectWallet() {
	provider
		.send('eth_requestAccounts', [])
		.catch(() => console.log('user rejected request'))
}

let message = null
let signature = null

async function signInWithEthereum() {
	const signer = await provider.getSigner()

	message = await createSiweMessage(
		await signer.address,
		'Sign in with Ethereum to the app.'
	)
	console.log(message)
	signature = await signer.signMessage(message)
	console.log(signature)
}

async function sendForVerification() {
	const res = await fetch(`${BACKEND_ADDR}/verify`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ message, signature }),
	})
	console.log(await res.text())
}

const connectWalletBtn = document.getElementById('connectWalletBtn')
const siweBtn = document.getElementById('siweBtn')
```

### 2. Wire Up Event Listeners

Connect the buttons to their respective functions:

```javascript
connectWalletBtn.addEventListener('click', connectWallet)
siweBtn.addEventListener('click', signInWithEthereum)
```

## Key Points

-   The frontend creates SIWE messages with proper domain and origin
-   Users sign the message with their connected wallet
-   Signed messages are sent to the backend for verification
-   Proper error handling ensures a smooth user experience

## Next Steps

Continue to the next section to learn about implementing sessions for enhanced security.

---

# Implement Sessions

This guide demonstrates how to implement sessions with Express.js to add backend security for Sign in with Ethereum (SIWE).

## Prerequisites

-   A SIWE backend project
-   Express.js
-   Basic understanding of session management

## Implementation Steps

### 1. Install Dependencies

```bash
yarn add express-session
```

### 2. Update Backend Configuration

Modify `src/index.js` to include session management:

```javascript
import cors from 'cors'
import express from 'express'
import Session from 'express-session'
import { generateNonce, SiweMessage } from 'siwe'

const app = express()
app.use(express.json())
app.use(
	cors({
		origin: 'http://localhost:8080',
		credentials: true,
	})
)

app.use(
	Session({
		name: 'siwe-quickstart',
		secret: 'siwe-quickstart-secret',
		resave: true,
		saveUninitialized: true,
		cookie: { secure: false, sameSite: true },
	})
)

app.get('/nonce', async function (req, res) {
	req.session.nonce = generateNonce()
	res.setHeader('Content-Type', 'text/plain')
	res.status(200).send(req.session.nonce)
})

app.post('/verify', async function (req, res) {
	try {
		if (!req.body.message) {
			res.status(422).json({
				message: 'Expected prepareMessage object as body.',
			})
			return
		}

		let SIWEObject = new SiweMessage(req.body.message)
		const { data: message } = await SIWEObject.verify({
			signature: req.body.signature,
			nonce: req.session.nonce,
		})

		req.session.siwe = message
		req.session.cookie.expires = new Date(message.expirationTime)
		req.session.save(() => res.status(200).send(true))
	} catch (e) {
		req.session.siwe = null
		req.session.nonce = null
		console.error(e)
		res.status(400).send(`Failed to verify message: ${e.message}`)
	}
})

app.get('/personal_information', function (req, res) {
	if (!req.session.siwe) {
		res.status(401).json({ message: 'You have to first sign_in' })
		return
	}
	console.log('User is authenticated!')
	res.setHeader('Content-Type', 'text/plain')
	res.send(
		`You are authenticated and your address is: ${req.session.siwe.address}`
	)
})

app.listen(3000, () => {
	console.log(`Example app listening on port 3000`)
})
```

---

# Quickstart Guide

This guide will walk you through implementing Sign in with Ethereum (SIWE) authentication from scratch. By the end of this tutorial, you'll have a complete authentication system that allows users to sign in using their Ethereum wallets.

## What You'll Build

In this tutorial series, you'll create:

- **SIWE Message Generation**: Learn to create properly formatted authentication messages
- **Frontend Wallet Integration**: Connect to user wallets and request signatures  
- **Backend Verification Server**: Validate signatures and manage user sessions
- **Complete Auth Flow**: Connect frontend and backend for seamless authentication
- **Session Management**: Maintain user sessions across requests

## Prerequisites

Before starting this tutorial, you should have:

### Technical Knowledge
- **JavaScript/TypeScript**: Intermediate familiarity with ES6+ features
- **Node.js**: Experience with Node.js and npm/yarn package management  
- **Web Development**: Basic understanding of HTTP, APIs, and browser technologies
- **Blockchain Basics**: Basic understanding of Ethereum addresses and transactions

### Development Environment
- **Node.js**: Version 16 or higher
- **Package Manager**: npm or yarn installed
- **Code Editor**: VS Code or similar IDE
- **Web Browser**: Chrome, Firefox, or Edge with Ethereum wallet extension

### Optional Wallet Setup
- **MetaMask**: Browser extension for testing (or any Ethereum wallet)
- **Test ETH**: Small amount on testnets for transaction fees (not required for authentication)

## Tutorial Structure

This quickstart is divided into 7 progressive lessons:

### 1. [Creating a SIWE Message](creating-messages)
Learn the fundamentals of SIWE message creation using the official library. You'll understand the message format, required fields, and security considerations.

**Estimated Time**: 15 minutes  
**What You'll Learn**: Message formatting, nonce generation, security best practices

### 2. [Frontend Setup](frontend-setup)  
Build a React frontend that connects to user wallets and requests message signatures. Covers wallet connection, address detection, and signature requests.

**Estimated Time**: 25 minutes  
**What You'll Learn**: Wallet integration, ethers.js usage, React implementation

### 3. [Backend Verification](backend-verification)
Create an Express.js server that verifies SIWE signatures and manages nonces. Includes API endpoints for nonce generation and signature verification.

**Estimated Time**: 20 minutes  
**What You'll Learn**: Signature verification, API design, nonce management

### 4. [Connecting Frontend & Backend](connect-the-frontend.md)
Connect your frontend and backend to create a complete authentication flow. Implement proper error handling and user feedback.

**Estimated Time**: 15 minutes  
**What You'll Learn**: API integration, error handling, user experience

### 5. [Session Management](implement-sessions.md)
Add session management to maintain user authentication state across requests. Implement login/logout functionality and protected routes.

**Estimated Time**: 20 minutes  
**What You'll Learn**: Session handling, authentication middleware, security

### 6. [Retrieve Onchain Data](retrieve-onchain-data.mdx)
Enhance your application by retrieving onchain data like **[ENS](https://ens.domains)** profiles, **[EFP](https://efp.app)** social graph, and [onchain holdings](resolve-onchain-holdings.md) like NFTs and Assets.

**Estimated Time**: 25 minutes / Integration
**What You'll Learn**: ENS, EFP integration, resolving tokens & NFTs

## Alternative Paths

Depending on your needs, you can follow different paths through this tutorial:

## Code Repository

All tutorial code is available in our GitHub repository:

```bash
# Clone the tutorial repository
git clone https://github.com/signinwithethereum/siwe-quickstart
cd siwe-quickstart

# Install dependencies
npm install

# Start the development environment
npm run dev
```

Each tutorial part has its own branch with the completed code for that section.

## Getting Help

If you run into issues during the tutorial:

- **Documentation**: Check our comprehensive [Library Documentation](../libraries/index.md)
- **Issues**: Report bugs or request clarifications on [GitHub](https://github.com/signinwithethereum/siwe)
- **Examples**: Browse working implementations in our [Integrations](../integrations/index.md)

---

# Other Onchain Assets

This guide demonstrates how to pull information about a user's onchain holdings including NFTs, tokens, and other crypto assets.


## Implementation Steps

### 1. Update HTML

Modify `index.html` to include sections for both NFT and asset holdings:

```html
<div class="hidden" id="holdings">
	<h3>Onchain Holdings</h3>
	
	<!-- Asset Holdings Section -->
	<div id="assets">
		<h4>Token Assets</h4>
		<div id="assetsLoader"></div>
		<div id="assetsContainer" class="hidden">
			<table id="assetsTable"></table>
		</div>
	</div>
	
	<!-- NFT Holdings Section -->
	<div id="nft">
		<h4>NFT Collection</h4>
		<div id="nftLoader"></div>
		<div id="nftContainer" class="hidden">
			<table id="nftTable"></table>
		</div>
	</div>
</div>
```

### 2. Update JavaScript (index.js)

Add functions to retrieve and display both asset and NFT holdings:

#### Asset Holdings Functions

```javascript
// Element references
const holdingsElm = document.getElementById('holdings')
const assetsLoaderElm = document.getElementById('assetsLoader')
const assetsTableElm = document.getElementById('assetsTable')
const nftElm = document.getElementById('nft')
const nftLoaderElm = document.getElementById('nftLoader')
const nftTableElm = document.getElementById('nftTable')

// Asset holdings functions
async function getTokenBalances() {
	try {
		// Using Moralis API for token balances
		const response = await fetch(
			`https://deep-index.moralis.io/api/v2/${address}/erc20`,
			{
				headers: {
					'X-API-Key': 'your-moralis-api-key',
					'accept': 'application/json'
				}
			}
		)
		
		if (!response.ok) {
			throw new Error(response.statusText)
		}
		
		const data = await response.json()
		
		return data
			.filter(token => parseFloat(token.balance) > 0)
			.map(token => ({
				name: token.name,
				symbol: token.symbol,
				balance: (parseFloat(token.balance) / Math.pow(10, token.decimals)).toFixed(4),
				address: token.token_address,
				decimals: token.decimals
			}))
	} catch (error) {
		console.error('Failed to fetch token balances:', error)
		return []
	}
}

async function getETHBalance() {
	try {
		const balance = await provider.getBalance(address)
		const ethBalance = ethers.utils.formatEther(balance)
		
		return {
			name: 'Ethereum',
			symbol: 'ETH',
			balance: parseFloat(ethBalance).toFixed(4),
			address: 'native',
			decimals: 18
		}
	} catch (error) {
		console.error('Failed to fetch ETH balance:', error)
		return null
	}
}

async function displayAssets() {
	assetsLoaderElm.innerHTML = 'Loading token assets...'
	
	try {
		const [ethBalance, tokenBalances] = await Promise.all([
			getETHBalance(),
			getTokenBalances()
		])
		
		const allAssets = ethBalance ? [ethBalance, ...tokenBalances] : tokenBalances
		
		if (allAssets.length === 0) {
			assetsLoaderElm.innerHTML = 'No token assets found'
			return
		}
		
		let tableHtml = '<tr><th>Token</th><th>Symbol</th><th>Balance</th><th>Contract</th></tr>'
		
		allAssets.forEach(asset => {
			tableHtml += `<tr>
				<td>${asset.name}</td>
				<td>${asset.symbol}</td>
				<td>${asset.balance}</td>
				<td>${asset.address === 'native' ? 'Native ETH' : asset.address}</td>
			</tr>`
		})
		
		assetsTableElm.innerHTML = tableHtml
		assetsLoaderElm.classList = 'hidden'
		document.getElementById('assetsContainer').classList = ''
	} catch (error) {
		console.error('Error displaying assets:', error)
		assetsLoaderElm.innerHTML = 'Error loading assets'
	}
}

// NFT holdings functions

async function getNFTs() {
	try {
		let res = await fetch(
			`https://api.opensea.io/api/v1/assets?owner=${address}`
		)
		if (!res.ok) {
			throw new Error(res.statusText)
		}

		let body = await res.json()

		if (
			!body.assets ||
			!Array.isArray(body.assets) ||
			body.assets.length === 0
		) {
			return []
		}

		return body.assets.map(asset => {
			let { name, asset_contract, token_id } = asset
			let { address } = asset_contract
			return { name, address, token_id }
		})
	} catch (err) {
		console.error(`Failed to resolve nfts: ${err.message}`)
		return []
	}
}

async function displayNFTs() {
	nftLoaderElm.innerHTML = 'Loading NFT Ownership...'
	nftElm.classList = ''

	let nfts = await getNFTs()
	if (nfts.length === 0) {
		nftLoaderElm.innerHTML = 'No NFTs found'
		return
	}

	let tableHtml =
		'<tr><th>Name</th><th>Contract Address</th><th>Token ID</th></tr>'

	nfts.forEach(nft => {
		tableHtml += `<tr>
            <td>${nft.name || 'Unnamed'}</td>
            <td>${nft.address}</td>
            <td>${nft.token_id}</td>
        </tr>`
	})

	nftTableElm.innerHTML = tableHtml
	nftLoaderElm.classList = 'hidden'
	document.getElementById('nftContainer').classList = ''
}
```

### 3. Call the Functions

Add both asset and NFT display functions to your authentication flow:

```javascript
// After successful authentication
async function onAuthenticated() {
	await displayENSProfile()
	await displayEFPProfile()
	await displayAssets()
	await displayNFTs()
	
	// Show the holdings section
	holdingsElm.classList = ''
}
```

## Alternative Asset APIs

### Using Alchemy for Token Balances

```javascript
async function getTokenBalancesAlchemy() {
	const apiKey = 'your-alchemy-api-key'
	const baseURL = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`
	
	try {
		const response = await fetch(`${baseURL}/getTokenBalances`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'alchemy_getTokenBalances',
				params: [address, 'erc20']
			})
		})
		
		const data = await response.json()
		
		return data.result.tokenBalances
			.filter(token => parseInt(token.tokenBalance, 16) > 0)
			.map(token => ({
				address: token.contractAddress,
				balance: parseInt(token.tokenBalance, 16)
			}))
	} catch (error) {
		console.error('Failed to fetch token balances from Alchemy:', error)
		return []
	}
}
```

### Using CoinGecko for Price Data

```javascript
async function getTokenPrices(tokenAddresses) {
	try {
		const addressList = tokenAddresses.join(',')
		const response = await fetch(
			`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${addressList}&vs_currencies=usd`
		)
		
		return await response.json()
	} catch (error) {
		console.error('Failed to fetch token prices:', error)
		return {}
	}
}
```

## Alternative NFT APIs

### Using Alchemy

```javascript
async function getNFTsAlchemy() {
	const apiKey = 'your-alchemy-api-key'
	const baseURL = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}/getNFTs/`

	try {
		const response = await fetch(`${baseURL}?owner=${address}`)
		const data = await response.json()

		return data.ownedNfts.map(nft => ({
			name: nft.title,
			address: nft.contract.address,
			token_id: nft.id.tokenId,
		}))
	} catch (error) {
		console.error('Failed to fetch NFTs from Alchemy:', error)
		return []
	}
}
```

### Using Moralis

```javascript
async function getNFTsMoralis() {
	const apiKey = 'your-moralis-api-key'

	try {
		const response = await fetch(
			`https://deep-index.moralis.io/api/v2/${address}/nft`,
			{
				headers: {
					'X-API-Key': apiKey,
				},
			}
		)

		const data = await response.json()

		return data.result.map(nft => ({
			name: nft.name,
			address: nft.token_address,
			token_id: nft.token_id,
		}))
	} catch (error) {
		console.error('Failed to fetch NFTs from Moralis:', error)
		return []
	}
}
```

## Enhanced CSS Styling

Add styles for better presentation of holdings:

```css
.holdings-section {
	margin: 20px 0;
	padding: 15px;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	background-color: #fafafa;
}

.holdings-section h4 {
	margin-top: 0;
	color: #333;
	border-bottom: 2px solid #007bff;
	padding-bottom: 8px;
}

.assets-table, .nft-table {
	width: 100%;
	border-collapse: collapse;
	margin-top: 10px;
}

.assets-table th, .nft-table th {
	background-color: #007bff;
	color: white;
	padding: 12px;
	text-align: left;
}

.assets-table td, .nft-table td {
	padding: 10px;
	border-bottom: 1px solid #ddd;
}

.balance-cell {
	font-weight: bold;
	color: #28a745;
}

.contract-address {
	font-family: monospace;
	font-size: 0.9em;
	color: #666;
}
```

## Rate Limiting Considerations

-   Implement proper rate limiting for API calls
-   Consider caching both token and NFT data to reduce API requests
-   Handle API rate limit errors gracefully
-   Use batch requests when possible to minimize API calls
-   Implement exponential backoff for failed requests

## Privacy Considerations

-   All onchain holdings (tokens and NFTs) are public blockchain data
-   Consider allowing users to opt-out of holdings display
-   Be mindful of revealing sensitive information through asset ownership
-   Some users may prefer to keep their wealth information private
-   Consider implementing privacy toggles for different asset types

## Advanced Features

### Token-Gated Access Control

```javascript
async function checkTokenGatedAccess(requiredToken, minBalance) {
	const tokenBalances = await getTokenBalances()
	const tokenBalance = tokenBalances.find(token => 
		token.address.toLowerCase() === requiredToken.toLowerCase()
	)
	
	return tokenBalance && parseFloat(tokenBalance.balance) >= minBalance
}

async function checkNFTGatedAccess(requiredCollection) {
	const nfts = await getNFTs()
	return nfts.some(nft => 
		nft.address.toLowerCase() === requiredCollection.toLowerCase()
	)
}
```

### Portfolio Value Calculation

```javascript
async function calculatePortfolioValue() {
	const [tokenBalances, prices] = await Promise.all([
		getTokenBalances(),
		getTokenPrices(tokenBalances.map(t => t.address))
	])
	
	let totalValue = 0
	tokenBalances.forEach(token => {
		const price = prices[token.address.toLowerCase()]
		if (price && price.usd) {
			totalValue += parseFloat(token.balance) * price.usd
		}
	})
	
	return totalValue
}
```

---

import FullWidthLink from '@site/src/components/full-width-link'

# ENS Profiles

<FullWidthLink
	href='https://docs.ens.domains'
	logo='/img/ens.svg'
	text='Ethereum Name Service (ENS) Documentation'
	themeAware={true}
/>

## Resources

-   [ENS Documentation](https://docs.ens.domains) - Complete protocol documentation
-   [Ethereum Identity Kit](https://ethidentitykit.com) - React components for ENS integration
-   [ENS App](https://app.ens.domains) - Register and manage ENS names and profiles
-	[ENS Website](https://ens.domains) - ENS protocol website

## Component Library (React)

You can use the Ethereum Identity Kit to integrate ENS into your application:

<FullWidthLink
	href='https://ethidentitykit.com'
	logo='/img/eik-logo.svg'
	text='Ethereum Identity Kit (EIK) - Comprehensive EFP Integration'
/>

## Implementation Steps

### 1. Update HTML (frontend/src/index.html)

Add a new section for displaying ENS metadata:

```html
<div class="hidden" id="profile">
	<h3>ENS Metadata:</h3>
	<div id="ensLoader"></div>
	<div id="ensContainer" class="hidden">
		<table id="ensTable"></table>
	</div>
</div>
<div class="hidden" id="noProfile">No ENS Profile detected.</div>
```

### 2. Update JavaScript (frontend/src/index.js)

Add element references and the `displayENSProfile()` function:

```javascript
const profileElm = document.getElementById('profile')
const noProfileElm = document.getElementById('noProfile')
const ensTableElm = document.getElementById('ensTable')
const welcomeElm = document.getElementById('welcome')

async function displayENSProfile() {
	const ensName = await provider.lookupAddress(address)

	if (ensName) {
		profileElm.classList = ''
		welcomeElm.innerHTML = `Hello, ${ensName}`

		let avatar = await provider.getAvatar(ensName)
		if (avatar) {
			welcomeElm.innerHTML += ` <img class="avatar" src=${avatar}/>`
		}

		const resolver = await provider.getResolver(ensName)
		const keys = ['email', 'url', 'description', 'com.twitter']

		// Populate ENS metadata table
		ensTableElm.innerHTML += `<tr><td>name:</td><td>${ensName}</td></tr>`
		for (const key of keys) {
			const value = await resolver.getText(key)
			if (value) {
				ensTableElm.innerHTML += `<tr><td>${key}:</td><td>${value}</td></tr>`
			}
		}

		document.getElementById('ensContainer').classList = ''
	} else {
		welcomeElm.innerHTML = `Hello, ${address}`
		noProfileElm.classList = ''
	}

	welcomeElm.classList = ''
}
```

### 3. CSS for Avatar Display

Add some basic styling for the avatar:

```css
.avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	margin-left: 8px;
	vertical-align: middle;
}

.hidden {
	display: none;
}

table {
	border-collapse: collapse;
	width: 100%;
}

td {
	border: 1px solid #ddd;
	padding: 8px;
}

td:first-child {
	font-weight: bold;
	background-color: #f2f2f2;
}
```

## Key Features

-   **ENS Name Lookup**: Resolves the ENS name associated with an address
-   **Avatar Display**: Shows the user's ENS avatar if available
-   **Profile Metadata**: Displays common ENS text records like email, URL, and social media
-   **Fallback Handling**: Gracefully handles addresses without ENS profiles

## ENS Text Records

The implementation checks for these common text records:

-   `email`: Contact email address
-   `url`: Personal or professional website
-   `description`: Bio or description
-   `com.twitter`: Twitter handle

## Error Handling

The code includes proper error handling for:

-   Addresses without ENS names
-   Missing or empty text records
-   Network connectivity issues

---

import FullWidthLink from '@site/src/components/full-width-link'

# EFP Social Graph

<FullWidthLink
	href='https://docs.efp.app'
	logo='/img/efp.svg'
	text='Ethereum Follow Protocol (EFP) Documentation'
/>

## Resources

-   [EFP Documentation](https://docs.efp.app) - Complete protocol documentation
-   [EFP API Reference](https://ethidentitykit.com/docs/api) - Full API specification
-   [Ethereum Identity Kit](https://ethidentitykit.com) - React components for EFP integration
-   [EFP App](https://efp.app) - Reference implementation

## What is EFP?

Ethereum Follow Protocol (EFP) is an onchain social graph protocol for Ethereum accounts. It enables users to follow other Ethereum addresses, creating a decentralized social network layer. Unlike traditional social networks, EFP stores all relationship data onchain, making it composable and censorship-resistant.

Key features:
-   **Decentralized Social Graph**: All follow relationships stored onchain
-   **Composable**: Can be integrated into any application
-   **Tag System**: Support for custom tags like "top8", "mute", "block"
-   **No Vendor Lock-in**: Open protocol accessible by anyone

## Component Library (React)

You can use the Ethereum Identity Kit to integrate EFP into your application:

<FullWidthLink
	href='https://ethidentitykit.com'
	logo='/img/eik-logo.svg'
	text='Ethereum Identity Kit (EIK) - Comprehensive EFP Integration'
/>

## API Integration

### Basic User Stats

Get followers and following counts for any Ethereum address:

```javascript
async function getEFPStats(address) {
	try {
		const response = await fetch(`https://api.ethfollow.xyz/api/v1/users/${address}/stats`)
		const stats = await response.json()
		
		return {
			followers: stats.followers_count,
			following: stats.following_count,
		}
	} catch (error) {
		console.error('Error fetching EFP stats:', error)
		return null
	}
}
```

### Get User's Following List

Retrieve the complete list of accounts a user follows:

```javascript
async function getUserFollowing(address, limit = 100) {
	try {
		const response = await fetch(
			`https://api.ethfollow.xyz/api/v1/users/${address}/following?limit=${limit}`
		)
		const data = await response.json()
		
		return data.following.map(follow => ({
			address: follow.address,
			ens: follow.ens,
			avatar: follow.avatar,
			tags: follow.tags || []
		}))
	} catch (error) {
		console.error('Error fetching following list:', error)
		return []
	}
}
```

### Get User's Followers

Retrieve the list of accounts following a user:

```javascript
async function getUserFollowers(address, limit = 100) {
	try {
		const response = await fetch(
			`https://api.ethfollow.xyz/api/v1/users/${address}/followers?limit=${limit}`
		)
		const data = await response.json()
		
		return data.followers.map(follower => ({
			address: follower.address,
			ens: follower.ens,
			avatar: follower.avatar
		}))
	} catch (error) {
		console.error('Error fetching followers list:', error)
		return []
	}
}
```

## Implementation Steps

### 1. Update HTML (frontend/src/index.html)

Add a section for displaying EFP social graph data:

```html
<div class="hidden" id="efpProfile">
	<h3>EFP Social Graph:</h3>
	<div id="efpLoader">Loading EFP data...</div>
	<div id="efpContainer" class="hidden">
		<div id="efpStats"></div>
		<div id="efpConnections"></div>
	</div>
</div>
<div class="hidden" id="noEFPProfile">No EFP Profile detected.</div>
```

### 2. Update JavaScript (frontend/src/index.js)

Add EFP profile resolution functionality:

```javascript
const efpProfileElm = document.getElementById('efpProfile')
const noEFPProfileElm = document.getElementById('noEFPProfile')
const efpStatsElm = document.getElementById('efpStats')
const efpConnectionsElm = document.getElementById('efpConnections')

async function displayEFPProfile() {
	try {
		// Get basic EFP stats
		const stats = await getEFPStats(address)
		
		if (stats && (stats.followers > 0 || stats.following > 0)) {
			efpProfileElm.classList = ''
			
			// Display stats
			efpStatsElm.innerHTML = `
				<div class="efp-stats">
					<div class="stat-item">
						<span class="stat-number">${stats.followers}</span>
						<span class="stat-label">Followers</span>
					</div>
					<div class="stat-item">
						<span class="stat-number">${stats.following}</span>
						<span class="stat-label">Following</span>
					</div>
				</div>
			`
			
			// Get and display some recent follows
			if (stats.following > 0) {
				const following = await getUserFollowing(address, 5)
				let connectionsHTML = '<h4>Recent Follows:</h4><div class="connections-list">'
				
				following.forEach(follow => {
					connectionsHTML += `
						<div class="connection-item">
							${follow.avatar ? `<img src="${follow.avatar}" class="avatar-small" />` : ''}
							<span class="connection-name">${follow.ens || formatAddress(follow.address)}</span>
							${follow.tags.length > 0 ? `<span class="tags">${follow.tags.join(', ')}</span>` : ''}
						</div>
					`
				})
				
				connectionsHTML += '</div>'
				efpConnectionsElm.innerHTML = connectionsHTML
			}
			
			document.getElementById('efpContainer').classList = ''
		} else {
			noEFPProfileElm.classList = ''
		}
		
		document.getElementById('efpLoader').style.display = 'none'
	} catch (error) {
		console.error('Error displaying EFP profile:', error)
		noEFPProfileElm.classList = ''
		document.getElementById('efpLoader').style.display = 'none'
	}
}

function formatAddress(address) {
	return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}
```

### 3. CSS Styling

Add styles for the EFP profile display:

```css
.efp-stats {
	display: flex;
	gap: 20px;
	margin: 15px 0;
	padding: 15px;
	background-color: #f8f9fa;
	border-radius: 8px;
}

.stat-item {
	text-align: center;
}

.stat-number {
	display: block;
	font-size: 24px;
	font-weight: bold;
	color: #333;
}

.stat-label {
	display: block;
	font-size: 12px;
	color: #666;
	text-transform: uppercase;
}

.connections-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-top: 10px;
}

.connection-item {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px;
	background-color: #fff;
	border: 1px solid #e0e0e0;
	border-radius: 6px;
}

.avatar-small {
	width: 24px;
	height: 24px;
	border-radius: 50%;
}

.connection-name {
	font-weight: 500;
}

.tags {
	font-size: 11px;
	color: #666;
	background-color: #f0f0f0;
	padding: 2px 6px;
	border-radius: 3px;
	margin-left: auto;
}

.hidden {
	display: none;
}
```

## Advanced Features

### Leaderboard Integration

Get top users by followers or mutual connections:

```javascript
async function getEFPLeaderboard(sort = 'followers', limit = 10) {
	try {
		const response = await fetch(
			`https://api.ethfollow.xyz/api/v1/leaderboard/ranked?sort=${sort}&limit=${limit}`
		)
		const data = await response.json()
		return data.results
	} catch (error) {
		console.error('Error fetching leaderboard:', error)
		return []
	}
}
```

### Search EFP Users

Search for users by ENS name or address:

```javascript
async function searchEFPUsers(searchTerm) {
	try {
		const response = await fetch(
			`https://api.ethfollow.xyz/api/v1/leaderboard/search?term=${encodeURIComponent(searchTerm)}`
		)
		const data = await response.json()
		return data.results
	} catch (error) {
		console.error('Error searching EFP users:', error)
		return []
	}
}
```

### Check Mutual Connections

Find mutual follows between two addresses:

```javascript
async function getMutualConnections(address1, address2) {
	try {
		// Get following lists for both addresses
		const [following1, following2] = await Promise.all([
			getUserFollowing(address1),
			getUserFollowing(address2)
		])
		
		// Find mutual connections
		const mutuals = following1.filter(f1 => 
			following2.some(f2 => f2.address.toLowerCase() === f1.address.toLowerCase())
		)
		
		return mutuals
	} catch (error) {
		console.error('Error getting mutual connections:', error)
		return []
	}
}
```

## API Endpoints Reference

| Endpoint | Description |
|----------|-------------|
| `/users/{address}/stats` | Get follower/following counts |
| `/users/{address}/following` | Get list of addresses user follows |
| `/users/{address}/followers` | Get list of user's followers |
| `/leaderboard/ranked` | Get ranked users by various metrics |
| `/leaderboard/search` | Search users by name or address |

## Error Handling

The implementation includes proper error handling for:

-   Network connectivity issues
-   Invalid or non-existent addresses
-   API rate limiting
-   Missing or empty social graph data

## React Integration

For React applications, consider using the Ethereum Identity Kit:

```jsx
import { useEFPProfile } from '@ethereum-identity-kit/core'

function UserProfile({ address }) {
	const { data: efpData, loading, error } = useEFPProfile(address)
	
	if (loading) return <div>Loading EFP data...</div>
	if (error) return <div>Error loading social graph</div>
	
	return (
		<div>
			<h3>Social Graph</h3>
			<div>Followers: {efpData.followers}</div>
			<div>Following: {efpData.following}</div>
		</div>
	)
}
```

---

# Creating a SIWE Message

In this first tutorial, you'll learn how to create Sign in with Ethereum (SIWE) messages using the official TypeScript library. This is the foundation of SIWE authentication - generating properly formatted messages that users will sign with their wallets.

:::note

Other supported libraries can be found at [here](../libraries/index.md)

:::

## Learning Objectives

By the end of this tutorial, you'll understand:

-   How to install and import the SIWE library
-   The anatomy of a SIWE message
-   How to generate secure nonces
-   Best practices for message creation

## Installation

First, let's set up a new Node.js project and install the required dependencies:

```bash
# Create a new project directory
mkdir siwe-tutorial
cd siwe-tutorial

# Initialize a new Node.js project
npm init -y

# Install SIWE library and ethers for Ethereum utilities
npm install siwe ethers

# Install development dependencies
npm install -D typescript @types/node ts-node
```

## Basic Message Creation

Let's start by creating our first SIWE message. Create a new file called `create-message.js`:

```javascript
const { SiweMessage } = require('siwe')

// Basic SIWE message configuration
const domain = 'localhost:3000'
const origin = 'http://localhost:3000'
const address = '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890'

function createBasicMessage() {
	const message = new SiweMessage({
		domain: domain,
		address: address,
		statement: 'Sign in to our awesome Web3 app!',
		uri: origin,
		version: '1',
		chainId: 1, // Ethereum mainnet
	})

	// Generate the formatted message string
	const messageString = message.prepareMessage()
	console.log('Generated SIWE Message:')
	console.log(messageString)

	return message
}

// Run the function
createBasicMessage()
```

Run this script:

```bash
node create-message.js
```

You should see output similar to:

```
Generated SIWE Message:
localhost:3000 wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our awesome Web3 app!

URI: http://localhost:3000
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2023-10-31T16:25:24Z
```

## Understanding Message Components

Let's break down what each part of the message does:

### Required Fields

```javascript
const message = new SiweMessage({
	// The domain requesting the signature
	domain: 'localhost:3000',

	// User's Ethereum address (EIP-55 checksum format)
	address: '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',

	// The URI being signed (usually your app's login endpoint)
	uri: 'http://localhost:3000',

	// SIWE specification version (always "1")
	version: '1',

	// Blockchain network (1 = Ethereum mainnet, 5 = Goerli, etc.)
	chainId: 1,
})
```

### Optional Fields

You can enhance messages with additional security and context:

```javascript
const enhancedMessage = new SiweMessage({
	domain: 'localhost:3000',
	address: address,
	uri: origin,
	version: '1',
	chainId: 1,

	// Optional human-readable statement
	statement:
		'Welcome to our decentralized application. By signing this message, you agree to our terms of service.',

	// Custom nonce (if not provided, one is generated automatically)
	nonce: 'custom-nonce-12345',

	// Message expiration (1 hour from now)
	expirationTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),

	// Message valid from (current time)
	notBefore: new Date().toISOString(),

	// Request identifier for tracking
	requestId: 'auth-request-001',

	// Resources the user is requesting access to
	resources: ['https://api.example.com/user-data', 'ipfs://QmHash123...'],
})
```

## Secure Nonce Generation

Nonces prevent replay attacks by ensuring each signature is unique. The SIWE library provides a secure nonce generator:

```javascript
const { SiweMessage, generateNonce } = require('siwe')

function createMessageWithSecureNonce() {
	// Generate a cryptographically secure nonce
	const nonce = generateNonce()
	console.log('Generated nonce:', nonce)

	const message = new SiweMessage({
		domain: 'localhost:3000',
		address: '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',
		statement: 'Secure authentication with unique nonce',
		uri: 'http://localhost:3000',
		version: '1',
		chainId: 1,
		nonce: nonce, // Use the generated nonce
	})

	return message
}
```

## TypeScript Implementation

For better type safety, let's create a TypeScript version. Create `create-message.ts`:

```typescript
import { SiweMessage, generateNonce } from 'siwe'

interface MessageOptions {
	domain: string
	address: string
	uri: string
	chainId: number
	statement?: string
	expirationTime?: string
}

function createSiweMessage(options: MessageOptions): SiweMessage {
	const message = new SiweMessage({
		domain: options.domain,
		address: options.address,
		statement: options.statement || 'Sign in with Ethereum to authenticate',
		uri: options.uri,
		version: '1',
		chainId: options.chainId,
		nonce: generateNonce(),
		issuedAt: new Date().toISOString(),
		expirationTime: options.expirationTime,
	})

	return message
}

// Example usage
const messageOptions: MessageOptions = {
	domain: 'myapp.com',
	address: '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',
	uri: 'https://myapp.com/login',
	chainId: 1,
	statement: 'Welcome to MyApp! Sign this message to authenticate.',
	expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
}

const siweMessage = createSiweMessage(messageOptions)
console.log(siweMessage.prepareMessage())
```

## Production Best Practices

### Server-Side Message Creation

In production applications, **always create SIWE messages on the server**:

```javascript
// ❌ DON'T: Client-side message creation
// This allows clients to manipulate security-critical fields

// ✅ DO: Server-side message creation
function createServerSideMessage(userAddress, clientDomain) {
	// Verify the domain matches your application
	if (clientDomain !== 'myapp.com') {
		throw new Error('Invalid domain')
	}

	const message = new SiweMessage({
		domain: 'myapp.com', // Use server-controlled domain
		address: userAddress,
		statement: 'Authenticate with MyApp',
		uri: 'https://myapp.com/auth',
		version: '1',
		chainId: 1,
		nonce: generateNonce(), // Server-generated nonce
		issuedAt: new Date().toISOString(), // Server timestamp
	})

	return message
}
```

### Nonce Management

Store and validate nonces to prevent replay attacks:

```javascript
// Simple in-memory nonce storage (use Redis/database in production)
const usedNonces = new Set()

function createMessageWithNonceTracking(address) {
	const nonce = generateNonce()

	// Store nonce as pending
	usedNonces.add(nonce)

	const message = new SiweMessage({
		domain: 'localhost:3000',
		address: address,
		uri: 'http://localhost:3000',
		version: '1',
		chainId: 1,
		nonce: nonce,
		issuedAt: new Date().toISOString(),
		expirationTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
	})

	return { message, nonce }
}

function validateNonce(nonce) {
	if (!usedNonces.has(nonce)) {
		throw new Error('Invalid or expired nonce')
	}

	// Remove nonce after use to prevent replay
	usedNonces.delete(nonce)
	return true
}
```

## Error Handling

Always handle potential errors when creating messages:

```javascript
function safeCreateMessage(options) {
	try {
		// Validate required fields
		if (!options.domain || !options.address || !options.uri) {
			throw new Error('Missing required fields')
		}

		// Validate Ethereum address format
		if (!/^0x[a-fA-F0-9]{40}$/.test(options.address)) {
			throw new Error('Invalid Ethereum address format')
		}

		// Create message
		const message = new SiweMessage({
			domain: options.domain,
			address: options.address,
			statement: options.statement,
			uri: options.uri,
			version: '1',
			chainId: options.chainId || 1,
			nonce: generateNonce(),
			issuedAt: new Date().toISOString(),
		})

		return { success: true, message }
	} catch (error) {
		console.error('Error creating SIWE message:', error.message)
		return { success: false, error: error.message }
	}
}
```

## Testing Your Implementation

Create a test script to verify your message creation:

```javascript
const { SiweMessage, generateNonce } = require('siwe')

function testMessageCreation() {
	console.log('Testing SIWE message creation...\n')

	// Test 1: Basic message
	const basicMessage = new SiweMessage({
		domain: 'test.com',
		address: '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',
		uri: 'http://test.com',
		version: '1',
		chainId: 1,
	})

	console.log('✅ Basic message created successfully')
	console.log('Message preview:')
	console.log(basicMessage.prepareMessage().substring(0, 100) + '...\n')

	// Test 2: Enhanced message with all optional fields
	const enhancedMessage = new SiweMessage({
		domain: 'test.com',
		address: '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',
		statement: 'Test authentication message',
		uri: 'http://test.com/auth',
		version: '1',
		chainId: 1,
		nonce: generateNonce(),
		issuedAt: new Date().toISOString(),
		expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
		resources: ['https://api.test.com/data'],
	})

	console.log('✅ Enhanced message created successfully')
	console.log('Nonce:', enhancedMessage.nonce)
	console.log('Issued at:', enhancedMessage.issuedAt)
	console.log('Expires at:', enhancedMessage.expirationTime)
}

testMessageCreation()
```

---

# Backend Verification

In this tutorial, you'll build an Express.js backend server that securely validates SIWE signatures and manages user authentication. This is where the real security happens - never trust client-side signature verification in production!

## Learning Objectives

By the end of this tutorial, you'll understand:

-   How to verify SIWE signatures on the server
-   Secure nonce generation and management
-   Creating authentication APIs with proper error handling
-   Best practices for backend SIWE implementation

## Project Setup

Let's create a new Node.js backend project:

```bash
# Create backend directory
mkdir siwe-backend
cd siwe-backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express siwe ethers cors helmet express-rate-limit
npm install -D nodemon

# Create basic project structure
mkdir src routes middleware utils
touch src/server.js routes/auth.js middleware/auth.js utils/nonce.js
```

Update `package.json` to add scripts:

```json
{
	"scripts": {
		"start": "node src/server.js",
		"dev": "nodemon src/server.js",
		"test": "echo \"Error: no test specified\" && exit 1"
	}
}
```

## Basic Express Server

Create `src/server.js`:

```javascript
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

// Import routes
const authRoutes = require('../routes/auth')

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	message: 'Too many requests from this IP, please try again later.',
})
app.use(limiter)

// CORS configuration
app.use(
	cors({
		origin: process.env.FRONTEND_URL || 'http://localhost:3000',
		credentials: true,
	})
)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
	res.status(200).json({
		status: 'OK',
		timestamp: new Date().toISOString(),
		message: 'SIWE Backend is running',
	})
})

// Authentication routes
app.use('/auth', authRoutes)

// Global error handler
app.use((err, req, res, next) => {
	console.error('Global error handler:', err)

	res.status(err.status || 500).json({
		success: false,
		error: {
			message: err.message || 'Internal server error',
			...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
		},
	})
})

// 404 handler
app.use('*', (req, res) => {
	res.status(404).json({
		success: false,
		error: {
			message: 'Route not found',
		},
	})
})

app.listen(PORT, () => {
	console.log(`🚀 SIWE Backend server running on port ${PORT}`)
	console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

module.exports = app
```

## Nonce Management

Create `utils/nonce.js`:

```javascript
const { generateNonce } = require('siwe')

// In-memory storage for demo (use Redis/database in production)
class NonceManager {
	constructor() {
		this.nonces = new Map() // Map<nonce, { timestamp, used }>
		this.cleanupInterval = 5 * 60 * 1000 // 5 minutes
		this.maxAge = 10 * 60 * 1000 // 10 minutes

		// Start cleanup interval
		setInterval(() => this.cleanup(), this.cleanupInterval)
	}

	/**
	 * Generate a new nonce and store it
	 */
	generateNonce() {
		const nonce = generateNonce()
		const timestamp = Date.now()

		this.nonces.set(nonce, {
			timestamp,
			used: false,
		})

		console.log(`Generated nonce: ${nonce}`)
		return nonce
	}

	/**
	 * Validate and consume a nonce
	 */
	validateNonce(nonce) {
		const nonceData = this.nonces.get(nonce)

		if (!nonceData) {
			throw new Error('Invalid nonce: not found')
		}

		if (nonceData.used) {
			throw new Error('Invalid nonce: already used')
		}

		// Check if nonce is expired
		const now = Date.now()
		if (now - nonceData.timestamp > this.maxAge) {
			this.nonces.delete(nonce)
			throw new Error('Invalid nonce: expired')
		}

		// Mark as used
		nonceData.used = true
		this.nonces.set(nonce, nonceData)

		console.log(`Validated and consumed nonce: ${nonce}`)
		return true
	}

	/**
	 * Clean up expired nonces
	 */
	cleanup() {
		const now = Date.now()
		let cleaned = 0

		for (const [nonce, data] of this.nonces.entries()) {
			if (now - data.timestamp > this.maxAge) {
				this.nonces.delete(nonce)
				cleaned++
			}
		}

		if (cleaned > 0) {
			console.log(`Cleaned up ${cleaned} expired nonces`)
		}
	}

	/**
	 * Get statistics about nonce usage
	 */
	getStats() {
		const total = this.nonces.size
		let used = 0
		let expired = 0
		const now = Date.now()

		for (const [nonce, data] of this.nonces.entries()) {
			if (data.used) used++
			if (now - data.timestamp > this.maxAge) expired++
		}

		return {
			total,
			used,
			available: total - used - expired,
			expired,
		}
	}
}

// Export singleton instance
module.exports = new NonceManager()
```

## Authentication Routes

Create `routes/auth.js`:

```javascript
const express = require('express')
const { SiweMessage } = require('siwe')
const nonceManager = require('../utils/nonce')

const router = express.Router()

/**
 * GET /auth/nonce
 * Generate a new nonce for SIWE authentication
 */
router.get('/nonce', (req, res) => {
	try {
		const nonce = nonceManager.generateNonce()

		res.status(200).json({
			success: true,
			nonce,
		})
	} catch (error) {
		console.error('Error generating nonce:', error)
		res.status(500).json({
			success: false,
			error: {
				message: 'Failed to generate nonce',
			},
		})
	}
})

/**
 * POST /auth/verify
 * Verify a SIWE message and signature
 */
router.post('/verify', async (req, res) => {
	try {
		const { message, signature } = req.body

		// Validate input
		if (!message || !signature) {
			return res.status(400).json({
				success: false,
				error: {
					message: 'Message and signature are required',
				},
			})
		}

		console.log('Verifying SIWE message:', message)
		console.log('Signature:', signature)

		// Parse the SIWE message
		const siweMessage = new SiweMessage(message)

		// Validate nonce
		try {
			nonceManager.validateNonce(siweMessage.nonce)
		} catch (nonceError) {
			return res.status(400).json({
				success: false,
				error: {
					message: nonceError.message,
				},
			})
		}

		// Validate domain (security critical!)
		const allowedDomains = [
			'localhost:3000',
			'localhost:3001',
			process.env.FRONTEND_DOMAIN,
		].filter(Boolean)

		if (!allowedDomains.includes(siweMessage.domain)) {
			return res.status(400).json({
				success: false,
				error: {
					message: `Invalid domain: ${siweMessage.domain}`,
				},
			})
		}

		// Validate expiration
		if (siweMessage.expirationTime) {
			const expirationTime = new Date(siweMessage.expirationTime)
			if (new Date() > expirationTime) {
				return res.status(400).json({
					success: false,
					error: {
						message: 'Message has expired',
					},
				})
			}
		}

		// Validate not before
		if (siweMessage.notBefore) {
			const notBefore = new Date(siweMessage.notBefore)
			if (new Date() < notBefore) {
				return res.status(400).json({
					success: false,
					error: {
						message: 'Message is not yet valid',
					},
				})
			}
		}

		// Verify the signature
		const verificationResult = await siweMessage.verify({ signature })

		if (!verificationResult.success) {
			return res.status(401).json({
				success: false,
				error: {
					message: 'Invalid signature',
					details: verificationResult.error,
				},
			})
		}

		// Success! Return user info
		res.status(200).json({
			success: true,
			user: {
				address: siweMessage.address,
				domain: siweMessage.domain,
				chainId: siweMessage.chainId,
				issuedAt: siweMessage.issuedAt,
				expirationTime: siweMessage.expirationTime,
			},
			message: 'Authentication successful',
		})

		console.log(
			`✅ Successfully authenticated user: ${siweMessage.address}`
		)
	} catch (error) {
		console.error('Error verifying SIWE message:', error)

		// Handle specific SIWE errors
		if (error.type === 'SIWE_INVALID_SIGNATURE') {
			return res.status(401).json({
				success: false,
				error: {
					message: 'Invalid signature',
				},
			})
		}

		if (error.type === 'SIWE_EXPIRED') {
			return res.status(400).json({
				success: false,
				error: {
					message: 'Message has expired',
				},
			})
		}

		// Generic error
		res.status(500).json({
			success: false,
			error: {
				message: 'Verification failed',
				details: error.message,
			},
		})
	}
})

/**
 * POST /auth/logout
 * Logout user (invalidate session)
 */
router.post('/logout', (req, res) => {
	// In a real application, you would:
	// 1. Invalidate the user's session/JWT token
	// 2. Clear any stored user data
	// 3. Log the logout event

	res.status(200).json({
		success: true,
		message: 'Logged out successfully',
	})
})

/**
 * GET /auth/stats
 * Get nonce manager statistics (development only)
 */
router.get('/stats', (req, res) => {
	if (process.env.NODE_ENV === 'production') {
		return res.status(404).json({
			success: false,
			error: { message: 'Not found' },
		})
	}

	const stats = nonceManager.getStats()
	res.status(200).json({
		success: true,
		stats,
	})
})

module.exports = router
```

## Authentication Middleware

Create `middleware/auth.js` for protecting routes:

```javascript
/**
 * Middleware to protect routes that require authentication
 * In a real app, this would verify JWT tokens or sessions
 */
function requireAuth(req, res, next) {
	const authHeader = req.headers.authorization

	if (!authHeader) {
		return res.status(401).json({
			success: false,
			error: {
				message: 'Authorization header required',
			},
		})
	}

	// In a real implementation, verify JWT token here
	// For demo purposes, we'll just check for a valid format
	const token = authHeader.replace('Bearer ', '')

	if (!token || token.length < 10) {
		return res.status(401).json({
			success: false,
			error: {
				message: 'Invalid authorization token',
			},
		})
	}

	// Add user info to request (would come from JWT payload)
	req.user = {
		address: '0x...', // Would be extracted from verified JWT
	}

	next()
}

/**
 * Middleware to validate Ethereum address format
 */
function validateAddress(addressField = 'address') {
	return (req, res, next) => {
		const address = req.body[addressField] || req.params[addressField]

		if (!address) {
			return res.status(400).json({
				success: false,
				error: {
					message: `${addressField} is required`,
				},
			})
		}

		// Validate Ethereum address format
		if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
			return res.status(400).json({
				success: false,
				error: {
					message: 'Invalid Ethereum address format',
				},
			})
		}

		next()
	}
}

module.exports = {
	requireAuth,
	validateAddress,
}
```

## Enhanced Verification with Security Checks

Create `utils/verification.js`:

```javascript
const { SiweMessage } = require('siwe')

/**
 * Enhanced SIWE verification with additional security checks
 */
class SiweVerifier {
	constructor(config = {}) {
		this.config = {
			maxMessageAge: config.maxMessageAge || 10 * 60 * 1000, // 10 minutes
			allowedDomains: config.allowedDomains || ['localhost:3000'],
			allowedChainIds: config.allowedChainIds || [1, 5], // mainnet, goerli
			requireStatement: config.requireStatement || false,
			...config,
		}
	}

	/**
	 * Verify SIWE message with comprehensive validation
	 */
	async verify(message, signature, additionalChecks = {}) {
		try {
			// Parse message
			const siweMessage = new SiweMessage(message)

			// Run all validation checks
			await this.validateMessage(siweMessage, additionalChecks)

			// Verify cryptographic signature
			const verificationResult = await siweMessage.verify({ signature })

			if (!verificationResult.success) {
				throw new Error('Cryptographic signature verification failed')
			}

			return {
				success: true,
				user: {
					address: siweMessage.address,
					chainId: siweMessage.chainId,
					domain: siweMessage.domain,
					issuedAt: siweMessage.issuedAt,
					expirationTime: siweMessage.expirationTime,
					statement: siweMessage.statement,
					resources: siweMessage.resources,
				},
				verificationResult,
			}
		} catch (error) {
			return {
				success: false,
				error: error.message,
			}
		}
	}

	/**
	 * Validate SIWE message structure and content
	 */
	async validateMessage(siweMessage, additionalChecks = {}) {
		// Check domain whitelist
		if (!this.config.allowedDomains.includes(siweMessage.domain)) {
			throw new Error(`Domain '${siweMessage.domain}' not allowed`)
		}

		// Check chain ID whitelist
		if (!this.config.allowedChainIds.includes(siweMessage.chainId)) {
			throw new Error(`Chain ID '${siweMessage.chainId}' not allowed`)
		}

		// Check message age
		const issuedAt = new Date(siweMessage.issuedAt)
		const now = new Date()
		const messageAge = now.getTime() - issuedAt.getTime()

		if (messageAge > this.config.maxMessageAge) {
			throw new Error('Message is too old')
		}

		if (messageAge < 0) {
			throw new Error('Message issued in the future')
		}

		// Check expiration
		if (siweMessage.expirationTime) {
			const expirationTime = new Date(siweMessage.expirationTime)
			if (now > expirationTime) {
				throw new Error('Message has expired')
			}
		}

		// Check not before
		if (siweMessage.notBefore) {
			const notBefore = new Date(siweMessage.notBefore)
			if (now < notBefore) {
				throw new Error('Message is not yet valid')
			}
		}

		// Check statement requirement
		if (this.config.requireStatement && !siweMessage.statement) {
			throw new Error('Statement is required')
		}

		// Additional custom checks
		if (
			additionalChecks.requiredAddress &&
			siweMessage.address.toLowerCase() !==
				additionalChecks.requiredAddress.toLowerCase()
		) {
			throw new Error('Address mismatch')
		}

		if (
			additionalChecks.requiredChainId &&
			siweMessage.chainId !== additionalChecks.requiredChainId
		) {
			throw new Error('Chain ID mismatch')
		}
	}
}

module.exports = SiweVerifier
```

## Testing the Backend

Create a simple test script `test-backend.js`:

```javascript
const axios = require('axios')

const BASE_URL = 'http://localhost:3001'

async function testBackend() {
	try {
		console.log('🧪 Testing SIWE Backend API...\n')

		// Test 1: Health check
		console.log('1. Testing health check...')
		const health = await axios.get(`${BASE_URL}/health`)
		console.log('✅ Health check:', health.data.status)

		// Test 2: Generate nonce
		console.log('\n2. Testing nonce generation...')
		const nonceResponse = await axios.get(`${BASE_URL}/auth/nonce`)
		const nonce = nonceResponse.data.nonce
		console.log('✅ Nonce generated:', nonce)

		// Test 3: Try invalid verification
		console.log('\n3. Testing invalid verification...')
		try {
			await axios.post(`${BASE_URL}/auth/verify`, {
				message: 'invalid message',
				signature: 'invalid signature',
			})
		} catch (error) {
			console.log(
				'✅ Invalid verification properly rejected:',
				error.response.status
			)
		}

		// Test 4: Get stats (dev only)
		console.log('\n4. Testing stats endpoint...')
		const stats = await axios.get(`${BASE_URL}/auth/stats`)
		console.log('✅ Stats:', stats.data.stats)

		console.log('\n🎉 All tests passed!')
	} catch (error) {
		console.error('❌ Test failed:', error.message)
		if (error.response) {
			console.error('Response:', error.response.data)
		}
	}
}

// Run tests
testBackend()
```

## Environment Configuration

Create `.env` file:

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
FRONTEND_DOMAIN=localhost:3000

# Security settings
MAX_MESSAGE_AGE=600000
ALLOWED_DOMAINS=localhost:3000,localhost:3001
ALLOWED_CHAIN_IDS=1,5,137

# Rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

Update `src/server.js` to use environment variables:

```javascript
require('dotenv').config()

// Use environment variables for CORS
app.use(
	cors({
		origin: process.env.FRONTEND_URL || 'http://localhost:3000',
		credentials: true,
	})
)
```

## Running the Backend

Start your backend server:

```bash
# Install additional dependencies
npm install dotenv axios

# Run in development mode
npm run dev
```

Test the endpoints:

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test nonce generation
curl http://localhost:3001/auth/nonce

# Test stats endpoint
curl http://localhost:3001/auth/stats
```

## Security Best Practices

### 1. Input Validation

Always validate and sanitize inputs:

```javascript
const validator = require('validator')

function validateMessage(message) {
	if (!message || typeof message !== 'string') {
		throw new Error('Invalid message format')
	}

	if (message.length > 10000) {
		throw new Error('Message too long')
	}

	// Additional validation...
}
```

### 2. Rate Limiting

Implement strict rate limits:

```javascript
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5, // 5 attempts per window
	message: 'Too many authentication attempts',
})

router.post('/verify', authLimiter, async (req, res) => {
	// Verification logic
})
```

### 3. Logging and Monitoring

Add comprehensive logging:

```javascript
const winston = require('winston')

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
		new winston.transports.File({ filename: 'error.log', level: 'error' }),
		new winston.transports.File({ filename: 'combined.log' }),
	],
})

// Log authentication attempts
logger.info('Authentication attempt', {
	address: siweMessage.address,
	domain: siweMessage.domain,
	timestamp: new Date().toISOString(),
})
```

---

# Frontend Setup

In this tutorial, you'll build a React frontend that connects to user wallets and requests SIWE message signatures. You'll learn how to detect wallet connections, handle user addresses, and request message signatures using ethers.js.

## Learning Objectives

By the end of this tutorial, you'll understand:

-   How to connect to MetaMask and other Ethereum wallets
-   How to detect user address changes and network switches
-   How to request message signatures from connected wallets
-   Best practices for wallet integration and user experience

## Project Setup

Let's create a React application with the necessary dependencies:

```bash
# Create a new React app
npx create-react-app siwe-frontend
cd siwe-frontend

# Install Web3 dependencies
npm install siwe ethers

# Install additional UI dependencies (optional)
npm install styled-components

# Start the development server
npm start
```

## Wallet Connection Component

Create a new file `src/components/WalletConnect.js`:

```javascript
import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'

const WalletConnect = () => {
	const [isConnected, setIsConnected] = useState(false)
	const [userAddress, setUserAddress] = useState('')
	const [chainId, setChainId] = useState(null)
	const [provider, setProvider] = useState(null)
	const [signer, setSigner] = useState(null)

	// Check if wallet is already connected on component mount
	useEffect(() => {
		checkWalletConnection()
		setupEventListeners()
	}, [])

	const checkWalletConnection = async () => {
		if (typeof window.ethereum !== 'undefined') {
			try {
				const provider = new ethers.providers.Web3Provider(
					window.ethereum
				)
				const accounts = await provider.listAccounts()

				if (accounts.length > 0) {
					const signer = provider.getSigner()
					const address = await signer.getAddress()
					const network = await provider.getNetwork()

					setProvider(provider)
					setSigner(signer)
					setUserAddress(address)
					setChainId(network.chainId)
					setIsConnected(true)
				}
			} catch (error) {
				console.error('Error checking wallet connection:', error)
			}
		}
	}

	const setupEventListeners = () => {
		if (window.ethereum) {
			// Listen for account changes
			window.ethereum.on('accountsChanged', handleAccountsChanged)

			// Listen for chain changes
			window.ethereum.on('chainChanged', handleChainChanged)

			// Listen for connection changes
			window.ethereum.on('connect', handleConnect)
			window.ethereum.on('disconnect', handleDisconnect)
		}
	}

	const handleAccountsChanged = accounts => {
		if (accounts.length === 0) {
			// User disconnected
			disconnect()
		} else {
			// User switched accounts
			setUserAddress(accounts[0])
		}
	}

	const handleChainChanged = chainId => {
		// Convert hex to decimal
		const decimalChainId = parseInt(chainId, 16)
		setChainId(decimalChainId)

		// Reload the page to reset the dapp state
		window.location.reload()
	}

	const handleConnect = connectInfo => {
		console.log('Wallet connected:', connectInfo)
		checkWalletConnection()
	}

	const handleDisconnect = error => {
		console.log('Wallet disconnected:', error)
		disconnect()
	}

	const connectWallet = async () => {
		if (typeof window.ethereum === 'undefined') {
			alert('MetaMask is not installed! Please install MetaMask.')
			return
		}

		try {
			// Request account access
			await window.ethereum.request({ method: 'eth_requestAccounts' })

			// Create provider and signer
			const provider = new ethers.providers.Web3Provider(window.ethereum)
			const signer = provider.getSigner()
			const address = await signer.getAddress()
			const network = await provider.getNetwork()

			setProvider(provider)
			setSigner(signer)
			setUserAddress(address)
			setChainId(network.chainId)
			setIsConnected(true)

			console.log('Connected to wallet:', {
				address,
				chainId: network.chainId,
				networkName: network.name,
			})
		} catch (error) {
			console.error('Error connecting wallet:', error)

			// Handle specific error cases
			if (error.code === 4001) {
				alert('Please connect to MetaMask.')
			} else {
				alert('An error occurred while connecting to the wallet.')
			}
		}
	}

	const disconnect = () => {
		setIsConnected(false)
		setUserAddress('')
		setChainId(null)
		setProvider(null)
		setSigner(null)
	}

	const formatAddress = address => {
		if (!address) return ''
		return `${address.substring(0, 6)}...${address.substring(
			address.length - 4
		)}`
	}

	const getNetworkName = chainId => {
		const networks = {
			1: 'Ethereum Mainnet',
			5: 'Goerli Testnet',
			137: 'Polygon Mainnet',
			80001: 'Polygon Mumbai',
		}
		return networks[chainId] || `Network ${chainId}`
	}

	return (
		<div
			style={{
				padding: '20px',
				border: '1px solid #ccc',
				borderRadius: '8px',
				margin: '20px',
			}}
		>
			<h2>Wallet Connection</h2>

			{!isConnected ? (
				<div>
					<p>Connect your wallet to get started</p>
					<button
						onClick={connectWallet}
						style={{
							padding: '10px 20px',
							backgroundColor: '#007bff',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						Connect Wallet
					</button>
				</div>
			) : (
				<div>
					<p>
						<strong>Status:</strong> Connected ✅
					</p>
					<p>
						<strong>Address:</strong> {formatAddress(userAddress)}
					</p>
					<p>
						<strong>Full Address:</strong>{' '}
						<code>{userAddress}</code>
					</p>
					<p>
						<strong>Network:</strong> {getNetworkName(chainId)}
					</p>
					<button
						onClick={disconnect}
						style={{
							padding: '10px 20px',
							backgroundColor: '#dc3545',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						Disconnect
					</button>
				</div>
			)}
		</div>
	)
}

export default WalletConnect
```

## SIWE Message Signing Component

Create `src/components/SiweAuth.js`:

```javascript
import React, { useState } from 'react'
import { SiweMessage } from 'siwe'
import { ethers } from 'ethers'

const SiweAuth = ({ userAddress, signer, chainId }) => {
	const [message, setMessage] = useState('')
	const [signature, setSignature] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')

	const createSiweMessage = () => {
		if (!userAddress) {
			setError('No wallet connected')
			return
		}

		try {
			const siweMessage = new SiweMessage({
				domain: window.location.host,
				address: userAddress,
				statement:
					'Welcome to our Web3 app! Sign this message to authenticate securely.',
				uri: window.location.origin,
				version: '1',
				chainId: chainId || 1,
				nonce: Math.random().toString(36).substring(2, 15), // Simple nonce for demo
				issuedAt: new Date().toISOString(),
				expirationTime: new Date(
					Date.now() + 10 * 60 * 1000
				).toISOString(), // 10 minutes
			})

			const formattedMessage = siweMessage.prepareMessage()
			setMessage(formattedMessage)
			setError('')

			console.log('Created SIWE message:', formattedMessage)
		} catch (error) {
			console.error('Error creating SIWE message:', error)
			setError('Failed to create message: ' + error.message)
		}
	}

	const signMessage = async () => {
		if (!message) {
			setError('No message to sign')
			return
		}

		if (!signer) {
			setError('No signer available')
			return
		}

		setIsLoading(true)
		setError('')

		try {
			console.log('Requesting signature for message:', message)

			// Request signature from wallet
			const signature = await signer.signMessage(message)

			console.log('Signature received:', signature)
			setSignature(signature)
		} catch (error) {
			console.error('Error signing message:', error)

			// Handle user rejection
			if (error.code === 4001) {
				setError('User rejected the signature request')
			} else if (error.code === -32603) {
				setError('Internal wallet error. Please try again.')
			} else {
				setError('Failed to sign message: ' + error.message)
			}
		} finally {
			setIsLoading(false)
		}
	}

	const verifySignature = async () => {
		if (!message || !signature) {
			setError('Message and signature required for verification')
			return
		}

		try {
			// Parse the message back to SiweMessage object
			const siweMessage = new SiweMessage(message)

			// Verify the signature
			const verification = await siweMessage.verify({ signature })

			if (verification.success) {
				console.log(
					'✅ Signature verification successful!',
					verification
				)
				alert('Signature verified successfully!')
			} else {
				console.log('❌ Signature verification failed:', verification)
				setError('Signature verification failed')
			}
		} catch (error) {
			console.error('Error verifying signature:', error)
			setError('Verification failed: ' + error.message)
		}
	}

	const resetDemo = () => {
		setMessage('')
		setSignature('')
		setError('')
	}

	return (
		<div
			style={{
				padding: '20px',
				border: '1px solid #ccc',
				borderRadius: '8px',
				margin: '20px',
			}}
		>
			<h2>SIWE Authentication</h2>

			{!userAddress && (
				<p style={{ color: '#666' }}>
					Please connect your wallet first to use SIWE authentication.
				</p>
			)}

			{userAddress && (
				<>
					<div style={{ marginBottom: '20px' }}>
						<button
							onClick={createSiweMessage}
							disabled={isLoading}
							style={{
								padding: '10px 20px',
								backgroundColor: '#28a745',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								marginRight: '10px',
							}}
						>
							Create SIWE Message
						</button>

						<button
							onClick={signMessage}
							disabled={!message || isLoading}
							style={{
								padding: '10px 20px',
								backgroundColor: '#007bff',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: message ? 'pointer' : 'not-allowed',
								opacity: message ? 1 : 0.6,
								marginRight: '10px',
							}}
						>
							{isLoading ? 'Signing...' : 'Sign Message'}
						</button>

						<button
							onClick={verifySignature}
							disabled={!signature || isLoading}
							style={{
								padding: '10px 20px',
								backgroundColor: '#17a2b8',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: signature ? 'pointer' : 'not-allowed',
								opacity: signature ? 1 : 0.6,
								marginRight: '10px',
							}}
						>
							Verify Signature
						</button>

						<button
							onClick={resetDemo}
							style={{
								padding: '10px 20px',
								backgroundColor: '#6c757d',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Reset
						</button>
					</div>

					{error && (
						<div
							style={{
								color: '#dc3545',
								backgroundColor: '#f8d7da',
								padding: '10px',
								borderRadius: '4px',
								marginBottom: '20px',
							}}
						>
							<strong>Error:</strong> {error}
						</div>
					)}

					{message && (
						<div style={{ marginBottom: '20px' }}>
							<h3>Generated Message:</h3>
							<pre
								style={{
									backgroundColor: '#f8f9fa',
									padding: '15px',
									borderRadius: '4px',
									overflow: 'auto',
									fontSize: '12px',
									border: '1px solid #dee2e6',
								}}
							>
								{message}
							</pre>
						</div>
					)}

					{signature && (
						<div style={{ marginBottom: '20px' }}>
							<h3>Generated Signature:</h3>
							<div
								style={{
									backgroundColor: '#f8f9fa',
									padding: '15px',
									borderRadius: '4px',
									wordBreak: 'break-all',
									fontSize: '12px',
									border: '1px solid #dee2e6',
								}}
							>
								{signature}
							</div>
						</div>
					)}
				</>
			)}
		</div>
	)
}

export default SiweAuth
```

## Main App Component

Update `src/App.js` to use our components:

```javascript
import React, { useState } from 'react'
import WalletConnect from './components/WalletConnect'
import SiweAuth from './components/SiweAuth'
import './App.css'

function App() {
	const [walletInfo, setWalletInfo] = useState({
		isConnected: false,
		userAddress: '',
		chainId: null,
		provider: null,
		signer: null,
	})

	const handleWalletConnection = connectionInfo => {
		setWalletInfo(connectionInfo)
	}

	return (
		<div className='App'>
			<header
				style={{
					backgroundColor: '#282c34',
					padding: '20px',
					color: 'white',
					textAlign: 'center',
				}}
			>
				<h1>Sign in with Ethereum Demo</h1>
				<p>A complete tutorial on Web3 authentication</p>
			</header>

			<main
				style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}
			>
				<WalletConnect onConnectionChange={handleWalletConnection} />

				<SiweAuth
					userAddress={walletInfo.userAddress}
					signer={walletInfo.signer}
					chainId={walletInfo.chainId}
				/>

				<div
					style={{
						marginTop: '40px',
						padding: '20px',
						backgroundColor: '#f8f9fa',
						borderRadius: '8px',
					}}
				>
					<h3>How it works:</h3>
					<ol>
						<li>
							<strong>Connect Wallet:</strong> Click "Connect
							Wallet" to connect your MetaMask or compatible
							wallet
						</li>
						<li>
							<strong>Create Message:</strong> Generate a SIWE
							message with your address and current timestamp
						</li>
						<li>
							<strong>Sign Message:</strong> Use your wallet to
							cryptographically sign the authentication message
						</li>
						<li>
							<strong>Verify Signature:</strong> Validate that the
							signature matches the message and address
						</li>
					</ol>

					<div
						style={{
							marginTop: '20px',
							padding: '15px',
							backgroundColor: '#d1ecf1',
							borderRadius: '4px',
						}}
					>
						<strong>💡 Pro Tip:</strong> In a real application,
						message creation and signature verification would happen
						on your backend server for security. This demo shows the
						complete flow in the browser for educational purposes.
					</div>
				</div>
			</main>
		</div>
	)
}

export default App
```

## Enhanced Wallet Detection

Create `src/utils/walletUtils.js` for better wallet handling:

```javascript
// Detect available wallets
export const detectWallets = () => {
	const wallets = []

	// MetaMask
	if (window.ethereum?.isMetaMask) {
		wallets.push({
			name: 'MetaMask',
			icon: '🦊',
			provider: window.ethereum,
			type: 'metamask',
		})
	}

	// Coinbase Wallet
	if (window.ethereum?.isCoinbaseWallet) {
		wallets.push({
			name: 'Coinbase Wallet',
			icon: '🔵',
			provider: window.ethereum,
			type: 'coinbase',
		})
	}

	// WalletConnect (if injected)
	if (
		window.ethereum &&
		!window.ethereum.isMetaMask &&
		!window.ethereum.isCoinbaseWallet
	) {
		wallets.push({
			name: 'Injected Wallet',
			icon: '💼',
			provider: window.ethereum,
			type: 'injected',
		})
	}

	return wallets
}

// Format Ethereum address for display
export const formatAddress = (address, startLength = 6, endLength = 4) => {
	if (!address) return ''
	if (address.length < startLength + endLength) return address
	return `${address.substring(0, startLength)}...${address.substring(
		address.length - endLength
	)}`
}

// Get network information
export const getNetworkInfo = chainId => {
	const networks = {
		1: { name: 'Ethereum Mainnet', color: '#627eea' },
		5: { name: 'Goerli Testnet', color: '#f6c343' },
		137: { name: 'Polygon Mainnet', color: '#8247e5' },
		80001: { name: 'Polygon Mumbai', color: '#8247e5' },
		56: { name: 'BSC Mainnet', color: '#f0b90b' },
		97: { name: 'BSC Testnet', color: '#f0b90b' },
		43114: { name: 'Avalanche C-Chain', color: '#e84142' },
		250: { name: 'Fantom Opera', color: '#1969ff' },
		42161: { name: 'Arbitrum One', color: '#96bedc' },
		10: { name: 'Optimism', color: '#ff0420' },
	}

	return (
		networks[chainId] || {
			name: `Network ${chainId}`,
			color: '#666666',
		}
	)
}

// Validate Ethereum address
export const isValidAddress = address => {
	return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Switch network (for MetaMask)
export const switchNetwork = async chainId => {
	if (!window.ethereum) {
		throw new Error('No wallet found')
	}

	try {
		await window.ethereum.request({
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: `0x${chainId.toString(16)}` }],
		})
	} catch (error) {
		// Network not added to wallet
		if (error.code === 4902) {
			throw new Error(`Network ${chainId} not added to wallet`)
		}
		throw error
	}
}
```

## Error Handling and User Experience

Create `src/components/ErrorBoundary.js`:

```javascript
import React from 'react'

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props)
		this.state = { hasError: false, error: null }
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error }
	}

	componentDidCatch(error, errorInfo) {
		console.error('SIWE Error Boundary caught an error:', error, errorInfo)
	}

	render() {
		if (this.state.hasError) {
			return (
				<div
					style={{
						padding: '40px',
						textAlign: 'center',
						border: '2px solid #dc3545',
						borderRadius: '8px',
						backgroundColor: '#f8d7da',
						color: '#721c24',
					}}
				>
					<h2>🚫 Something went wrong</h2>
					<p>
						An error occurred in the SIWE authentication component.
					</p>
					<details style={{ marginTop: '20px' }}>
						<summary>Error Details</summary>
						<pre style={{ textAlign: 'left', marginTop: '10px' }}>
							{this.state.error?.toString()}
						</pre>
					</details>
					<button
						onClick={() =>
							this.setState({ hasError: false, error: null })
						}
						style={{
							marginTop: '20px',
							padding: '10px 20px',
							backgroundColor: '#dc3545',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						Try Again
					</button>
				</div>
			)
		}

		return this.props.children
	}
}

export default ErrorBoundary
```

## Testing Your Frontend

1. **Start the development server:**

```bash
npm start
```

2. **Test wallet connection:**

    - Click "Connect Wallet"
    - Approve the connection in MetaMask
    - Verify address and network display correctly

3. **Test message creation:**

    - Click "Create SIWE Message"
    - Review the generated message format
    - Verify all required fields are present

4. **Test message signing:**

    - Click "Sign Message"
    - Approve the signature in MetaMask
    - Verify signature is generated

5. **Test signature verification:**
    - Click "Verify Signature"
    - Confirm verification succeeds

---

# Message Troubleshooting

The SIWE Message Validator is an interactive tool that helps you validate, lint, and debug Sign in with Ethereum (SIWE) messages for compliance with the [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) specification.

## Validation Categories

### Format Validation
- Message structure and grammar compliance
- Required field presence and formatting
- Timestamp format (RFC 3339/ISO 8601)
- Ethereum address format validation
- URI format checking

### Security Validation  
- Nonce entropy and uniqueness analysis
- Domain binding verification
- Time-based security checks
- Resource access scope validation
- Common vulnerability detection

### Compliance Validation
- EIP-4361 specification adherence
- Version compatibility checking
- Chain ID validation
- Standard field requirements

## Common Errors

### Unnecessary Line Breaks
```
❌ example.com wants you to sign in with your Ethereum account:
❌
❌ 0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890
❌
✅ example.com wants you to sign in with your Ethereum account:
✅ 0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890
✅
```
**Fix**: Only add line breaks where specified in ERC-4361.

### Address Format Issues
```
❌ 742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890
✅ 0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890
```
**Fix**: Add the `0x` prefix to Ethereum addresses.

### Timestamp Format Issues
```
❌ 2023-10-31 16:25:24
✅ 2023-10-31T16:25:24Z
```
**Fix**: Use RFC 3339 format with `T` separator and timezone.

## Common Suggestions

### Weak Nonce Security
```
❌ test123
✅ a1B2c3D4e5F6g7H8
```
**Fix**: Use cryptographically secure random nonces with mixed characters.

### Missing Expiration Time
```diff
  Nonce: a1B2c3D4e5F6g7H8
  Issued At: 2023-10-31T16:25:24Z
+ Expiration Time: 2023-10-31T16:35:24Z
```
**Fix**: Add expiration time for security (5-15 minutes recommended).

## Security Best Practices

When implementing SIWE authentication, always:

1. **Generate messages server-side** to prevent client manipulation
2. **Use strong nonces** with sufficient entropy (16+ characters)
3. **Implement expiration times** to limit message lifetime
4. **Validate domain binding** to prevent phishing attacks
5. **Check signatures server-side** - never trust client validation alone
6. **Store used nonces** to prevent replay attacks

## API Reference

The validator is built on a modular validation engine that you can use programmatically:

```javascript
import { ValidationEngine } from '@site/src/components/SiweValidator';

// Validate a message
const result = ValidationEngine.validate(message, {
  profile: ValidationEngine.PROFILES.strict
});

// Quick validation for real-time feedback  
const quickCheck = ValidationEngine.quickValidate(message);

// Apply auto-fixes
const fixed = AutoFixer.fixMessage(parsedMessage, errors);
```

---

# Message Validator Tool

Validate and lint your Sign in with Ethereum messages for EIP-4361 compliance, security best practices, and proper formatting. Consult the [message troubleshooting guide](./validator-guide) for usage and troubleshooting tips.

import SiweValidator from '@site/src/components/SiweValidator/SiweValidator';

<SiweValidator />

---

# Integrations

Sign in with Ethereum (SIWE) can be integrated with various platforms and frameworks to provide seamless authentication experiences. This section covers popular integration options.

## Available Integrations

### Discussion Platforms

-   **[Discourse](/integrations/discourse)**: Add SIWE authentication to your Discourse community forums

### Authentication Libraries

-   **[NextAuth.js](/integrations/nextauth.js)**: Integrate SIWE with NextAuth.js for Next.js applications
-   **[Auth0](/integrations/auth0)**: Use SIWE with Auth0's enterprise authentication platform

## Integration Benefits

-   **Decentralized Authentication**: Users authenticate with their Ethereum wallets
-   **No Passwords**: Eliminates the need for traditional password-based authentication
-   **ENS Support**: Automatic username resolution from ENS names
-   **Cross-Platform**: Works across web, mobile, and desktop applications

## Common Integration Patterns

### Frontend Integration

Most integrations follow a similar pattern:

1. Connect to user's wallet
2. Create SIWE message
3. Request signature from user
4. Send signed message to backend for verification
5. Establish authenticated session

### Backend Verification

Backend integrations typically:

1. Receive signed SIWE message
2. Verify signature cryptographically
3. Validate message parameters (domain, nonce, expiration)
4. Create user session or JWT token

## Getting Started

Choose the integration that best fits your technology stack:

-   For Next.js applications, start with [NextAuth.js](/integrations/nextauth.js)
-   For community platforms, see [Discourse](/integrations/discourse)
-   For enterprise applications, explore [Auth0](/integrations/auth0)

## Custom Integrations

If you don't see your platform listed, you can build custom integrations using the SIWE libraries:

-   [TypeScript/JavaScript](/libraries/typescript)
-   [Python](/libraries/python)
-   [Ruby](/libraries/ruby)
-   [Go](/libraries/go)
-   [Rust](/libraries/rust)
-   [Elixir](/libraries/elixir)

## Community Contributions

The SIWE ecosystem welcomes community contributions. If you've built an integration for a platform not listed here, consider sharing it with the community.

---

import FullWidthLink from '@site/src/components/full-width-link'

# 🛡️ NextAuth.js

## Overview

NextAuth.js is "a complete open source authentication solution" designed for Next.js and serverless applications. This integration allows authentication using Ethereum wallets via Sign in with Ethereum ([EIP-4361](https://eips.ethereum.org/EIPS/eip-4361)).

<FullWidthLink
	href='https://github.com/nextauthjs/next-auth-example'
	logo='/img/authjs.webp'
	text='NextAuth.js Example Project'
/>

## Requirements

-   [Node.js](https://nodejs.org/en/)
-   [Yarn](https://classic.yarnpkg.com/en/docs/install#mac-stable)
-   Ethereum account at [Metamask](https://metamask.io)

## Setup Steps

### 1. Clone Example Project

```bash
git clone https://github.com/nextauthjs/next-auth-example
cd next-auth-example
```

### 2. Configure Environment

Modify `.env.local.example`:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=somereallysecretsecret
```

Rename to `.env.local`

### 3. Install Dependencies

```bash
yarn add siwe@beta ethers wagmi
```

### 4. Update App Configuration

In `pages/_app.tsx`, add WagmiProvider:

```typescript
import { WagmiConfig, createClient, configureChains, chain } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'

export const { chains, provider } = configureChains(
	[chain.mainnet, chain.polygon, chain.optimism, chain.arbitrum],
	[publicProvider()]
)

const client = createClient({
	autoConnect: true,
	provider,
})

export default function App({ Component, pageProps }) {
	return (
		<WagmiConfig client={client}>
			<SessionProvider session={pageProps.session}>
				<Component {...pageProps} />
			</SessionProvider>
		</WagmiConfig>
	)
}
```

### 5. Configure NextAuth Provider

Update `pages/api/auth/[...nextauth].ts`:

```typescript
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { SiweMessage } from 'siwe'

export default NextAuth({
	providers: [
		CredentialsProvider({
			name: 'Ethereum',
			credentials: {
				message: {
					label: 'Message',
					type: 'text',
					placeholder: '0x0',
				},
				signature: {
					label: 'Signature',
					type: 'text',
					placeholder: '0x0',
				},
			},
			async authorize(credentials) {
				try {
					const siwe = new SiweMessage(
						JSON.parse(credentials?.message || '{}')
					)

					const nextAuthUrl = new URL(process.env.NEXTAUTH_URL)
					if (siwe.domain !== nextAuthUrl.host) {
						return null
					}

					await siwe.validate(credentials?.signature || '')
					return {
						id: siwe.address,
						name: siwe.address,
						email: `${siwe.address}@ethereum.local`,
					}
				} catch (e) {
					return null
				}
			},
		}),
	],
	session: { strategy: 'jwt' },
	debug: process.env.NODE_ENV === 'development',
	secret: process.env.NEXTAUTH_SECRET,
	callbacks: {
		async session({ session, token }) {
			session.address = token.sub
			session.user.name = token.sub
			return session
		},
	},
})
```

## Frontend Integration

Create a sign-in component that uses SIWE with NextAuth.js:

```typescript
import { useAccount, useConnect, useSignMessage, useDisconnect } from 'wagmi'
import { SiweMessage } from 'siwe'
import { signIn, useSession } from 'next-auth/react'

export function SiweLogin() {
	const { signMessageAsync } = useSignMessage()
	const { address, isConnected } = useAccount()
	const { connect, connectors } = useConnect()
	const { disconnect } = useDisconnect()
	const { data: session } = useSession()

	const handleLogin = async () => {
		try {
			const callbackUrl = '/protected'
			const message = new SiweMessage({
				domain: window.location.host,
				address: address,
				statement: 'Sign in with Ethereum to the app.',
				uri: window.location.origin,
				version: '1',
				chainId: 1,
				nonce: await getCsrfToken(),
			})

			const signature = await signMessageAsync({
				message: message.prepareMessage(),
			})

			signIn('credentials', {
				message: JSON.stringify(message),
				redirect: false,
				signature,
				callbackUrl,
			})
		} catch (error) {
			console.log(error)
		}
	}

	if (isConnected) {
		return (
			<div>
				<p>Connected to {address}</p>
				<button onClick={handleLogin}>Sign in with Ethereum</button>
				<button onClick={() => disconnect()}>Disconnect</button>
			</div>
		)
	}

	return (
		<div>
			{connectors.map(connector => (
				<button
					disabled={!connector.ready}
					key={connector.id}
					onClick={() => connect({ connector })}
				>
					Connect {connector.name}
				</button>
			))}
		</div>
	)
}
```

## Key Features

-   Seamless integration with NextAuth.js authentication flow
-   Support for multiple wallet connectors via Wagmi
-   Session management through NextAuth.js
-   Customizable authentication callbacks
-   TypeScript support

---

# 🔰 Auth0

## Overview

This integration provides authentication and authorization for web2 applications across various sectors including retail, publishing, and B2B SaaS.

import FullWidthLink from '@site/src/components/full-width-link'

<FullWidthLink
	href='https://auth0.com/blog/sign-in-with-ethereum-siwe-now-available-on-auth0/'
	logo='/img/auth0.svg'
	text='Sign In With Ethereum (SIWE), Now Available on Auth0'
	themeAware={true}
/>

## Key Components

-   **Identity Provider**: Open-source OpenID Connect Identity Provider
-   **Implementation**: Hosted at oidc.login.xyz
-   **Language**: Rust-based implementation

## Workflow

The integration follows a comprehensive authentication workflow that demonstrates the complete authentication process from wallet connection to application access.

### Authentication Flow

1. User clicks login button
2. Redirected to Auth0 SIWE interface
3. Wallet authentication process
4. Redirected back to application
5. Optional ENS name resolution

## Example Application

A demo application showcases the authentication flow:

-   Features a mock NFT gallery website
-   Enables Sign In with Ethereum
-   Resolves NFT holdings via OpenSea API after authentication
-   Available at: [auth0-demo.login.xyz](https://auth0-demo.login.xyz/#/)

## Technical Details

-   Supports Ethereum-based authentication
-   Integrates with existing Auth0 authentication systems
-   Provides flexible authentication options for web applications
-   Uses OpenID Connect standard for interoperability

## Implementation Benefits

-   **Seamless Integration**: Works with existing Auth0 infrastructure
-   **Enterprise Ready**: Built for production web2 applications
-   **Multi-Sector Support**: Suitable for retail, publishing, and B2B SaaS
-   **Standards Compliance**: Uses OpenID Connect for standardization

## Getting Started

1. **Set up Auth0 Account**: Configure your Auth0 tenant
2. **Enable SIWE Provider**: Add SIWE as an identity provider
3. **Configure Application**: Update your application settings
4. **Test Integration**: Use the demo application as reference

## Configuration

The integration requires proper configuration of:

-   Auth0 tenant settings
-   Application callback URLs
-   SIWE provider settings
-   Session management

## Resources

-   [Demo Application](https://auth0-demo.login.xyz/#/)
-   [OIDC Provider Documentation](/oidc-provider)
-   [Auth0 Documentation (official Auth0 docs)](https://auth0.com/docs)

## Support

This integration is part of the broader SIWE ecosystem and leverages Auth0's enterprise-grade authentication infrastructure while providing decentralized identity capabilities.

---

import FullWidthLink from '@site/src/components/full-width-link'

# 💬 Discourse

## Overview

**Discourse** is an open-source discussion platform used for crypto governance and project discussions. This guide explains how to add Sign in with Ethereum (SIWE) authentication to your Discourse instance.

<FullWidthLink
	href='https://github.com/signinwithethereum/discourse-siwe-auth'
	logo='/img/discourse.svg'
	text='signinwithethereum/discourse-siwe-auth'
/>

## Requirements

-   A self-hosted Discourse server
-   Discourse's official distribution

## Key Notes

-   Users must enter an email after first authentication
-   If the user owns an ENS address, it will be the default username
-   After email association, users can sign in using SIWE

## Installation Steps

### 1. Enabling the Plugin

Access your container's `app.yml` file:

```bash
cd /var/discourse
nano containers/app.yml
```

Add the plugin repository URL:

```yaml
hooks:
    before_code:
        - exec:
              cmd:
                  - gem install rubyzip
    after_code:
        - exec:
              cd: $home/plugins
              cmd:
                  - sudo -E -u discourse git clone https://github.com/discourse/docker_manager.git
                  - sudo -E -u discourse git clone https://github.com/signinwithethereum/discourse-siwe-auth.git
```

Rebuild the container:

```bash
cd /var/discourse
./launcher rebuild app
```

### 2. Create a Project ID

<FullWidthLink
	href='https://cloud.walletconnect.com/sign-in'
	logo='/img/walletconnect.png'
	text='Create Project ID at WalletConnect Cloud'
/>

<br />

-   Configure the project ID in the plugin settings

### 3. Configure Message Statement

By default, the statement is "Sign-in to Discourse via Ethereum". You can customize this in the plugin settings.

## Plugin Management

-   To disable: Remove the plugin or uncheck `discourse siwe enabled` in Admin Settings

## Additional Configuration

Access plugin settings at:
`Admin Settings -> Plugins -> discourse-siwe -> discourse siwe enabled`

## Compatibility

-   Compatible with Discourse's official distribution
-   Ongoing discussion about compatibility with other builds

---

# 🔒 Security Considerations

## Overview

When using Sign In with Ethereum (SIWE), implementers should aim to mitigate security issues on both the client and server. This is a growing collection of best practices for implementers, but no security checklist can ever be truly complete.

## Message Generation and Validation

### Key Validation Principles

1. **Backend Validation**

    - Process SIWE messages according to [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) specifications
    - Create the entire SIWE message on the backend
    - Verify that the signed message is identical to the generated message with a valid signature

2. **Flexible Message Generation Approaches**
    - Some implementers may choose alternative methods:
        - Frontend can request specific field values from the server
        - Agree on a value generation method
        - Backend asserts received signed message matches expected verification parameters

### Critical Field Considerations

#### Nonce

**Purpose**: Prevent replay attacks

**Recommendations**:

-   Select nonce with sufficient entropy
-   Server should assert nonce matches expected value
-   Potential strategies:
    -   Derive nonce from recent block hash
    -   Use system time
    -   Reduce server interaction

**Best Practices**:

-   Use cryptographically secure random generation
-   Ensure nonces are single-use
-   Implement proper nonce cleanup/expiration
-   Store nonces securely on the server

#### Domain

**Purpose**: Prevent phishing attacks

**Wallet Capabilities**:

-   Can check/generate correct domain bindings
-   Verify website serving message matches domain
-   Example: Ensure "example.org" securely serves its SIWE message

**Best Practices**:

-   Always validate domain matches the serving origin
-   Use exact domain matching (no wildcards)
-   Implement proper HTTPS/TLS validation
-   Consider subdomain implications

#### Time-based Fields

**issuedAt**:

-   Should reflect the actual time of message creation
-   Validate against server time with reasonable tolerance
-   Use RFC 3339 (ISO 8601) format consistently

**expirationTime**:

-   Set reasonable expiration windows (5-15 minutes)
-   Always validate expiration on the server
-   Consider clock skew between client and server

**notBefore**:

-   Use when implementing scheduled authentication
-   Validate current time is after notBefore time

#### Chain ID

**Purpose**: Prevent cross-chain replay attacks

**Recommendations**:

-   Always specify the correct chain ID
-   Validate chain ID matches expected network
-   Consider multi-chain implications for your application

## Server-Side Security

### Message Verification

1. **Signature Validation**

    - Use proper cryptographic libraries for signature verification
    - Implement EIP-191 personal message signing validation
    - Support EIP-1271 for contract-based signatures when needed

2. **Parameter Validation**
    - Validate all message parameters against expected values
    - Implement strict parsing of message format
    - Reject malformed or unexpected messages

### Session Management

1. **Session Security**

    - Implement secure session storage
    - Use HTTPOnly and Secure cookie flags
    - Implement proper session expiration
    - Consider using JWTs with proper validation

2. **Rate Limiting**
    - Implement rate limiting for authentication endpoints
    - Prevent brute force attacks
    - Monitor for suspicious authentication patterns

### Database Security

1. **Data Storage**
    - Store minimal necessary user data
    - Hash or encrypt sensitive information
    - Implement proper database access controls
    - Regular security audits of stored data

## Client-Side Security

### Wallet Integration

1. **Wallet Connection**

    - Only connect to trusted wallet providers
    - Validate wallet signatures properly
    - Handle wallet disconnection gracefully
    - Implement proper error handling

2. **Message Presentation**
    - Display message contents clearly to users
    - Ensure users understand what they're signing
    - Implement proper message formatting
    - Avoid misleading or confusing message content

### Frontend Security

1. **HTTPS Requirements**

    - Always serve SIWE applications over HTTPS
    - Implement proper TLS certificate validation
    - Use secure headers (HSTS, CSP, etc.)

2. **Cross-Origin Considerations**
    - Implement proper CORS policies
    - Validate origins for authentication requests
    - Prevent cross-site request forgery (CSRF)

## Common Vulnerabilities

### Replay Attacks

**Risk**: Reusing signed messages for unauthorized access

**Mitigation**:

-   Implement proper nonce validation
-   Use time-based expiration
-   Track used signatures server-side

### Phishing Attacks

**Risk**: Users signing messages on malicious domains

**Mitigation**:

-   Validate domain field matches serving origin
-   Educate users about domain verification
-   Implement visual indicators for trusted domains

### Session Hijacking

**Risk**: Unauthorized access to authenticated sessions

**Mitigation**:

-   Use secure session management
-   Implement session regeneration
-   Monitor for suspicious session activity
-   Provide session termination controls

### Message Tampering

**Risk**: Modification of SIWE message content

**Mitigation**:

-   Generate messages server-side when possible
-   Validate all message parameters
-   Use cryptographic signatures for integrity

## Deployment Security

### Infrastructure Security

1. **Server Configuration**

    - Keep servers and dependencies updated
    - Implement proper firewall rules
    - Use secure authentication for server access
    - Regular security patches and updates

2. **Monitoring and Logging**
    - Log authentication attempts and failures
    - Monitor for unusual patterns
    - Implement alerting for security events
    - Regular security audit reviews

### Third-Party Dependencies

1. **Library Security**

    - Keep SIWE libraries updated
    - Audit third-party dependencies
    - Monitor for security vulnerabilities
    - Use dependency scanning tools

2. **Infrastructure Dependencies**
    - Secure database connections
    - Use trusted Ethereum node providers
    - Implement proper API key management
    - Regular infrastructure security reviews
---

# ERC-4361: Sign-In with Ethereum

### Off-chain authentication for Ethereum accounts to establish sessions.

@wyc

@obstropolos

@brantlymillegan

@Arachnid

@awoie

EIP-55

EIP-137

EIP-155

EIP-191

EIP-1271

EIP-1328

This EIP is in the process of being peer-reviewed. If you are interested in this EIP, please participate using this discussion link.

## Table of Contents

- Abstract

Abstract

- Motivation

Motivation

- Specification

      Overview

      Message Format

      Signing and Verifying Messages with Ethereum Accounts

      Resolving Ethereum Name Service (ENS) Data

      Relying Party Implementer Steps

      Wallet Implementer Steps

Specification

- Overview

Overview

- Message Format

Message Format

- Signing and Verifying Messages with Ethereum Accounts

Signing and Verifying Messages with Ethereum Accounts

- Resolving Ethereum Name Service (ENS) Data

Resolving Ethereum Name Service (ENS) Data

- Relying Party Implementer Steps

Relying Party Implementer Steps

- Wallet Implementer Steps

Wallet Implementer Steps

- Rationale

      Requirements

      Design Goals

      Technical Decisions

      Out of Scope

      Considerations for Forwards Compatibility

Rationale

- Requirements

Requirements

- Design Goals

Design Goals

- Technical Decisions

Technical Decisions

- Out of Scope

Out of Scope

- Considerations for Forwards Compatibility

Considerations for Forwards Compatibility

- Backwards Compatibility

Backwards Compatibility

- Reference Implementation

Reference Implementation

- Security Considerations

      Identifier Reuse

      Key Management

      Wallet and Relying Party combined Security

      Minimizing Wallet and Server Interaction

      Preventing Replay Attacks

      Preventing Phishing Attacks

      Channel Security

      Session Invalidation

      Maximum Lengths for ABNF Terms

Security Considerations

- Identifier Reuse

Identifier Reuse

- Key Management

Key Management

- Wallet and Relying Party combined Security

Wallet and Relying Party combined Security

- Minimizing Wallet and Server Interaction

Minimizing Wallet and Server Interaction

- Preventing Replay Attacks

Preventing Replay Attacks

- Preventing Phishing Attacks

Preventing Phishing Attacks

- Channel Security

Channel Security

- Session Invalidation

Session Invalidation

- Maximum Lengths for ABNF Terms

Maximum Lengths for ABNF Terms

- Copyright

Copyright

## Abstract

> Sign-In with Ethereum describes how Ethereum accounts authenticate with off-chain services by signing a standard message format parameterized by scope, session details, and security mechanisms (e.g., a nonce). The goals of this specification are to provide a self-custodied alternative to centralized identity providers, improve interoperability across off-chain services for Ethereum-based authentication, and provide wallet vendors a consistent machine-readable message format to achieve improved user experiences and consent management.

## Motivation

> When signing in to popular non-blockchain services today, users will typically use identity providers (IdPs) that are centralized entities with ultimate control over users’ identifiers, for example, large internet companies and email providers. Incentives are often misaligned between these parties. Sign-In with Ethereum offers a new self-custodial option for users who wish to assume more control and responsibility over their own digital identity.

> Already, many services support workflows to authenticate Ethereum accounts using message signing, such as to establish a cookie-based web session which can manage privileged metadata about the authenticating address. This is an opportunity to standardize the sign-in workflow and improve interoperability across existing services, while also providing wallet vendors a reliable method to identify signing requests as Sign-In with Ethereum requests for improved UX.

## Specification

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “NOT RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in RFC 2119 and RFC 8174.

### Overview

> Sign-In with Ethereum (SIWE) works as follows:

- The relying party generates a SIWE Message and prefixes the SIWE Message with \x19Ethereum Signed Message:\n<length of message> as defined in ERC-191.

\x19Ethereum Signed Message:\n<length of message>

ERC-191

- The wallet presents the user with a structured plaintext message or equivalent interface for signing the SIWE Message with the ERC-191 signed data format.

- The signature is then presented to the relying party, which checks the signature’s validity and SIWE Message content.

- The relying party might further fetch data associated with the Ethereum address, such as from the Ethereum blockchain (e.g., ENS, account balances, ERC-20/ERC-721/ERC-1155 asset ownership), or other data sources that might or might not be permissioned.

ERC-20

ERC-721

ERC-1155

### Message Format

#### ABNF Message Format

> A SIWE Message MUST conform with the following Augmented Backus–Naur Form (ABNF, RFC 5234) expression (note that %s denotes case sensitivity for a string term, as per RFC 7405).

%s

sign-in-with-ethereum =

    [ scheme "://" ] domain %s" wants you to sign in with your Ethereum account:" LF

    address LF

    LF

    [ statement LF ]

    %s"URI: " uri LF

    %s"Version: " version LF

    %s"Chain ID: " chain-id LF

    %s"Nonce: " nonce LF

    %s"Issued At: " issued-at

    [ LF %s"Expiration Time: " expiration-time ]

    [ LF %s"Not Before: " not-before ]

    [ LF %s"Request ID: " request-id ]

    [ LF %s"Resources:"

    resources ]

scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )

    ; See RFC 3986 for the fully contextualized

    ; definition of "scheme".

domain = authority

    ; From RFC 3986:

    ;     authority     = [ userinfo "@" ] host [ ":" port ]

    ; definition of "authority".

address = "0x" 40*40HEXDIG

    ; Must also conform to capitalization

    ; checksum encoding specified in EIP-55

    ; where applicable (EOAs).

statement = *( reserved / unreserved / " " )

    ; See RFC 3986 for the definition

    ; of "reserved" and "unreserved".

    ; The purpose is to exclude LF (line break).

uri = URI

    ; See RFC 3986 for the definition of "URI".

version = "1"

chain-id = 1*DIGIT

    ; See EIP-155 for valid CHAIN_IDs.

nonce = 8*( ALPHA / DIGIT )

    ; See RFC 5234 for the definition

    ; of "ALPHA" and "DIGIT".

issued-at = date-time

expiration-time = date-time

not-before = date-time

    ; See RFC 3339 (ISO 8601) for the

    ; definition of "date-time".

request-id = *pchar

    ; See RFC 3986 for the definition of "pchar".

resources = *( LF resource )

resource = "- " URI

#### Message Fields

> This specification defines the following SIWE Message fields that can be parsed from a SIWE Message by following the rules in ABNF Message Format:

ABNF Message Format

- scheme OPTIONAL. The URI scheme of the origin of the request. Its value MUST be an RFC 3986 URI scheme.

scheme

- domain REQUIRED. The domain that is requesting the signing. Its value MUST be an RFC 3986 authority. The authority includes an OPTIONAL port. If the port is not specified, the default port for the provided scheme is assumed (e.g., 443 for HTTPS). If scheme is not specified, HTTPS is assumed by default.

domain

- address REQUIRED. The Ethereum address performing the signing. Its value SHOULD be conformant to mixed-case checksum address encoding specified in ERC-55 where applicable.

address

ERC-55

- statement OPTIONAL. A human-readable ASCII assertion that the user will sign which MUST NOT include '\n' (the byte 0x0a).

statement

'\n'

0x0a

- uri REQUIRED. An RFC 3986 URI referring to the resource that is the subject of the signing (as in the subject of a claim).

uri

- version REQUIRED. The current version of the SIWE Message, which MUST be 1 for this specification.

version

1

- chain-id REQUIRED. The EIP-155 Chain ID to which the session is bound, and the network where Contract Accounts MUST be resolved.

chain-id

- nonce REQUIRED. A random string typically chosen by the relying party and used to prevent replay attacks, at least 8 alphanumeric characters.

nonce

- issued-at REQUIRED. The time when the message was generated, typically the current time. Its value MUST be an ISO 8601 datetime string.

issued-at

- expiration-time OPTIONAL. The time when the signed authentication message is no longer valid. Its value MUST be an ISO 8601 datetime string.

expiration-time

- not-before OPTIONAL. The time when the signed authentication message will become valid. Its value MUST be an ISO 8601 datetime string.

not-before

- request-id OPTIONAL. A system-specific identifier that MAY be used to uniquely refer to the sign-in request.

request-id

- resources OPTIONAL. A list of information or references to information the user wishes to have resolved as part of authentication by the relying party. Every resource MUST be an RFC 3986 URI separated by "\n- " where \n is the byte 0x0a.

resources

"\n- "

\n

#### Informal Message Template

> A Bash-like informal template of the full SIWE Message is presented below for readability and ease of understanding, and it does not reflect the allowed optionality of the fields. Field descriptions are provided in the following section. A full ABNF description is provided in ABNF Message Format.

${scheme}:// ${domain} wants you to sign in with your Ethereum account:

${address}

${statement}

URI: ${uri}

Version: ${version}

Chain ID: ${chain-id}

Nonce: ${nonce}

Issued At: ${issued-at}

Expiration Time: ${expiration-time}

Not Before: ${not-before}

Request ID: ${request-id}

Resources:

- ${resources[0]}

- ${resources[1]}

...

- ${resources[n]}

#### Examples

> The following is an example SIWE Message with an implicit scheme:

example.com wants you to sign in with your Ethereum account:

0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

I accept the ExampleOrg Terms of Service: https://example.com/tos

URI: https://example.com/login

Version: 1

Chain ID: 1

Nonce: 32891756

Issued At: 2021-09-30T16:25:24Z

- ipfs://bafybeiemxf5abjwjbikoz4mc3a3dla6ual3jsgpdr4cjr3oz3evfyavhwq/

- https://example.com/my-web2-claim.json

> The following is an example SIWE Message with an implicit scheme and explicit port:

example.com:3388 wants you to sign in with your Ethereum account:

> The following is an example SIWE Message with an explicit scheme:

https://example.com wants you to sign in with your Ethereum account:

### Signing and Verifying Messages with Ethereum Accounts

- For Externally Owned Accounts (EOAs), the verification method specified in ERC-191 MUST be used.

> For Externally Owned Accounts (EOAs), the verification method specified in ERC-191 MUST be used.

- For Contract Accounts,

      The verification method specified in ERC-1271 SHOULD be used, and if it is not, the implementer MUST clearly define the verification method to attain security and interoperability for both wallets and relying parties.

      When performing ERC-1271 signature verification, the contract performing the verification MUST be resolved from the specified chain-id.

      Implementers SHOULD take into consideration that ERC-1271 implementations are not required to be pure functions, and can return different results for the same inputs depending on blockchain state. This can affect the security model and session validation rules. For example, a service with ERC-1271 signing enabled could rely on webhooks to receive notifications when state affecting the results is changed. When it receives a notification, it invalidates any matching sessions.

> For Contract Accounts,

- The verification method specified in ERC-1271 SHOULD be used, and if it is not, the implementer MUST clearly define the verification method to attain security and interoperability for both wallets and relying parties.

ERC-1271

- When performing ERC-1271 signature verification, the contract performing the verification MUST be resolved from the specified chain-id.

- Implementers SHOULD take into consideration that ERC-1271 implementations are not required to be pure functions, and can return different results for the same inputs depending on blockchain state. This can affect the security model and session validation rules. For example, a service with ERC-1271 signing enabled could rely on webhooks to receive notifications when state affecting the results is changed. When it receives a notification, it invalidates any matching sessions.

### Resolving Ethereum Name Service (ENS) Data

- The relying party or wallet MAY additionally perform resolution of ENS data, as this can improve the user experience by displaying human-friendly information that is related to the address. Resolvable ENS data include:

      The primary ENS name.

      The ENS avatar.

      Any other resolvable resources specified in the ENS documentation.

- The primary ENS name.

primary ENS name

- The ENS avatar.

- Any other resolvable resources specified in the ENS documentation.

- If resolution of ENS data is performed, implementers SHOULD take precautions to preserve user privacy and consent, as their address could be forwarded to third party services as part of the resolution process.

### Relying Party Implementer Steps

#### Specifying the Request Origin

- The domain and, if present, the scheme, in the SIWE Message MUST correspond to the origin from where the signing request was made. For instance, if the signing request is made within a cross-origin iframe embedded in a parent browser window, the domain (and, if present, the scheme) have to match the origin of the iframe, rather than the origin of the parent. This is crucial to prevent the iframe from falsely asserting the origin of one of its ancestor windows for security reasons. This behavior is enforced by conforming wallets.

#### Verifying a signed Message

- The SIWE Message MUST be checked for conformance to the ABNF Message Format in the previous sections, checked against expected values after parsing (e.g., expiration-time, nonce, request-uri etc.), and its signature MUST be checked as defined in Signing and Verifying Messages with Ethereum Accounts.

request-uri

#### Creating Sessions

- Sessions MUST be bound to the address and not to further resolved resources that can change.

#### Interpreting and resolving Resources

- Implementers SHOULD ensure that URIs in the listed resources are human-friendly when expressed in plaintext form.

- The interpretation of the listed resources in the SIWE Message is out of scope of this specification.

### Wallet Implementer Steps

#### Verifying the Message Format

- The full SIWE message MUST be checked for conformance to the ABNF defined in ABNF Message Format.

- Wallet implementers SHOULD warn users if the substring "wants you to sign in

with your Ethereum account" appears anywhere in an ERC-191 message signing

request unless the message fully conforms to the format defined ABNF Message Format.

"wants you to sign in

with your Ethereum account"

#### Verifying the Request Origin

- Wallet implementers MUST prevent phishing attacks by verifying the origin of the request against the scheme and domain fields in the SIWE Message. For example, when processing the SIWE message beginning with "example.com wants you to sign in...", the wallet checks that the request actually originated from https://example.com.

"example.com wants you to sign in..."

https://example.com

- The origin SHOULD be read from a trusted data source such as the browser window or over WalletConnect (ERC-1328) sessions for comparison against the signing message contents.

ERC-1328

- Wallet implementers MAY warn instead of rejecting the verification if the origin is pointing to localhost.

> The following is a RECOMMENDED algorithm for Wallets to conform with the requirements on request origin verification defined by this specification.

> The algorithm takes the following input variables:

- fields from the SIWE message.

- origin of the signing request - in the case of a browser wallet implementation - the origin of the page which requested the signin via the provider.

origin

- allowedSchemes - a list of schemes allowed by the Wallet.

allowedSchemes

- defaultScheme - a scheme to assume when none was provided. Wallet implementers in the browser SHOULD use https.

defaultScheme

https

- developer mode indication - a setting deciding if certain risks should be a warning instead of rejection. Can be manually configured or derived from origin being localhost.

> The algorithm is described as follows:

- If scheme was not provided, then assign defaultScheme as scheme.

- If scheme is not contained in allowedSchemes, then the scheme is not expected and the Wallet MUST reject the request. Wallet implementers in the browser SHOULD limit the list of allowedSchemes to just 'https' unless a developer mode is activated.

'https'

- If scheme does not match the scheme of origin, the Wallet SHOULD reject the request. Wallet implementers MAY show a warning instead of rejecting the request if a developer mode is activated. In that case the Wallet continues processing the request.

- If the host part of the domain and origin do not match, the Wallet MUST reject the request unless the Wallet is in developer mode. In developer mode the Wallet MAY show a warning instead and continues processing the request.

host

- If domain and origin have mismatching subdomains, the Wallet SHOULD reject the request unless the Wallet is in developer mode. In developer mode the Wallet MAY show a warning instead and continues processing the request.

- Let port be the port component of domain, and if no port is contained in domain, assign port the default port specified for the scheme.

port

- If port is not empty, then the Wallet SHOULD show a warning if the port does not match the port of origin.

- If port is empty, then the Wallet MAY show a warning if origin contains a specific port. (Note ‘https’ has a default port of 443 so this only applies if allowedSchemes contain unusual schemes)

- Return request origin verification completed.

#### Creating Sign-In with Ethereum Interfaces

- Wallet implementers MUST display to the user the following fields from the SIWE Message request by default and prior to signing, if they are present: scheme, domain, address, statement, and resources. Other present fields MUST also be made available to the user prior to signing either by default or through an extended interface.

- Wallet implementers displaying a plaintext SIWE Message to the user SHOULD require the user to scroll to the bottom of the text area prior to signing.

- Wallet implementers MAY construct a custom SIWE user interface by parsing the ABNF terms into data elements for use in the interface. The display rules above still apply to custom interfaces.

#### Supporting internationalization (i18n)

- After successfully parsing the message into ABNF terms, translation MAY happen at the UX level per human language.

## Rationale

### Requirements

> Write a specification for how Sign-In with Ethereum should work. The specification should be simple and generally follow existing practices. Avoid feature bloat, particularly the inclusion of lesser-used projects who see getting into the specification as a means of gaining adoption. The core specification should be decentralized, open, non-proprietary, and have long-term viability. It should have no dependence on a centralized server except for the servers already being run by the application that the user is signing in to. The basic specification should include: Ethereum accounts used for authentication, ENS names for usernames (via reverse resolution), and data from the ENS name’s text records for additional profile information (e.g. avatar, social media handles, etc).

> Additional functional requirements:

- The user must be presented a human-understandable interface prior to signing, mostly free of machine-targeted artifacts such as JSON blobs, hex codes (aside from the Ethereum address), and baseXX-encoded strings.

- The application server must be able to implement fully usable support for its end without forcing a change in the wallets.

- There must be a simple and straightforward upgrade path for both applications and wallets already using Ethereum account-based signing for authentication.

- There must be facilities and guidelines for adequate mitigation of Man-in-the-Middle (MITM) attacks, replay attacks, and malicious signing requests.

### Design Goals

- Human-Friendly

- Simple to Implement

- Secure

- Machine Readable

- Extensible

### Technical Decisions

- Why ERC-191 (Signed Data Standard) over EIP-712 (Ethereum typed structured data hashing and signing)

      ERC-191 is already broadly supported across wallets UX, while EIP-712 support for friendly user display is pending. (1, 2, 3, 4)

      ERC-191 is simple to implement using a pre-set prefix prior to signing, while EIP-712 is more complex to implement requiring the further implementations of a bespoke Solidity-inspired type system, RLP-based encoding format, and custom keccak-based hashing scheme. (2)

      

        ERC-191 produces more human-readable messages, while EIP-712 creates signing outputs for machine consumption, with most wallets not displaying the payload to be signed in a manner friendly to humans. (1)

      EIP-712 has the advantage of on-chain representation and on-chain verifiability, such as for their use in metatransactions, but this feature is not relevant for the specification’s scope. (2)

EIP-712

- ERC-191 is already broadly supported across wallets UX, while EIP-712 support for friendly user display is pending. (1, 2, 3, 4)

- ERC-191 is simple to implement using a pre-set prefix prior to signing, while EIP-712 is more complex to implement requiring the further implementations of a bespoke Solidity-inspired type system, RLP-based encoding format, and custom keccak-based hashing scheme. (2)

- ERC-191 produces more human-readable messages, while EIP-712 creates signing outputs for machine consumption, with most wallets not displaying the payload to be signed in a manner friendly to humans. (1)

> ERC-191 produces more human-readable messages, while EIP-712 creates signing outputs for machine consumption, with most wallets not displaying the payload to be signed in a manner friendly to humans. (1)

- EIP-712 has the advantage of on-chain representation and on-chain verifiability, such as for their use in metatransactions, but this feature is not relevant for the specification’s scope. (2)

- Why not use JWTs? Wallets don’t support JWTs. The keccak hash function is not assigned by IANA for use as a JOSE algorithm. (2, 3)

- Why not use YAML or YAML with exceptions? YAML is loose compared to ABNF, which can readily express character set limiting, required ordering, and strict whitespacing. (2, 3)

### Out of Scope

> The following concerns are out of scope for this version of the specification to define:

- Additional authentication not based on Ethereum addresses.

- Authorization to server resources.

- Interpretation of the URIs in the resources field as claims or other resources.

- The specific mechanisms to ensure domain-binding.

- The specific mechanisms to generate nonces and evaluation of their appropriateness.

- Protocols for use without TLS connections.

### Considerations for Forwards Compatibility

> The following items are considered for future support either through an iteration of this specification or new work items using this specification as a dependency.

- Possible support for Decentralized Identifiers and Verifiable Credentials.

- Possible cross-chain support.

- Possible SIOPv2 support.

- Possible future support for EIP-712.

- Version interpretation rules, e.g., sign with minor revision greater than understood, but not greater major version.

## Backwards Compatibility

- Most wallet implementations already support ERC-191, so this is used as a base pattern with additional features.

- Requirements were gathered from existing implementations of similar sign-in workflows, including statements to allow the user to accept a Terms of Service, nonces for replay protection, and inclusion of the Ethereum address itself in the message.

## Reference Implementation

> A reference implementation is available here.

here

## Security Considerations

### Identifier Reuse

- Towards perfect privacy, it would be ideal to use a new uncorrelated identifier (e.g., Ethereum address) per digital interaction, selectively disclosing the information required and no more.

- This concern is less relevant to certain user demographics who are likely to be early adopters of this specification, such as those who manage an Ethereum address and/or ENS names intentionally associated with their public presence. These users often prefer identifier reuse to maintain a single correlated identity across many services.

- This consideration will become increasingly important with mainstream adoption. There are several ways to move towards this model, such as using HD wallets, signed delegations, and zero-knowledge proofs. However, these approaches are out of scope for this specification and better suited for follow-on specifications.

### Key Management

- Sign-In with Ethereum gives users control through their keys. This is additional responsibility that mainstream users may not be accustomed to accepting, and key management is a hard problem especially for individuals. For example, there is no “forgot password” button as centralized identity providers commonly implement.

- Early adopters of this specification are likely to be already adept at key management, so this consideration becomes more relevant with mainstream adoption.

- Certain wallets can use smart contracts and multisigs to provide an enhanced user experience with respect to key usage and key recovery, and these can be supported via ERC-1271 signing.

### Wallet and Relying Party combined Security

- Both the wallet and relying party have to implement this specification for improved security to the end user. Specifically, the wallet has to confirm that the SIWE Message is for the correct request origin or provide the user means to do so manually (such as instructions to visually confirming the correct domain in a TLS-protected website prior to connecting via QR code or deeplink), otherwise the user is subject to phishing attacks.

### Minimizing Wallet and Server Interaction

- In some implementations of wallet sign-in workflows, the server first sends parameters of the SIWE Message to the wallet. Others generate the SIWE message for signing entirely in the client side (e.g., dapps). The latter approach without initial server interaction SHOULD be preferred when there is a user privacy advantage by minimizing wallet-server interaction. Often, the backend server first produces a nonce to prevent replay attacks, which it verifies after signing. Privacy-preserving alternatives are suggested in the next section on preventing replay attacks.

- Before the wallet presents the SIWE message signing request to the user, it MAY consult the server for the proper contents of the message to be signed, such as an acceptable nonce or requested set of resources. When communicating to the server, the wallet SHOULD take precautions to protect user privacy by mitigating user information revealed as much as possible.

- Prior to signing, the wallet MAY consult the user for preferences, such as the selection of one address out of many, or a preferred ENS name out of many.

### Preventing Replay Attacks

- A nonce SHOULD be selected per session initiation with enough entropy to prevent replay attacks, a man-in-the-middle attack in which an attacker is able to capture the user’s signature and resend it to establish a new session for themselves.

- Implementers MAY consider using privacy-preserving yet widely-available nonce values, such as one derived from a recent Ethereum block hash or a recent Unix timestamp.

### Preventing Phishing Attacks

- To prevent phishing attacks Wallets have to implement request origin verification as described in Verifying the Request Origin.

Verifying the Request Origin

### Channel Security

- For web-based applications, all communications SHOULD use HTTPS to prevent man-in-the-middle attacks on the message signing.

- When using protocols other than HTTPS, all communications SHOULD be protected with proper techniques to maintain confidentiality, data integrity, and sender/receiver authenticity.

### Session Invalidation

> There are several cases where an implementer SHOULD check for state changes as they relate to sessions.

- If an ERC-1271 implementation or dependent data changes the signature computation, the server SHOULD invalidate sessions appropriately.

- If any resources specified in resources change, the server SHOULD invalidate sessions appropriately. However, the interpretation of resources is out of scope of this specification.

### Maximum Lengths for ABNF Terms

- While this specification does not contain normative requirements around maximum string lengths, implementers SHOULD choose maximum lengths for terms that strike a balance across the prevention of denial of service attacks, support for arbitrary use cases, and user readability.

## Copyright

> Copyright and related rights waived via CC0.

CC0

## Citation

> Please cite this document as:

> Wayne Chang (@wyc), Gregory Rocco (@obstropolos), Brantly Millegan (@brantlymillegan), Nick Johnson (@Arachnid), Oliver Terbu (@awoie), "ERC-4361: Sign-In with Ethereum [DRAFT]," Ethereum Improvement Proposals, no. 4361, October 2021. [Online serial]. Available: https://eips.ethereum.org/EIPS/eip-4361.
