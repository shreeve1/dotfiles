-- Kickstart.nvim based config
-- Customized with: Python + JavaScript/TypeScript LSP, autopairs, file explorer

-- Set <space> as the leader key (must be before plugins load)
vim.g.mapleader = ' '
vim.g.maplocalleader = ' '

-- No Nerd Font installed
vim.g.have_nerd_font = false

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

-- Sync clipboard with OS
vim.o.clipboard = 'unnamedplus'

-- ============================================================================
-- Keymaps
-- ============================================================================

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
  -- Colorscheme: Burns (matches Ghostty / OpenCode theme)
  -- ========================================================================
  -- Inline colorscheme — no plugin needed. Loaded at priority via lazy spec.
  {
    'burns-theme',
    virtual = true,
    priority = 1000,
    config = function()
      -- Burns palette (from tomorrow-night-burns)
      local c = {
        bg       = '#151515',
        panel    = '#1b1b1b',
        element  = '#252525',
        inset    = '#2a2d32',
        fg       = '#d2dadd',
        sel      = '#b0bec5',
        sel_text = '#2a2d32',
        border   = '#8b999c',
        red1     = '#832e31',
        red2     = '#a63c40',
        red3     = '#d3494e',
        red4     = '#fc595f',
        rose     = '#df9395',
        dust     = '#ba8586',
        white    = '#f5f5f5',
        cursor   = '#ff443e',
        diff_add_bg = '#241819',
        diff_del_bg = '#301516',
        none     = 'NONE',
      }

      vim.o.termguicolors = true
      vim.o.background = 'dark'

      -- Reset existing highlights
      vim.cmd 'highlight clear'
      vim.g.colors_name = 'burns'

      local hi = function(group, opts) vim.api.nvim_set_hl(0, group, opts) end

      -- ==================================================================
      -- Editor UI
      -- ==================================================================
      hi('Normal',         { fg = c.fg, bg = c.bg })
      hi('NormalFloat',    { fg = c.fg, bg = c.panel })
      hi('NormalNC',       { fg = c.fg, bg = c.bg })
      hi('FloatBorder',    { fg = c.border, bg = c.panel })
      hi('FloatTitle',     { fg = c.red4, bg = c.panel, bold = true })
      hi('CursorLine',     { bg = c.element })
      hi('CursorLineNr',   { fg = c.red4, bold = true })
      hi('LineNr',         { fg = c.border })
      hi('SignColumn',     { bg = c.bg })
      hi('ColorColumn',    { bg = c.element })
      hi('Cursor',         { fg = c.bg, bg = c.cursor })
      hi('lCursor',        { fg = c.bg, bg = c.cursor })
      hi('CursorIM',       { fg = c.bg, bg = c.cursor })
      hi('TermCursor',     { fg = c.bg, bg = c.cursor })
      hi('Visual',         { bg = c.inset })
      hi('VisualNOS',      { bg = c.inset })
      hi('Search',         { fg = c.sel_text, bg = c.sel })
      hi('IncSearch',      { fg = c.bg, bg = c.cursor })
      hi('CurSearch',      { fg = c.bg, bg = c.red4 })
      hi('Substitute',     { fg = c.bg, bg = c.rose })
      hi('MatchParen',     { fg = c.cursor, bold = true, underline = true })

      -- Status / tab / win bars
      hi('StatusLine',     { fg = c.fg, bg = c.element })
      hi('StatusLineNC',   { fg = c.border, bg = c.panel })
      hi('WinBar',         { fg = c.fg, bg = c.bg })
      hi('WinBarNC',       { fg = c.border, bg = c.bg })
      hi('TabLine',        { fg = c.border, bg = c.panel })
      hi('TabLineFill',    { bg = c.panel })
      hi('TabLineSel',     { fg = c.fg, bg = c.element })
      hi('WinSeparator',   { fg = c.element })

      -- Pmenu (completion/wildmenu)
      hi('Pmenu',          { fg = c.fg, bg = c.panel })
      hi('PmenuSel',       { fg = c.white, bg = c.inset })
      hi('PmenuSbar',      { bg = c.element })
      hi('PmenuThumb',     { bg = c.border })

      -- Messages and folds
      hi('Title',          { fg = c.red4, bold = true })
      hi('ErrorMsg',       { fg = c.red4 })
      hi('WarningMsg',     { fg = c.red3 })
      hi('MoreMsg',        { fg = c.dust })
      hi('ModeMsg',        { fg = c.fg, bold = true })
      hi('Question',       { fg = c.rose })
      hi('Directory',      { fg = c.rose })
      hi('Folded',         { fg = c.border, bg = c.element })
      hi('FoldColumn',     { fg = c.border, bg = c.bg })
      hi('NonText',        { fg = c.element })
      hi('SpecialKey',     { fg = c.element })
      hi('Whitespace',     { fg = c.element })
      hi('EndOfBuffer',    { fg = c.element })

      -- ==================================================================
      -- Syntax (Vim legacy groups — Treesitter links to these)
      -- ==================================================================
      hi('Comment',        { fg = c.border })
      hi('Constant',       { fg = c.red4 })
      hi('String',         { fg = c.rose })
      hi('Character',      { fg = c.rose })
      hi('Number',         { fg = c.red4 })
      hi('Boolean',        { fg = c.red4 })
      hi('Float',          { fg = c.red4 })
      hi('Identifier',     { fg = c.fg })
      hi('Function',       { fg = c.white })
      hi('Statement',      { fg = c.red3 })
      hi('Conditional',    { fg = c.red3 })
      hi('Repeat',         { fg = c.red3 })
      hi('Label',          { fg = c.dust })
      hi('Operator',       { fg = c.cursor })
      hi('Keyword',        { fg = c.red3 })
      hi('Exception',      { fg = c.red3 })
      hi('PreProc',        { fg = c.red2 })
      hi('Include',        { fg = c.red2 })
      hi('Define',         { fg = c.red2 })
      hi('Macro',          { fg = c.red2 })
      hi('PreCondit',      { fg = c.red2 })
      hi('Type',           { fg = c.dust })
      hi('StorageClass',   { fg = c.red3 })
      hi('Structure',      { fg = c.dust })
      hi('Typedef',        { fg = c.dust })
      hi('Special',        { fg = c.cursor })
      hi('SpecialChar',    { fg = c.cursor })
      hi('Tag',            { fg = c.red4 })
      hi('Delimiter',      { fg = c.fg })
      hi('SpecialComment', { fg = c.border, bold = true })
      hi('Debug',          { fg = c.cursor })
      hi('Underlined',     { fg = c.rose, underline = true })
      hi('Error',          { fg = c.red4 })
      hi('Todo',           { fg = c.cursor, bold = true })

      -- ==================================================================
      -- Treesitter overrides
      -- ==================================================================
      hi('@variable',            { fg = c.sel })
      hi('@variable.builtin',    { fg = c.dust })
      hi('@variable.parameter',  { fg = c.fg })
      hi('@variable.member',     { fg = c.sel })
      hi('@constant',            { fg = c.red4 })
      hi('@constant.builtin',    { fg = c.red4 })
      hi('@module',              { fg = c.dust })
      hi('@string',              { fg = c.rose })
      hi('@string.escape',       { fg = c.cursor })
      hi('@string.regexp',       { fg = c.cursor })
      hi('@character',           { fg = c.rose })
      hi('@number',              { fg = c.red4 })
      hi('@boolean',             { fg = c.red4 })
      hi('@type',                { fg = c.dust })
      hi('@type.builtin',        { fg = c.dust })
      hi('@type.qualifier',      { fg = c.red3 })
      hi('@attribute',           { fg = c.dust })
      hi('@property',            { fg = c.sel })
      hi('@function',            { fg = c.white })
      hi('@function.builtin',    { fg = c.white })
      hi('@function.call',       { fg = c.white })
      hi('@function.method',     { fg = c.white })
      hi('@function.method.call', { fg = c.white })
      hi('@constructor',         { fg = c.dust })
      hi('@operator',            { fg = c.cursor })
      hi('@keyword',             { fg = c.red3 })
      hi('@keyword.modifier',    { fg = c.red3 })
      hi('@keyword.type',        { fg = c.red3 })
      hi('@keyword.coroutine',   { fg = c.red3 })
      hi('@keyword.function',    { fg = c.red3 })
      hi('@keyword.operator',    { fg = c.cursor })
      hi('@keyword.import',      { fg = c.red2 })
      hi('@keyword.repeat',      { fg = c.red3 })
      hi('@keyword.return',      { fg = c.red3 })
      hi('@keyword.exception',   { fg = c.red3 })
      hi('@keyword.conditional', { fg = c.red3 })
      hi('@punctuation',         { fg = c.fg })
      hi('@punctuation.bracket',  { fg = c.fg })
      hi('@punctuation.delimiter', { fg = c.fg })
      hi('@punctuation.special',  { fg = c.cursor })
      hi('@comment',             { fg = c.border })
      hi('@tag',                 { fg = c.red4 })
      hi('@tag.attribute',       { fg = c.dust })
      hi('@tag.delimiter',       { fg = c.fg })
      hi('@markup.heading',      { fg = c.red4, bold = true })
      hi('@markup.strong',       { fg = c.white, bold = true })
      hi('@markup.italic',       { fg = c.rose, italic = true })
      hi('@markup.link',         { fg = c.rose, underline = true })
      hi('@markup.link.url',     { fg = c.rose, underline = true })
      hi('@markup.link.label',   { fg = c.white })
      hi('@markup.raw',          { fg = c.sel })
      hi('@markup.list',         { fg = c.cursor })

      -- ==================================================================
      -- LSP semantic tokens
      -- ==================================================================
      hi('@lsp.type.variable',   { fg = c.sel })
      hi('@lsp.type.property',   { fg = c.sel })
      hi('@lsp.type.parameter',  { fg = c.fg })
      hi('@lsp.type.function',   { fg = c.white })
      hi('@lsp.type.method',     { fg = c.white })
      hi('@lsp.type.type',       { fg = c.dust })
      hi('@lsp.type.class',      { fg = c.dust })
      hi('@lsp.type.interface',  { fg = c.dust })
      hi('@lsp.type.enum',       { fg = c.dust })
      hi('@lsp.type.enumMember', { fg = c.red4 })
      hi('@lsp.type.namespace',  { fg = c.dust })
      hi('@lsp.type.keyword',    { fg = c.red3 })
      hi('@lsp.type.decorator',  { fg = c.red2 })
      hi('@lsp.mod.deprecated',  { strikethrough = true })

      -- ==================================================================
      -- Diagnostics
      -- ==================================================================
      hi('DiagnosticError',          { fg = c.red4 })
      hi('DiagnosticWarn',           { fg = c.red3 })
      hi('DiagnosticInfo',           { fg = c.sel })
      hi('DiagnosticHint',           { fg = c.border })
      hi('DiagnosticOk',             { fg = c.dust })
      hi('DiagnosticUnderlineError', { undercurl = true, sp = c.red4 })
      hi('DiagnosticUnderlineWarn',  { undercurl = true, sp = c.red3 })
      hi('DiagnosticUnderlineInfo',  { undercurl = true, sp = c.sel })
      hi('DiagnosticUnderlineHint',  { undercurl = true, sp = c.border })
      hi('DiagnosticVirtualTextError', { fg = c.red4, bg = c.diff_del_bg })
      hi('DiagnosticVirtualTextWarn',  { fg = c.red3, bg = c.diff_add_bg })
      hi('DiagnosticVirtualTextInfo',  { fg = c.sel, bg = c.element })
      hi('DiagnosticVirtualTextHint',  { fg = c.border, bg = c.element })

      -- ==================================================================
      -- Diff
      -- ==================================================================
      hi('DiffAdd',     { bg = c.diff_add_bg })
      hi('DiffChange',  { bg = c.element })
      hi('DiffDelete',  { fg = c.red1, bg = c.diff_del_bg })
      hi('DiffText',    { bg = c.inset })
      hi('diffAdded',   { fg = c.rose })
      hi('diffRemoved', { fg = c.red4 })
      hi('diffChanged', { fg = c.dust })
      hi('diffFile',    { fg = c.white })
      hi('diffLine',    { fg = c.border })

      -- ==================================================================
      -- Git signs
      -- ==================================================================
      hi('GitSignsAdd',          { fg = c.rose })
      hi('GitSignsChange',       { fg = c.dust })
      hi('GitSignsDelete',       { fg = c.red4 })
      hi('GitSignsAddNr',        { fg = c.rose })
      hi('GitSignsChangeNr',     { fg = c.dust })
      hi('GitSignsDeleteNr',     { fg = c.red4 })
      hi('GitSignsAddLn',        { bg = c.diff_add_bg })
      hi('GitSignsChangeLn',     { bg = c.element })
      hi('GitSignsDeleteLn',     { bg = c.diff_del_bg })

      -- ==================================================================
      -- Telescope
      -- ==================================================================
      hi('TelescopeNormal',        { fg = c.fg, bg = c.panel })
      hi('TelescopeBorder',        { fg = c.border, bg = c.panel })
      hi('TelescopeTitle',         { fg = c.red4, bg = c.panel, bold = true })
      hi('TelescopePromptNormal',  { fg = c.fg, bg = c.inset })
      hi('TelescopePromptBorder',  { fg = c.border, bg = c.inset })
      hi('TelescopePromptTitle',   { fg = c.cursor, bg = c.inset, bold = true })
      hi('TelescopePromptPrefix',  { fg = c.cursor, bg = c.inset })
      hi('TelescopeResultsNormal', { fg = c.fg, bg = c.panel })
      hi('TelescopeResultsBorder', { fg = c.border, bg = c.panel })
      hi('TelescopePreviewNormal', { fg = c.fg, bg = c.bg })
      hi('TelescopePreviewBorder', { fg = c.border, bg = c.bg })
      hi('TelescopePreviewTitle',  { fg = c.dust, bg = c.bg, bold = true })
      hi('TelescopeSelection',     { fg = c.white, bg = c.element })
      hi('TelescopeSelectionCaret', { fg = c.cursor })
      hi('TelescopeMatching',      { fg = c.cursor, bold = true })

      -- ==================================================================
      -- Neo-tree
      -- ==================================================================
      hi('NeoTreeNormal',         { fg = c.fg, bg = c.panel })
      hi('NeoTreeNormalNC',       { fg = c.fg, bg = c.panel })
      hi('NeoTreeEndOfBuffer',    { fg = c.panel, bg = c.panel })
      hi('NeoTreeWinSeparator',   { fg = c.element, bg = c.bg })
      hi('NeoTreeRootName',       { fg = c.red4, bold = true })
      hi('NeoTreeDirectoryName',  { fg = c.fg })
      hi('NeoTreeDirectoryIcon',  { fg = c.dust })
      hi('NeoTreeFileName',       { fg = c.fg })
      hi('NeoTreeFileIcon',       { fg = c.border })
      hi('NeoTreeGitAdded',       { fg = c.rose })
      hi('NeoTreeGitModified',    { fg = c.dust })
      hi('NeoTreeGitDeleted',     { fg = c.red4 })
      hi('NeoTreeGitUntracked',   { fg = c.border })
      hi('NeoTreeIndentMarker',   { fg = c.element })
      hi('NeoTreeCursorLine',     { bg = c.element })

      -- ==================================================================
      -- Which-key
      -- ==================================================================
      hi('WhichKey',          { fg = c.cursor })
      hi('WhichKeyGroup',     { fg = c.rose })
      hi('WhichKeyDesc',      { fg = c.fg })
      hi('WhichKeySeparator', { fg = c.element })
      hi('WhichKeyValue',     { fg = c.border })
      hi('WhichKeyFloat',     { bg = c.panel })
      hi('WhichKeyBorder',    { fg = c.border, bg = c.panel })

      -- ==================================================================
      -- Blink.cmp / Completion
      -- ==================================================================
      hi('BlinkCmpMenu',            { fg = c.fg, bg = c.panel })
      hi('BlinkCmpMenuBorder',      { fg = c.border, bg = c.panel })
      hi('BlinkCmpMenuSelection',   { bg = c.inset })
      hi('BlinkCmpLabel',           { fg = c.fg })
      hi('BlinkCmpLabelMatch',      { fg = c.cursor, bold = true })
      hi('BlinkCmpKind',            { fg = c.dust })
      hi('BlinkCmpDoc',             { fg = c.fg, bg = c.panel })
      hi('BlinkCmpDocBorder',       { fg = c.border, bg = c.panel })

      -- ==================================================================
      -- Fidget (LSP progress)
      -- ==================================================================
      hi('FidgetTitle',  { fg = c.red4 })
      hi('FidgetTask',   { fg = c.border })

      -- ==================================================================
      -- LSP reference highlights
      -- ==================================================================
      hi('LspReferenceText',  { bg = c.element })
      hi('LspReferenceRead',  { bg = c.element })
      hi('LspReferenceWrite', { bg = c.inset })
      hi('LspSignatureActiveParameter', { fg = c.cursor, bold = true })
      hi('LspInlayHint',     { fg = c.border, bg = c.panel })

      -- ==================================================================
      -- Mini.statusline
      -- ==================================================================
      hi('MiniStatuslineFilename',   { fg = c.fg, bg = c.element })
      hi('MiniStatuslineDevinfo',    { fg = c.fg, bg = c.inset })
      hi('MiniStatuslineFileinfo',   { fg = c.fg, bg = c.inset })
      hi('MiniStatuslineModeNormal', { fg = c.bg, bg = c.sel, bold = true })
      hi('MiniStatuslineModeInsert', { fg = c.bg, bg = c.cursor, bold = true })
      hi('MiniStatuslineModeVisual', { fg = c.bg, bg = c.rose, bold = true })
      hi('MiniStatuslineModeReplace', { fg = c.bg, bg = c.red4, bold = true })
      hi('MiniStatuslineModeCommand', { fg = c.bg, bg = c.dust, bold = true })
      hi('MiniStatuslineModeOther',  { fg = c.bg, bg = c.border, bold = true })

      -- ==================================================================
      -- Lazy.nvim plugin manager UI
      -- ==================================================================
      hi('LazyButton',       { fg = c.fg, bg = c.element })
      hi('LazyButtonActive', { fg = c.bg, bg = c.red4, bold = true })
      hi('LazyH1',           { fg = c.bg, bg = c.red4, bold = true })
      hi('LazyH2',           { fg = c.red4, bold = true })
      hi('LazySpecial',      { fg = c.cursor })
      hi('LazyComment',      { fg = c.border })
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
  -- Neo-tree: file explorer sidebar
  -- ========================================================================
  {
    'nvim-neo-tree/neo-tree.nvim',
    branch = 'v3.x',
    dependencies = {
      'nvim-lua/plenary.nvim',
      'nvim-tree/nvim-web-devicons',
      'MunifTanjim/nui.nvim',
    },
    cmd = 'Neotree',
    keys = {
      { '<leader>e', '<cmd>Neotree toggle<CR>', desc = 'Toggle File [E]xplorer' },
    },
    opts = {
      filesystem = {
        follow_current_file = { enabled = true },
        filtered_items = { visible = true },
      },
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
