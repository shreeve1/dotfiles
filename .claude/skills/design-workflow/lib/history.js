const fs = require('fs');
const path = require('path');

const DESIGN_DIR = path.join(process.env.HOME, 'artifacts', 'design');

// Ensure design directory exists
function ensureDesignDir() {
  if (!fs.existsSync(DESIGN_DIR)) {
    fs.mkdirSync(DESIGN_DIR, { recursive: true });
  }
}

function createSession(componentName) {
  ensureDesignDir();

  const now = new Date();
  const date = now.toISOString().split('T')[0];
  
  // Find next available session number
  let sessionNum = 1;
  const existingSessions = fs.readdirSync(DESIGN_DIR).filter(d => d.startsWith(date));
  if (existingSessions.length > 0) {
    const nums = existingSessions.map(d => {
      const match = d.match(/session-(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    });
    sessionNum = Math.max(...nums) + 1;
  }

  const sessionDir = path.join(DESIGN_DIR, `${date}-session-${sessionNum}`);
  fs.mkdirSync(sessionDir, { recursive: true });

  // Create subdirectories
  fs.mkdirSync(path.join(sessionDir, 'context'), { recursive: true });
  fs.mkdirSync(path.join(sessionDir, 'variants'), { recursive: true });
  fs.mkdirSync(path.join(sessionDir, 'selected'), { recursive: true });
  fs.mkdirSync(path.join(sessionDir, 'implementation'), { recursive: true });

  // Create session metadata
  const sessionMetadata = {
    component: componentName,
    timestamp: now.toISOString(),
    status: 'active'
  };

  fs.writeFileSync(
    path.join(sessionDir, 'session.json'),
    JSON.stringify(sessionMetadata, null, 2)
  );

  return sessionDir;
}

function saveVariant(sessionPath, variantData) {
  const variantDir = path.join(sessionPath, 'variants', variantData.name);
  fs.mkdirSync(variantDir, { recursive: true });

  // Save HTML
  if (variantData.html) {
    fs.writeFileSync(path.join(variantDir, 'mockup.html'), variantData.html);
  }

  // Save CSS
  if (variantData.css) {
    fs.writeFileSync(path.join(variantDir, 'mockup.css'), variantData.css);
  }

  // Save metadata
  const metadata = {
    name: variantData.name,
    description: variantData.description || '',
    theme: variantData.theme,
    agent: variantData.agent,
    timestamp: new Date().toISOString(),
    rationale: variantData.rationale || ''
  };

  fs.writeFileSync(
    path.join(variantDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  return variantDir;
}

function saveSelection(sessionPath, variantId) {
  const selection = {
    selectedVariant: variantId,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(sessionPath, 'selected', 'selection.json'),
    JSON.stringify(selection, null, 2)
  );
}

function saveDiff(sessionPath, mockupPath, implementedPath) {
  // Save diff between mockup and implementation
  const diff = {
    mockup: mockupPath,
    implemented: implementedPath,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(sessionPath, 'implementation', 'diff.json'),
    JSON.stringify(diff, null, 2)
  );
}

function listSessions() {
  ensureDesignDir();

  if (!fs.existsSync(DESIGN_DIR)) {
    return [];
  }

  const sessions = fs.readdirSync(DESIGN_DIR)
    .filter(d => /^\d{4}-\d{2}-\d{2}-session-\d+$/.test(d))
    .sort()
    .reverse();

  return sessions.map(session => ({
    name: session,
    path: path.join(DESIGN_DIR, session),
    date: session.split('-session-')[0]
  }));
}

function loadSession(sessionPath) {
  if (!fs.existsSync(sessionPath)) {
    return null;
  }

  const sessionMetadata = JSON.parse(
    fs.readFileSync(path.join(sessionPath, 'session.json'), 'utf8')
  );

  const variants = [];
  const variantsDir = path.join(sessionPath, 'variants');
  if (fs.existsSync(variantsDir)) {
    const variantDirs = fs.readdirSync(variantsDir);
    for (const variantDir of variantDirs) {
      const metadataPath = path.join(variantsDir, variantDir, 'metadata.json');
      if (fs.existsSync(metadataPath)) {
        variants.push({
          name: variantDir,
          metadata: JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
        });
      }
    }
  }

  return {
    ...sessionMetadata,
    path: sessionPath,
    variants
  };
}

module.exports = {
  createSession,
  saveVariant,
  saveSelection,
  saveDiff,
  listSessions,
  loadSession
};
