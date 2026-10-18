# A binnacle plugin in five minutes

1. Copy this folder to the root of a new repository. Rename the plugin in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (the marketplace's `name` and the plugin's), `types/index.d.ts` and `NAME` in `hooks/register.ts`.
2. Install binnacle from its marketplace (`claude plugin install binnacle@binnacle`).
3. Run `claude --plugin-dir ./` in a project: `✋ hello` shows in the footer.
4. Change `hooks/logic.ts` and `hooks/register.ts`; `claude plugin validate .` and `claude plugin test .` check them. `tests/binnacle-mock.tsx` stands in for binnacle in tests (they load no dependency): it records what you register and has buttons that press yours.
5. Go through `CHECKLIST.md` in a real session.

## Publish it

The repository is its own marketplace: `.claude-plugin/marketplace.json` lists the plugin (`"source": "./"`) and allows its dependency on binnacle's marketplace (`"allowCrossMarketplaceDependenciesOn": ["binnacle"]`). Push it, and anyone installs it with:

    claude plugin marketplace add <binnacle's marketplace>     # once, for binnacle itself
    claude plugin marketplace add <your repository>
    claude plugin install binnacle-hello@binnacle-hello        # binnacle comes along

Nothing in binnacle or its marketplace changes. Bump `version` in `plugin.json` for every release: Claude Code does not update a plugin whose version did not change.

Listing it in binnacle's marketplace as well is optional: it lets people who added only that marketplace find and install it. Add an entry with your repository and a full commit `sha` to its catalog and open a merge request.

The interface: [binnacle's docs/plugins.md](https://github.com/mkloveyy/binnacle/blob/main/docs/plugins.md).
