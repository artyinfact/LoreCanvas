# LoreCanvas

LoreCanvas is a theatrical virtual tabletop engine for story-driven board games.
The current build is the first pure-manual MVP: it focuses on image asset import,
graph-board setup, generic object state, and local scenario save/load.

## Current Scope

This version supports:

- Edit/Run modes for a manual board prototype.
- Image asset import from a full `assets` folder, a category folder, or individual images.
- Six asset categories: `board`, `pawn`, `token`, `tile`, `card`, and `other`.
- A node-graph board: background image, Locations, Edges, and placed object images.
- Generic JSON state panels for Board, Object, Location, and Edge state.
- Run-mode manual operations: move bound objects between Locations, adjust counts, and move card-like objects to zone ids.
- Browser-local scenario Save/Load for the current manual workflow.

This version intentionally does not include online multiplayer, automatic setup parsing,
movement validation, rule triggers, Cut-in animations, or game-specific LOTR logic.

## Requirements

- Node.js `>=18.19.0`
- npm
- Windows PowerShell, CMD, or a POSIX/Git Bash shell

The repository is developed and validated on Windows through the PowerShell harness.

## Install And Verify

From the project root:

```powershell
cd C:\Users\xyzg\Downloads\LoreCanvas
.\init.ps1
```

Equivalent commands:

```powershell
npm.cmd run harness
.\init.cmd
```

On POSIX shells or Git Bash:

```sh
./init.sh
```

The harness installs dependencies when needed, validates `feature_list.json`, runs
TypeScript checks, and runs the full Vitest suite.

## Start The App

```powershell
npm.cmd run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173/
```

If `.\init.ps1` fails because a Vite dev server is locking files under `node_modules`,
stop the dev server and run the harness again.

## Recommended Asset Pack Layout

For a complete board-game image pack, use this structure:

```text
assets/
  board/
    main-board.png
  pawn/
    hero.png
    monster.png
  token/
    hope-marker.png
    dice-face-1.png
  tile/
    haven.png
    terrain-overlay.png
  card/
    event-001.png
    reference-actions.png
  other/
    dice-tower.png
    cutin-background.png
```

The full-folder importer infers categories from these folder names. Category-specific
Folder/Image import buttons force the selected category even when the files are not
inside an `assets/<category>` folder.

## Manual Workflow

1. In Edit mode, import images from the left `Image Assets` panel.
2. Set or confirm the Board image. The first imported `board` asset is used automatically when no board exists.
3. Use `Add Location` to place graph Locations on the board.
4. Use `Add Edge` to connect Locations.
5. Drag `pawn`, `token`, `tile`, or `card` assets from the asset list onto the board.
6. Select a Location, Edge, or placed object and edit its JSON state in the Inspector.
7. Click `Run` to freeze the setup and play manually.
8. In Run mode, select an object to move it by Location, adjust its count, or set a card/zone id.
9. Click `Save` to store the current scenario snapshot in browser localStorage.
10. Click `Load` to restore the last saved local scenario.

## State Panels

- `Board State`: global scenario state such as trackers, decks, event piles, and setup variables.
- `Object State`: arbitrary state for the selected Entity/Object.
- `Location State`: semantic state for a Location, such as region, recruitment, terrain, haven flags, or notes.
- `Edge State`: semantic state for graph connections, such as directed movement, traversal cost, locks, or notes.

The MVP JSON editors apply objects as shallow patches. To clear a field reliably,
set it to `null` or replace the scenario by loading a saved snapshot.

## Save/Load Notes

The current `Save`/`Load` buttons are browser-local MVP controls. They preserve the
scenario JSON state in localStorage, including asset references and generated thumbnail
references, but they do not create a portable binary archive.

Practical implications:

- Save/Load works best within the same browser session after importing the image pack.
- Imported images are browser object URLs, so a future portable `.lorecanvas` package
  still needs asset-file resolution or embedded assets.
- Keep the source `assets` folder as the durable source of image files.

## Development Commands

```powershell
npm.cmd run check-types
npm.cmd run test
npm.cmd run build
.\init.ps1
```

`local-fixtures/lotr/` is ignored by git and is only for local validation. Product code
must remain generic and must not hard-code LOTR rules or identifiers.
