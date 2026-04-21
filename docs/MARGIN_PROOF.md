# AgentStack — Margin Proof & Unit Economics

## 1. Hackathon Requirement: 50+ Transactions
AgentStack has demonstrated **60 on-chain transactions** on the Arc L1 Devnet via an automated stress test.

- **Test Date:** April 21, 2026
- **Test Script:** `scripts/stress_test.ts`
- **Total Requests:** 20
- **Transactions Per Request:** 3 
  - (1) User → Orchestrator Payment
  - (2) Orchestrator → Worker A (Market Data)
  - (3) Orchestrator → Worker B (Sentiment)
- **Total On-Chain Events:** 60

## 2. Unit Economics (Per Action)

| Participant | Role | Inflow | Outflow | Net |
|---|---|---|---|---|
| **End User** | Developer | - | $0.0100 | ($0.0100) |
| **Orchestrator** | AgentStack | $0.0100 | $0.0040 | **+$0.0060** |
| **Worker A** | Market Data | $0.0020 | - | **+$0.0020** |
| **Worker B** | Sentiment | $0.0020 | - | **+$0.0020** |
| **Arc L1** | Gas Layer | - | $0.0000 | $0.0000 |

## 3. The Arc L1 Advantage (Margin Proof)

On a traditional L1 or L2 (e.g., Ethereum, Base, Polygon), a single USDC transfer costs between **$0.01 and $2.00** in gas.

At **$0.01 per request**, a micro-transaction model on traditional chains has **negative margin**:
- Cost of Goods Sold (Gas): >$0.01
- Revenue: $0.01
- **Profit: ($0.XX) Loss**

**AgentStack on Arc L1:**
- Cost of Goods Sold (Gas): **$0.0000**
- Revenue: $0.0100
- **Gross Margin: 60%**

This proves that Arc L1 + Circle Nanopayments unlock the professionalization of the Agentic Economy by making micro-service hiring profitable for the first time.
