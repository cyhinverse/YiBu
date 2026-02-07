# PLAN: server-refactor

## Summary
Refactor the server architecture into a modular structure with a repository layer and introduce a standardized response envelope. Update the client to align with the new response envelope. This plan is planning-only and does not include code changes.

## Context
- Requested deliverables: modular server architecture, repository layer, response envelope, client updates
- Project-planner rules: no existing plan files, `CODEBASE.md` is missing

## Goals
- Modularize server architecture into clear layers/modules
- Introduce repository layer for data access abstraction
- Implement a standardized response envelope for server responses
- Update client to handle the new response envelope

## Non-Goals
- Feature expansion unrelated to refactor
- Schema migrations beyond what the repository layer requires
- UI/UX redesign on the client

## Tasks
1. **Discovery**
   - Inspect current server architecture and endpoints
   - Inventory server response shapes and client parsing assumptions
   - Identify data access patterns for repository extraction
2. **Design**
   - Define module boundaries (routes/controllers/services/repositories)
   - Specify response envelope contract (shape, error fields, metadata)
   - Decide error handling conventions (HTTP status vs envelope status)
3. **Server Refactor**
   - Create module skeletons and move route logic into controllers/services
   - Implement repository interfaces and concrete data access
   - Update handlers to use repositories and emit response envelope
   - Add shared response helpers/utilities
4. **Client Update**
   - Update API client to parse response envelope
   - Adjust call sites for new response shape
   - Update error handling with envelope semantics
5. **Documentation**
   - Document response envelope contract and usage patterns
   - Add architectural overview for new modular structure
6. **Verification**
   - Run unit/integration tests (server and client if present)
   - Manual smoke test for key flows

## Dependencies
- Existing server endpoint list and routing structure
- Data layer/storage mechanism details
- Client API abstractions and response parsing logic

## Agents
- **Lead engineer**: owns architecture decisions and repository contracts
- **Server engineer**: performs server refactor and repository implementation
- **Client engineer**: updates client API handling
- **QA/Reviewer**: validates response envelope and regression checks

## Rollback Plan
- Keep changes in a single branch with incremental commits
- If response envelope breaks clients, revert to previous response shape and deploy
- If repository layer introduces issues, revert to pre-refactor server modules
- Maintain a feature flag or compatibility adapter if feasible

## Verification Checklist
- [ ] Server endpoints return the standardized response envelope
- [ ] Client successfully parses envelope for success and error cases
- [ ] Repository layer covers all data access paths
- [ ] Error handling matches envelope contract
- [ ] Tests pass (server and client)
- [ ] Manual smoke test for core flows
