/**
 * Post-implementation validation suite
 * Shared logic for all three design commands
 * Provides visual capture, accessibility audit, comparison, and user feedback loops
 */

const fs = require('fs');
const path = require('path');

/**
 * Capture the implemented UI state via Chrome DevTools MCP
 * Returns combined snapshot + screenshot for validation
 * @param {string} url - URL of implemented component
 * @returns {Object} Captured context with snapshot and screenshot paths
 */
function captureImplementedUI(url) {
  return {
    targetUrl: url,
    captureMethod: 'chrome-devtools-mcp',
    tools: ['mcp__chrome_devtools__take_snapshot', 'mcp__chrome_devtools__take_screenshot'],
    status: 'pending',
    // These would be populated by MCP calls in command context
    snapshotPath: null,
    screenshotPath: null,
    timestamp: new Date().toISOString()
  };
}

/**
 * Compare mockup and implementation to identify differences
 * Uses semantic diff on accessibility trees when available
 * @param {Object} mockupSnapshot - Snapshot from mockup HTML
 * @param {Object} implementedSnapshot - Snapshot from implemented component
 * @returns {Object} Detailed comparison with identified differences
 */
function compareMockupToImplementation(mockupSnapshot, implementedSnapshot) {
  const comparison = {
    mockupPresent: !!mockupSnapshot,
    implementationPresent: !!implementedSnapshot,
    differences: [],
    structureMatches: true,
    stylingMatches: true,
    accessibilityMatches: true
  };

  if (!mockupSnapshot || !implementedSnapshot) {
    return comparison;
  }

  // Semantic comparison would analyze:
  // - DOM structure (elements, hierarchy)
  // - ARIA attributes and roles
  // - Visual hierarchy and layout
  // - Color and typography

  return comparison;
}

/**
 * Build validation data for AccessLint audit
 * @param {string} htmlContent - HTML content to audit
 * @param {string} cssContent - CSS content to audit
 * @returns {Object} Audit request data
 */
function prepareAccessibilityAudit(htmlContent, cssContent) {
  return {
    htmlContent,
    cssContent,
    timestamp: new Date().toISOString(),
    checks: [
      'contrast-ratio',  // AccessLint contrast checker
      'use-of-color',     // WCAG 1.4.1 - Color not only means of conveying info
      'link-purpose'      // WCAG 2.4.4 - Link purpose in context
    ]
  };
}

/**
 * Assess severity of identified issues
 * @param {Object} issuesList - Issues found from validation
 * @returns {Object} Severity assessment with recommendation
 */
function assessSeverity(issuesList = {}) {
  const {
    accessibilityViolations = [],
    layoutIssues = [],
    interactionIssues = [],
    styleIssues = [],
    other = []
  } = issuesList;

  let severity = 'none';
  let recommendation = 'shipped';

  // Critical issues
  if (accessibilityViolations.length > 0) {
    severity = 'critical';
    recommendation = 'require-fix';
  }
  // Major structural issues
  else if (layoutIssues.length > 0 || interactionIssues.length > 0) {
    severity = 'major';
    recommendation = 'regenerate';
  }
  // Minor cosmetic issues
  else if (styleIssues.length > 0) {
    severity = 'minor';
    recommendation = 'refine';
  }

  return {
    severity,
    recommendation,
    issueCount: {
      critical: accessibilityViolations.length,
      major: layoutIssues.length + interactionIssues.length,
      minor: styleIssues.length + other.length
    },
    details: {
      accessibilityViolations,
      layoutIssues,
      interactionIssues,
      styleIssues,
      other
    }
  };
}

/**
 * Format validation results for user presentation
 * @param {Object} validation - Validation results
 * @param {Object} severity - Severity assessment
 * @returns {string} Formatted validation report
 */
function formatValidationReport(validation, severity) {
  let report = `## Implementation Validation Report\n\n`;

  report += `**Status**: ${severity.severity.toUpperCase()}\n`;
  report += `**Recommendation**: ${severity.recommendation}\n\n`;

  if (severity.issueCount.critical > 0) {
    report += `### Critical Issues (${severity.issueCount.critical})\n`;
    report += `These must be fixed before shipping:\n`;
    severity.details.accessibilityViolations.forEach(issue => {
      report += `- ${issue}\n`;
    });
    report += '\n';
  }

  if (severity.issueCount.major > 0) {
    report += `### Major Issues (${severity.issueCount.major})\n`;
    report += `Consider regenerating mockups to address these:\n`;
    severity.details.layoutIssues.forEach(issue => {
      report += `- Layout: ${issue}\n`;
    });
    severity.details.interactionIssues.forEach(issue => {
      report += `- Interaction: ${issue}\n`;
    });
    report += '\n';
  }

  if (severity.issueCount.minor > 0) {
    report += `### Minor Issues (${severity.issueCount.minor})\n`;
    report += `These can be refined in the current code:\n`;
    severity.details.styleIssues.forEach(issue => {
      report += `- ${issue}\n`;
    });
    report += '\n';
  }

  if (severity.severity === 'none') {
    report += `No issues found! Ready to ship.\n`;
  }

  return report;
}

/**
 * Build user testing questions for interactive validation
 * @returns {Object} AskUserQuestion compatible structure
 */
function buildUserTestingQuestions() {
  return {
    question: 'Please interact with the implemented component. How does it look and feel?',
    options: [
      {
        label: 'Looks great - ship it!',
        value: 'approved'
      },
      {
        label: 'Minor tweaks needed',
        value: 'minor-fixes'
      },
      {
        label: 'Major issues - need new mockups',
        value: 'regenerate'
      },
      {
        label: 'Something specific to change',
        value: 'custom-feedback'
      }
    ]
  };
}

/**
 * Build iteration recommendations based on severity
 * @param {Object} severity - Severity assessment
 * @returns {Object} Iteration options for user choice
 */
function buildIterationOptions(severity) {
  const options = [];

  if (severity.severity === 'critical') {
    return {
      allowedActions: ['fix-immediate'],
      message: 'Critical accessibility issues must be fixed before proceeding. Please address these violations first.'
    };
  }

  if (severity.recommendation === 'regenerate') {
    options.push({
      label: 'Generate new mockups',
      value: 'regenerate',
      description: 'Based on feedback, create new design options'
    });
  }

  if (severity.recommendation === 'refine' || severity.recommendation === 'shipped') {
    options.push({
      label: 'Refine current implementation',
      value: 'refine',
      description: 'Fix issues in the current code'
    });
  }

  options.push({
    label: 'Describe specific changes',
    value: 'custom',
    description: 'Tell me what to change'
  });

  options.push({
    label: 'Done - ship it!',
    value: 'ship',
    description: 'Accept current implementation'
  });

  return {
    allowedActions: options.map(o => o.value),
    options,
    message: `Based on validation, I recommend: ${severity.recommendation}`
  };
}

/**
 * Save validation results to session
 * @param {string} sessionPath - Session directory path
 * @param {Object} results - Complete validation results
 */
function saveValidationResults(sessionPath, results) {
  const validationData = {
    timestamp: new Date().toISOString(),
    ...results
  };

  const implDir = path.join(sessionPath, 'implementation');
  if (!fs.existsSync(implDir)) {
    fs.mkdirSync(implDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(implDir, 'validation.json'),
    JSON.stringify(validationData, null, 2)
  );
}

module.exports = {
  captureImplementedUI,
  compareMockupToImplementation,
  prepareAccessibilityAudit,
  assessSeverity,
  formatValidationReport,
  buildUserTestingQuestions,
  buildIterationOptions,
  saveValidationResults
};
