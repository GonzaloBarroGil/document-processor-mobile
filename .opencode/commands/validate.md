---
description: Run lint, typecheck, and full test suite with coverage report
agent: validator
subtask: true
model: deepseek/deepseek-v4-pro
---
Run the complete CI validation suite:
1. pnpm lint
2. pnpm typecheck
3. pnpm test
4. pnpm test -- --coverage

Report results against constitutional quality standards.
Coverage target: >= 80%.
Flag any violations or gaps for HITL review.
