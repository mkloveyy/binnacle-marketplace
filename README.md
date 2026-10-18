# binnacle marketplace

binnacle and the plugins built on it.

## Add it

    claude plugin marketplace add mkloveyy/binnacle-marketplace
    claude plugin install binnacle@binnacle

## Plugins

| Plugin | What it does |
|---|---|
| `binnacle` | The status line, guards, activity record, transcript search, and the plugin interface |
| `binnacle-example-pack` | An example rule pack: refuses piping a download into a shell |

Install any of them with `claude plugin install <name>@binnacle`; binnacle comes along.

## Write one

Start from `template/` and read binnacle's `docs/plugins.md`. A plugin lists `"dependencies": ["binnacle@binnacle"]`.

- **Publish it yourself (no change here):** the template's repository is its own marketplace, with `"allowCrossMarketplaceDependenciesOn": ["binnacle"]` in its catalog. People add this marketplace once for binnacle, add yours, and install your plugin; binnacle comes along.
- **List it here too (optional):** add an entry with your repository (`git-subdir` or `github`) and a full commit `sha` to this catalog and open a merge request, so people who added only this marketplace find it.

Bump your plugin's version for every release.
