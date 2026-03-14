const DEMO_STEPS = [
  {
    title: 'Block mode',
    narrative: 'You tap your card for a \u00A3999 impulse buy. Block mode auto-declines it \u2014 it\u2019s above your \u00A350 threshold. An adaptive timer forces a pause before you can approve.',
    screen: 'BlockPrompt',
    params: {
      transaction: {
        id: 'demo-block',
        merchant: 'Apple Store',
        amount: 999.00,
        context_line: '\u00A3140 left until loan payment on Mar 28',
      },
      budget: 60,
      remaining: 42,
      blocksToday: 3,
      overridesLast30d: 7,
      riskScore: 92,
    },
  },
  {
    title: 'Under budget',
    narrative: 'You\u2019re on a night out with a \u00A360 budget. Under budget? A brief overlay shows what\u2019s left in real-world units (\u201C7 drinks left\u201D). Tap anywhere to dismiss.',
    screen: 'HighRiskOverlay',
    params: {
      remaining: 42,
      budget: 60,
      unitLabel: 'drinks',
      unitCost: 6,
    },
  },
  {
    title: 'Over budget',
    narrative: 'You go over budget. The transaction is auto-declined \u2014 no override option. You see exactly how far over you are.',
    screen: 'HighRiskPrompt',
    params: {
      transaction: { id: 'demo-hr', merchant: 'Wetherspoons', amount: 24.00 },
      runningTotal: 78,
      budget: 60,
    },
  },
  {
    title: 'Configure your safety net',
    narrative: 'Customise block thresholds, budget windows, and real-world unit labels. All modes are toggle-on \u2014 the user stays in control.',
    screen: 'ModeSetup',
    params: {},
  },
  {
    title: 'Risk heatmap',
    narrative: 'Geospatial ML maps your spending locations by risk level. High-risk zones pulse in red. Tap any dot for merchant details and spend totals.',
    screen: 'Dashboard',
    params: {},
  },
  {
    title: 'Anomaly detection',
    narrative: 'IsolationForest flags outlier transactions \u2014 unusual amounts, merchants, or timing. Scroll down to see risk distribution, hourly/daily patterns, and weekly budget tracking.',
    screen: 'Dashboard',
    params: {},
  },
];

export function getDemoSteps() {
  return DEMO_STEPS;
}

export function getTotalSteps() {
  return DEMO_STEPS.length;
}
