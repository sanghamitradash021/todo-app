# /pr — Prepare Commit + PR

Prepare PR for: $ARGUMENTS

## Steps

1. Run the full quality suite (fix failures before proceeding):
   ```bash
   npm run build              # 0 errors, 0 warnings
   npm run lint               # 0 errors, 0 warnings
   npm run test               # all green
   npx commitlint --from HEAD~1
   ```

2. Run `git diff main --stat` to summarize what changed

3. Read `openspec/archive/$ARGUMENTS/proposal.md` for the PR summary

4. Generate the commit message in the correct format:
   ```
   feat(scope): description

   - what: key change 1
   - what: key change 2
   - frs: FRS sections covered

   Relates to #<ticket>
   ```

5. Ask: `"Run git add . && git commit? [y/n]"`

6. Generate the full PR description:

```markdown
## What
<one paragraph summary from proposal>

## FRS Requirements Covered
- AC-XX.X: <description> ✅
- AC-XX.X: <description> ✅

## Spec Artifacts
- openspec/specs/ (updated)
- openspec/archive/$ARGUMENTS/proposal.md

## Checklist
- [ ] All FRS acceptance criteria implemented + tested
- [ ] All spec scenarios implemented + tested
- [ ] Build: 0 errors, 0 warnings
- [ ] Lint: 0 errors, 0 warnings
- [ ] Tests: all green
- [ ] commitlint: valid
- [ ] Smoke tested locally
- [ ] openspec archive complete
- [ ] No console.log in source
- [ ] No hardcoded secrets or magic strings
```

7. Ask: `"Run git push? [y/n]"`
