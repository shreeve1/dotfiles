# Neovim Config

Kickstart.nvim-based config with Python + JS/TS LSP, custom "burns" colorscheme, and lazy.nvim plugin manager.

## Prerequisites

### Homebrew Packages

```sh
brew install neovim          # v0.11+
brew install ripgrep          # telescope live grep
brew install fd               # telescope file finder
brew install make             # telescope-fzf-native + LuaSnip build
brew install tree-sitter      # treesitter parser library
brew install tree-sitter-cli  # treesitter parser compiler (TSInstall)
```

### Language Runtimes

These are needed for LSP servers and formatters to work:

| Runtime | Used by | Install |
|---------|---------|---------|
| Node.js | pyright, ts_ls, prettier | `brew install node` |
| Python 3 | black, isort | `brew install python` |

### Auto-installed by Mason (no manual action)

On first launch, Mason will download and install:

- **LSP servers:** pyright (Python), ts_ls (TypeScript/JavaScript), lua_ls (Lua)
- **Formatters:** stylua (Lua), prettier (JS/TS/HTML/CSS/JSON), black (Python), isort (Python imports)

## Install

Symlink into place (handled by `install.sh` in dotfiles root):

```sh
# Or manually:
mkdir -p ~/.config/nvim
ln -sf ~/dotfiles/.config/nvim/init.lua ~/.config/nvim/init.lua
ln -sf ~/dotfiles/.config/nvim/lazy-lock.json ~/.config/nvim/lazy-lock.json
```

## First Launch

1. Run `nvim` — lazy.nvim will auto-install all plugins
2. Mason will install LSP servers and formatters in the background (watch progress via `:Mason`)
3. Treesitter parsers compile on first load (requires `tree-sitter-cli`)
4. Run `:checkhealth` to verify everything is working

## Key Bindings

Leader key is **Space**.

| Keys | Action |
|------|--------|
| `Space sf` | Find files |
| `Space sg` | Live grep |
| `Space sh` | Search help |
| `Space e` | Toggle file explorer |
| `Space f` | Format buffer |
| `Space q` | Diagnostics quickfix |
| `grd` | Go to definition |
| `grr` | Go to references |
| `grn` | Rename symbol |
| `gra` | Code action |
| `]d / [d` | Next/prev diagnostic |
| `]h / [h` | Next/prev git hunk |
| `Ctrl+h/j/k/l` | Navigate windows |

## Theme

Uses the inline "burns" colorscheme — a monochromatic red palette matching the Ghostty terminal and OpenCode themes. No theme plugin required.
