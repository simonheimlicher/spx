# Story: Tool Discovery Infrastructure

## Acceptance Criteria

- [ ] `discoverTool()` function finds tools via `require.resolve()`
- [ ] Falls back to project `node_modules/.bin/<tool>`
- [ ] Falls back to system PATH
- [ ] Returns source information (bundled/project/global)
- [ ] Returns helpful error when tool not found
- [ ] Graceful skip message format: `⏭ Skipping <step> (<tool> not available)`

## Implementation Tasks

1. Create `src/validation/discovery/tool-finder.ts` with interfaces:
   ```typescript
   export interface ToolLocation {
     tool: string;
     path: string;
     source: "bundled" | "project" | "global";
   }

   export interface ToolNotFound {
     tool: string;
     reason: string;
   }

   export type ToolDiscoveryResult =
     | { found: true; location: ToolLocation }
     | { found: false; notFound: ToolNotFound };
   ```

2. Implement three-tier discovery:
   ```typescript
   export async function discoverTool(
     tool: string,
     options?: { projectRoot?: string },
   ): Promise<ToolDiscoveryResult>;
   ```

3. Discovery order:
   - **Bundled**: Try `require.resolve('<tool>/package.json')` to find bundled version
   - **Project**: Check `<projectRoot>/node_modules/.bin/<tool>`
   - **Global**: Use `which` package or `execSync('which <tool>')`

4. Create helper for graceful skip messages:
   ```typescript
   export function formatSkipMessage(
     stepName: string,
     result: ToolDiscoveryResult,
   ): string;
   ```

## Testing Strategy

**Level 1 (Unit):**

- Test `discoverTool()` with mocked `require.resolve` and filesystem
- Test returns correct source for each discovery tier
- Test formats skip messages correctly
- Test handles missing tools gracefully

**Level 2 (Integration):**

- Test finds real `tsc` in project node_modules
- Test finds real system tools in PATH
- Test graceful degradation with modified PATH

## Definition of Done

- `discoverTool()` exported from `src/validation/discovery/tool-finder.ts`
- All three discovery tiers implemented
- Skip message formatting works
- Code compiles with `npm run typecheck`
- Unit tests pass
