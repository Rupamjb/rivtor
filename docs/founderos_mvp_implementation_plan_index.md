# FounderOS MVP Implementation Plan Index

This plan is split into delivery phases to match the 2-day PRD build order and keep scope tight.

## Phase Files

1. `docs/founderos_mvp_phase_01_setup_next_fastapi.md`
2. `docs/founderos_mvp_phase_02_auth_and_workspace_shell.md`
3. `docs/founderos_mvp_phase_03_company_brain_ingestion_retrieval.md`
4. `docs/founderos_mvp_phase_04_chat_streaming_and_memory_context.md`
5. `docs/founderos_mvp_phase_05_research_agent.md`
6. `docs/founderos_mvp_phase_06_content_agent.md`
7. `docs/founderos_mvp_phase_07_approval_system_and_activity.md`
8. `docs/founderos_mvp_phase_08_linkedin_publishing.md`
9. `docs/founderos_mvp_phase_09_voice_transcription.md`
10. `docs/founderos_mvp_phase_10_polish_deploy_demo.md`

## MVP Guardrails (Apply To Every Phase)

- Keep implementation demo-focused and single-user.
- Reuse landing-page UI philosophy (same tokens, typography, motion language).
- Avoid timeline traps from PRD (no Redis/Celery/K8s/autonomous agents).
- Ship thin vertical slices with visible user value.
