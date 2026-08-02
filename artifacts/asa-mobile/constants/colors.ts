/**
 * ASA Workforce — Design Tokens (Emerald Authority Theme)
 *
 * Deep Saudi green + gold. Light cream background, white floating cards.
 * Matches the approved EmeraldV2 mockup exactly.
 */

const colors = {
  light: {
    // Legacy aliases kept for compatibility
    text:              '#1A1F1C',
    tint:              '#0D6B3F',

    // Core surfaces
    background:        '#F9FAF7',
    foreground:        '#1A1F1C',

    // Cards / elevated surfaces
    card:              '#FFFFFF',
    cardForeground:    '#1A1F1C',

    // Primary action — Saudi green
    primary:           '#0D6B3F',
    primaryForeground: '#FFFFFF',

    // Secondary
    secondary:         '#E8F5EE',
    secondaryForeground: '#0A4D2E',

    // Muted / subdued
    muted:             '#E8F5EE',
    mutedForeground:   '#6B7A72',

    // Accent — Gold
    accent:            '#C9963F',
    accentForeground:  '#FFFFFF',

    // Destructive / error
    destructive:       '#EF4444',
    destructiveForeground: '#FFFFFF',

    // Borders and inputs
    border:            '#E4EBE7',
    input:             '#E4EBE7',

    // Success / warning
    success:           '#22C55E',
    successForeground: '#FFFFFF',
    warning:           '#F59E0B',
    warningForeground: '#FFFFFF',
  },

  government: {
    // Greens
    navyDark:        '#0A4D2E',
    navy:            '#0D6B3F',
    navyLight:       '#128A50',
    navyMuted:       '#0D6B3F',

    // Golds
    gold:            '#C9963F',
    goldLight:       '#E8B86D',
    goldDark:        '#A8771E',

    // Surfaces
    surfaceOverlay:  'rgba(255, 255, 255, 0.08)',
    textOnNavy:      '#FFFFFF',
    subtextOnNavy:   'rgba(255,255,255,0.65)',

    // Background
    cream:           '#F9FAF7',
  },

  radius: 14,
};

export default colors;
