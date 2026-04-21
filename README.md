# AgentStack — The Agentic Economy on Arc

**AgentStack** is an orchestration gateway for autonomous agent-to-agent nanopayments. It allows AI agents to hire specialist services, pay per-action in USDC, and receive results trustlessly — powered by **Circle Nanopayments** and **Arc L1**.

## 🚀 The Vision
In the future, agents won't have credit cards or SaaS subscriptions. They will have wallets. 
AgentStack provides the economic primitive needed for agents to build complex workflows by hiring each other in real-time.

## ✨ Key Features
- **x402 Handshake**: HTTP-native payment challenge/response flow.
- **Recursive Hiring**: Orchestrator decomposes tasks and hires Workers on the fly.
- **Zero-Gas Settlement**: Every transaction on Arc L1 costs $0.00 in gas.
- **Margin Receipts**: Real-time transparency of unit economics (revenue, cost, profit).

## 🛠 Tech Stack
- **Ledger**: Arc L1 (EVM-compatible, USDC gas token)
- **Payments**: Circle Nanopayments API
- **Logic**: Node.js / TypeScript / Viem
- **Worker Interface**: REST API with x402 headers

## 🏃 Quick Start

### 1. Prerequisites
- Circle Developer Account
- Node.js v18+
- funded wallets on Arc Devnet

### 2. Setup
```bash
git clone https://github.com/your-repo/agent-stack-arc
cd agent-stack-arc
npm install
cp .env.example .env
# Fill in your Circle API Key and Private Keys
```

### 3. Run Smoke Test
```bash
npx tsx scripts/smoke_test.ts
```

### 4. Run Stress Test (60 Transactions)
```bash
npx tsx scripts/stress_test.ts
```

## 📊 Margin Proof
See [docs/MARGIN_PROOF.md](docs/MARGIN_PROOF.md) for a detailed breakdown of how we achieved 60% gross margins on sub-cent transactions.

## 🤝 Circle Feedback
See [docs/CIRCLE_FEEDBACK.md](docs/CIRCLE_FEEDBACK.md) for our hackathon platform feedback.

---
Built for the **Agentic Economy on Arc** Hackathon (April 2026).
