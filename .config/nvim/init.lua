-- Kickstart.nvim based config
-- Customized with: Python + JavaScript/TypeScript LSP, autopairs, file explorer

-- Set <space> as the leader key (must be before plugins load)
vim.g.mapleader = ' '
vim.g.maplocalleader = ' '

vim.g.have_nerd_font = true

-- Disable netrw (required by nvim-tree; must run before plugins load)
vim.g.loaded_netrw = 1
vim.g.loaded_netrwPlugin = 1

-- ============================================================================
-- Options
-- ============================================================================

vim.o.number = true           -- Line numbers
vim.o.relativenumber = true   -- Relative line numbers (helps with jumping)
vim.o.mouse = 'a'             -- Enable mouse
vim.o.showmode = false         -- Mode is shown in statusline
vim.o.breakindent = true      -- Wrapped lines respect indent
vim.o.undofile = true         -- Persistent undo
vim.o.ignorecase = true       -- Case-insensitive search...
vim.o.smartcase = true        -- ...unless you use capitals
vim.o.signcolumn = 'yes'     -- Always show sign column
vim.o.updatetime = 250        -- Faster CursorHold
vim.o.timeoutlen = 300        -- Faster which-key popup
vim.o.splitright = true       -- New splits go right
vim.o.splitbelow = true       -- New splits go below
vim.o.list = true             -- Show whitespace chars
vim.opt.listchars = { tab = '>> ', trail = '.', nbsp = '_' }
vim.o.inccommand = 'split'   -- Live preview for substitutions
vim.o.cursorline = true       -- Highlight current line
vim.o.scrolloff = 10          -- Keep 10 lines above/below cursor
vim.o.confirm = true          -- Ask to save instead of error
vim.o.tabstop = 4             -- Tab width
vim.o.shiftwidth = 4          -- Indent width
vim.o.expandtab = true        -- Use spaces not tabs

-- Sync clipboard with OS. Over SSH, use OSC52 so yanks land in the local
-- terminal clipboard instead of looking for xclip/wl-copy on the remote host.
vim.o.clipboard = 'unnamedplus'
if vim.env.SSH_TTY or vim.env.SSH_CONNECTION then
  local osc52 = require 'vim.ui.clipboard.osc52'
  vim.g.clipboard = {
    name = 'OSC52',
    copy = {
      ['+'] = osc52.copy '+',
      ['*'] = osc52.copy '*',
    },
    paste = {
      ['+'] = osc52.paste '+',
      ['*'] = osc52.paste '*',
    },
  }
end

-- ============================================================================
-- Keymaps
-- ============================================================================

-- jk to escape insert mode
vim.keymap.set('i', 'jk', '<Esc>')

-- Clear search highlights with Esc
vim.keymap.set('n', '<Esc>', '<cmd>nohlsearch<CR>')

-- Diagnostics quickfix
vim.keymap.set('n', '<leader>q', vim.diagnostic.setloclist, { desc = 'Open diagnostic [Q]uickfix list' })

-- Exit terminal mode easier
vim.keymap.set('t', '<Esc><Esc>', '<C-\\><C-n>', { desc = 'Exit terminal mode' })

-- Window navigation with Ctrl+hjkl
vim.keymap.set('n', '<C-h>', '<C-w><C-h>', { desc = 'Move focus left' })
vim.keymap.set('n', '<C-l>', '<C-w><C-l>', { desc = 'Move focus right' })
vim.keymap.set('n', '<C-j>', '<C-w><C-j>', { desc = 'Move focus down' })
vim.keymap.set('n', '<C-k>', '<C-w><C-k>', { desc = 'Move focus up' })

-- Diagnostic config
vim.diagnostic.config {
  severity_sort = true,
  float = { border = 'rounded', source = 'if_many' },
  underline = { severity = { min = vim.diagnostic.severity.WARN } },
  virtual_text = true,
  virtual_lines = false,
  jump = { float = true },
}

-- ============================================================================
-- Autocommands
-- ============================================================================

-- Highlight on yank
vim.api.nvim_create_autocmd('TextYankPost', {
  desc = 'Highlight when yanking text',
  group = vim.api.nvim_create_augroup('kickstart-highlight-yank', { clear = true }),
  callback = function() vim.hl.on_yank() end,
})

-- ============================================================================
-- Install lazy.nvim plugin manager
-- ============================================================================

local lazypath = vim.fn.stdpath 'data' .. '/lazy/lazy.nvim'
if not (vim.uv or vim.loop).fs_stat(lazypath) then
  local out = vim.fn.system { 'git', 'clone', '--filter=blob:none', '--branch=stable', 'https://github.com/folke/lazy.nvim.git', lazypath }
  if vim.v.shell_error ~= 0 then error('Error cloning lazy.nvim:\n' .. out) end
end
vim.opt.rtp:prepend(lazypath)

-- ============================================================================
-- Plugins
-- ============================================================================

require('lazy').setup({

  -- Detect tabstop and shiftwidth automatically
  { 'NMAC427/guess-indent.nvim', opts = {} },

  -- ========================================================================
  -- Git signs in the gutter
  -- ========================================================================
  {
    'lewis6991/gitsigns.nvim',
    opts = {
      signs = {
        add = { text = '+' },
        change = { text = '~' },
        delete = { text = '_' },
        topdelete = { text = '-' },
        changedelete = { text = '~' },
      },
      on_attach = function(bufnr)
        local gs = require 'gitsigns'
        local function map(mode, l, r, opts)
          opts = opts or {}
          opts.buffer = bufnr
          vim.keymap.set(mode, l, r, opts)
        end
        -- Navigation
        map('n', ']h', gs.next_hunk, { desc = 'Next git [H]unk' })
        map('n', '[h', gs.prev_hunk, { desc = 'Prev git [H]unk' })
        -- Actions
        map('n', '<leader>hs', gs.stage_hunk, { desc = 'Git [S]tage hunk' })
        map('n', '<leader>hr', gs.reset_hunk, { desc = 'Git [R]eset hunk' })
        map('n', '<leader>hp', gs.preview_hunk, { desc = 'Git [P]review hunk' })
        map('n', '<leader>hb', gs.blame_line, { desc = 'Git [B]lame line' })
      end,
    },
  },

  -- ========================================================================
  -- Which-key: shows pending keybinds
  -- ========================================================================
  {
    'folke/which-key.nvim',
    event = 'VimEnter',
    opts = {
      delay = 0,
      icons = { mappings = vim.g.have_nerd_font },
      spec = {
        { '<leader>s', group = '[S]earch' },
        { '<leader>t', group = '[T]oggle' },
        { '<leader>h', group = 'Git [H]unk', mode = { 'n', 'v' } },
        { '<leader>e', group = '[E]xplorer' },
      },
    },
  },

  -- ========================================================================
  -- Telescope: fuzzy finder for everything
  -- ========================================================================
  {
    'nvim-telescope/telescope.nvim',
    event = 'VimEnter',
    dependencies = {
      'nvim-lua/plenary.nvim',
      { 'nvim-telescope/telescope-fzf-native.nvim', build = 'make', cond = function() return vim.fn.executable 'make' == 1 end },
      { 'nvim-telescope/telescope-ui-select.nvim' },
      { 'nvim-tree/nvim-web-devicons', enabled = vim.g.have_nerd_font },
    },
    config = function()
      require('telescope').setup {
        extensions = {
          ['ui-select'] = { require('telescope.themes').get_dropdown() },
        },
      }
      pcall(require('telescope').load_extension, 'fzf')
      pcall(require('telescope').load_extension, 'ui-select')

      local builtin = require 'telescope.builtin'
      vim.keymap.set('n', '<leader>sf', builtin.find_files, { desc = '[S]earch [F]iles' })
      vim.keymap.set('n', '<leader>sg', builtin.live_grep, { desc = '[S]earch by [G]rep' })
      vim.keymap.set('n', '<leader>sh', builtin.help_tags, { desc = '[S]earch [H]elp' })
      vim.keymap.set('n', '<leader>sk', builtin.keymaps, { desc = '[S]earch [K]eymaps' })
      vim.keymap.set('n', '<leader>sd', builtin.diagnostics, { desc = '[S]earch [D]iagnostics' })
      vim.keymap.set('n', '<leader>sr', builtin.resume, { desc = '[S]earch [R]esume' })
      vim.keymap.set('n', '<leader>s.', builtin.oldfiles, { desc = '[S]earch Recent Files' })
      vim.keymap.set('n', '<leader>sc', builtin.commands, { desc = '[S]earch [C]ommands' })
      vim.keymap.set({ 'n', 'v' }, '<leader>sw', builtin.grep_string, { desc = '[S]earch current [W]ord' })
      vim.keymap.set('n', '<leader><leader>', builtin.buffers, { desc = '[ ] Find existing buffers' })

      -- Search in current buffer
      vim.keymap.set('n', '<leader>/', function()
        builtin.current_buffer_fuzzy_find(require('telescope.themes').get_dropdown { winblend = 10, previewer = false })
      end, { desc = '[/] Fuzzily search in current buffer' })

      -- Search Neovim config files
      vim.keymap.set('n', '<leader>sn', function()
        builtin.find_files { cwd = vim.fn.stdpath 'config' }
      end, { desc = '[S]earch [N]eovim files' })

      -- LSP keymaps via telescope (attached per buffer)
      vim.api.nvim_create_autocmd('LspAttach', {
        group = vim.api.nvim_create_augroup('telescope-lsp-attach', { clear = true }),
        callback = function(event)
          local buf = event.buf
          vim.keymap.set('n', 'grr', builtin.lsp_references, { buffer = buf, desc = '[G]oto [R]eferences' })
          vim.keymap.set('n', 'gri', builtin.lsp_implementations, { buffer = buf, desc = '[G]oto [I]mplementation' })
          vim.keymap.set('n', 'grd', builtin.lsp_definitions, { buffer = buf, desc = '[G]oto [D]efinition' })
          vim.keymap.set('n', 'grt', builtin.lsp_type_definitions, { buffer = buf, desc = '[G]oto [T]ype Definition' })
          vim.keymap.set('n', 'gO', builtin.lsp_document_symbols, { buffer = buf, desc = 'Document Symbols' })
          vim.keymap.set('n', 'gW', builtin.lsp_dynamic_workspace_symbols, { buffer = buf, desc = 'Workspace Symbols' })
        end,
      })
    end,
  },

  -- ========================================================================
  -- LSP: Language Server Protocol
  -- ========================================================================
  {
    'neovim/nvim-lspconfig',
    dependencies = {
      { 'mason-org/mason.nvim', opts = {} },
      'mason-org/mason-lspconfig.nvim',
      'WhoIsSethDaniel/mason-tool-installer.nvim',
      { 'j-hui/fidget.nvim', opts = {} }, -- LSP progress indicator
    },
    config = function()
      vim.api.nvim_create_autocmd('LspAttach', {
        group = vim.api.nvim_create_augroup('kickstart-lsp-attach', { clear = true }),
        callback = function(event)
          local map = function(keys, func, desc, mode)
            mode = mode or 'n'
            vim.keymap.set(mode, keys, func, { buffer = event.buf, desc = 'LSP: ' .. desc })
          end
          map('grn', vim.lsp.buf.rename, '[R]e[n]ame')
          map('gra', vim.lsp.buf.code_action, '[G]oto Code [A]ction', { 'n', 'x' })
          map('grD', vim.lsp.buf.declaration, '[G]oto [D]eclaration')

          -- Highlight references under cursor
          local client = vim.lsp.get_client_by_id(event.data.client_id)
          if client and client:supports_method('textDocument/documentHighlight', event.buf) then
            local hl_group = vim.api.nvim_create_augroup('kickstart-lsp-highlight', { clear = false })
            vim.api.nvim_create_autocmd({ 'CursorHold', 'CursorHoldI' }, { buffer = event.buf, group = hl_group, callback = vim.lsp.buf.document_highlight })
            vim.api.nvim_create_autocmd({ 'CursorMoved', 'CursorMovedI' }, { buffer = event.buf, group = hl_group, callback = vim.lsp.buf.clear_references })
            vim.api.nvim_create_autocmd('LspDetach', {
              group = vim.api.nvim_create_augroup('kickstart-lsp-detach', { clear = true }),
              callback = function(event2)
                vim.lsp.buf.clear_references()
                vim.api.nvim_clear_autocmds { group = 'kickstart-lsp-highlight', buffer = event2.buf }
              end,
            })
          end

          -- Toggle inlay hints
          if client and client:supports_method('textDocument/inlayHint', event.buf) then
            map('<leader>th', function()
              vim.lsp.inlay_hint.enable(not vim.lsp.inlay_hint.is_enabled { bufnr = event.buf })
            end, '[T]oggle Inlay [H]ints')
          end
        end,
      })

      -- =====================================================================
      -- Language servers -- add/remove as needed
      -- =====================================================================
      local servers = {
        -- Python
        pyright = {},

        -- JavaScript / TypeScript
        ts_ls = {},

        -- Lua (for editing Neovim config)
        lua_ls = {
          on_init = function(client)
            if client.workspace_folders then
              local path = client.workspace_folders[1].name
              if path ~= vim.fn.stdpath 'config' and (vim.uv.fs_stat(path .. '/.luarc.json') or vim.uv.fs_stat(path .. '/.luarc.jsonc')) then return end
            end
            client.config.settings.Lua = vim.tbl_deep_extend('force', client.config.settings.Lua, {
              runtime = { version = 'LuaJIT' },
              workspace = {
                checkThirdParty = false,
                library = vim.tbl_extend('force', vim.api.nvim_get_runtime_file('', true), { '${3rd}/luv/library' }),
              },
            })
          end,
          settings = { Lua = {} },
        },
      }

      local ensure_installed = vim.tbl_keys(servers or {})
      vim.list_extend(ensure_installed, {
        'stylua',    -- Lua formatter
        'prettier',  -- JS/TS/HTML/CSS formatter
        'black',     -- Python formatter
        'isort',     -- Python import sorter
      })

      require('mason-tool-installer').setup { ensure_installed = ensure_installed }

      for name, server in pairs(servers) do
        vim.lsp.config(name, server)
        vim.lsp.enable(name)
      end
    end,
  },

  -- ========================================================================
  -- Formatting: auto-format on save
  -- ========================================================================
  {
    'stevearc/conform.nvim',
    event = { 'BufWritePre' },
    cmd = { 'ConformInfo' },
    keys = {
      { '<leader>f', function() require('conform').format { async = true, lsp_format = 'fallback' } end, mode = '', desc = '[F]ormat buffer' },
    },
    opts = {
      notify_on_error = false,
      format_on_save = function(bufnr)
        local disable_filetypes = { c = true, cpp = true }
        if disable_filetypes[vim.bo[bufnr].filetype] then return nil end
        return { timeout_ms = 500, lsp_format = 'fallback' }
      end,
      formatters_by_ft = {
        lua = { 'stylua' },
        python = { 'isort', 'black' },
        javascript = { 'prettier' },
        typescript = { 'prettier' },
        javascriptreact = { 'prettier' },
        typescriptreact = { 'prettier' },
        html = { 'prettier' },
        css = { 'prettier' },
        json = { 'prettier' },
      },
    },
  },

  -- ========================================================================
  -- Autocompletion: blink.cmp
  -- ========================================================================
  {
    'saghen/blink.cmp',
    event = 'VimEnter',
    version = '1.*',
    dependencies = {
      { 'L3MON4D3/LuaSnip', version = '2.*', build = (vim.fn.has 'win32' == 0 and vim.fn.executable 'make' == 1) and 'make install_jsregexp' or nil, opts = {} },
    },
    opts = {
      keymap = { preset = 'default' },
      appearance = { nerd_font_variant = 'mono' },
      completion = { documentation = { auto_show = true, auto_show_delay_ms = 300 } },
      sources = { default = { 'lsp', 'path', 'snippets', 'buffer' } },
      snippets = { preset = 'luasnip' },
      fuzzy = { implementation = 'lua' },
      signature = { enabled = true },
    },
  },

  -- ========================================================================
  -- Colorscheme: Catppuccin Mocha
  -- ========================================================================
  {
    'catppuccin/nvim',
    name = 'catppuccin',
    priority = 1000,
    config = function()
      require('catppuccin').setup {
        flavour = 'mocha',
        integrations = {
          gitsigns = true,
          which_key = true,
          telescope = true,
          treesitter = true,
          mini = true,
          nvimtree = true,
          blink_cmp = true,
        },
      }
      vim.cmd.colorscheme 'catppuccin'
    end,
  },

  -- ========================================================================
  -- Todo comments highlighting
  -- ========================================================================
  {
    'folke/todo-comments.nvim',
    event = 'VimEnter',
    dependencies = { 'nvim-lua/plenary.nvim' },
    opts = { signs = false },
  },

  -- ========================================================================
  -- mini.nvim: surround, textobjects, statusline
  -- ========================================================================
  {
    'nvim-mini/mini.nvim',
    config = function()
      require('mini.ai').setup { n_lines = 500 }
      require('mini.surround').setup()
      local statusline = require 'mini.statusline'
      statusline.setup { use_icons = vim.g.have_nerd_font }
      statusline.section_location = function() return '%2l:%-2v' end
    end,
  },

  -- ========================================================================
  -- Treesitter: syntax highlighting and code understanding
  -- ========================================================================
  {
    'nvim-treesitter/nvim-treesitter',
    lazy = false,
    build = ':TSUpdate',
    branch = 'main',
    config = function()
      local parsers = {
        'bash', 'c', 'css', 'diff', 'html', 'javascript', 'json',
        'lua', 'luadoc', 'markdown', 'markdown_inline', 'python',
        'query', 'tsx', 'typescript', 'vim', 'vimdoc', 'yaml',
      }
      require('nvim-treesitter').install(parsers)
      vim.api.nvim_create_autocmd('FileType', {
        callback = function(args)
          local buf, filetype = args.buf, args.match
          local language = vim.treesitter.language.get_lang(filetype)
          if not language then return end
          if not vim.treesitter.language.add(language) then return end
          vim.treesitter.start(buf, language)
          vim.bo.indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
        end,
      })
    end,
  },

  -- ========================================================================
  -- Autopairs: automatically close brackets, quotes, etc.
  -- ========================================================================
  {
    'windwp/nvim-autopairs',
    event = 'InsertEnter',
    opts = {},
  },

  -- ========================================================================
  -- nvim-tree: file explorer sidebar
  -- ========================================================================
  {
    'nvim-tree/nvim-tree.lua',
    dependencies = {
      { 'nvim-tree/nvim-web-devicons', enabled = vim.g.have_nerd_font },
    },
    cmd = { 'NvimTreeToggle', 'NvimTreeFocus', 'NvimTreeFindFile' },
    keys = {
      { '<leader>e',  '<cmd>NvimTreeToggle<CR>',   desc = 'Toggle File [E]xplorer' },
      { '<leader>ef', '<cmd>NvimTreeFindFile<CR>', desc = '[E]xplorer [F]ind current file' },
    },
    opts = {
      sort = { sorter = 'case_sensitive' },
      view = { width = 32 },
      renderer = { group_empty = true },
      filters = { dotfiles = false, git_ignored = false },
      git = { enable = true },
      update_focused_file = { enable = true },
      actions = { open_file = { quit_on_open = false } },
      on_attach = function(bufnr)
        local api = require 'nvim-tree.api'
        api.config.mappings.default_on_attach(bufnr)
        vim.keymap.set('n', 'Y', function()
          local node = api.tree.get_node_under_cursor()
          if not node then return end
          vim.fn.setreg('+', node.absolute_path)
          vim.notify('Copied path: ' .. node.absolute_path)
        end, { buffer = bufnr, desc = 'Copy absolute path' })
      end,
    },
  },

}, {
  ui = {
    icons = vim.g.have_nerd_font and {} or {
      cmd = '>_', config = '{=}', event = '!', ft = 'ft',
      init = '*', keys = 'K', plugin = '+', runtime = 'RT',
      require = 'R', source = '<>', start = '>', task = '#', lazy = 'zz',
    },
  },
})

-- vim: ts=2 sts=2 sw=2 et
