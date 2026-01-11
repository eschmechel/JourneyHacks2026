import { amber, blue, green, red, sand, yellow } from '@radix-ui/colors';

// Export Radix color scales
export const colors = {
  // Grayscale - using sand for warm neutrals
  ...sand,
  
  // Accent color - yellow/gold theme
  accent1: amber.amber1,
  accent2: amber.amber2,
  accent3: amber.amber3,
  accent4: amber.amber4,
  accent5: amber.amber5,
  accent6: amber.amber6,
  accent7: amber.amber7,
  accent8: amber.amber8,
  accent9: amber.amber9,
  accent10: amber.amber10,
  accent11: amber.amber11,
  accent12: amber.amber12,
  
  // Info/Primary - blue
  info1: blue.blue1,
  info2: blue.blue2,
  info3: blue.blue3,
  info4: blue.blue4,
  info5: blue.blue5,
  info6: blue.blue6,
  info7: blue.blue7,
  info8: blue.blue8,
  info9: blue.blue9,
  info10: blue.blue10,
  info11: blue.blue11,
  info12: blue.blue12,
  
  // Success - green
  success1: green.green1,
  success2: green.green2,
  success3: green.green3,
  success4: green.green4,
  success5: green.green5,
  success6: green.green6,
  success7: green.green7,
  success8: green.green8,
  success9: green.green9,
  success10: green.green10,
  success11: green.green11,
  success12: green.green12,
  
  // Warning - yellow
  warning1: yellow.yellow1,
  warning2: yellow.yellow2,
  warning3: yellow.yellow3,
  warning4: yellow.yellow4,
  warning5: yellow.yellow5,
  warning6: yellow.yellow6,
  warning7: yellow.yellow7,
  warning8: yellow.yellow8,
  warning9: yellow.yellow9,
  warning10: yellow.yellow10,
  warning11: yellow.yellow11,
  warning12: yellow.yellow12,
  
  // Danger/Error - red
  danger1: red.red1,
  danger2: red.red2,
  danger3: red.red3,
  danger4: red.red4,
  danger5: red.red5,
  danger6: red.red6,
  danger7: red.red7,
  danger8: red.red8,
  danger9: red.red9,
  danger10: red.red10,
  danger11: red.red11,
  danger12: red.red12,
};

// Semantic color aliases for ease of use
export const semanticColors = {
  // Backgrounds
  appBg: colors.sand1,
  subtleBg: colors.sand2,
  componentBg: colors.sand3,
  hoverBg: colors.sand4,
  activeBg: colors.sand5,
  
  // Borders
  subtleBorder: colors.sand6,
  border: colors.sand7,
  hoverBorder: colors.sand8,
  
  // Text
  lowContrastText: colors.sand11,
  highContrastText: colors.sand12,
  
  // Accent (Yellow/Amber theme)
  accentBg: colors.accent3,
  accentBgHover: colors.accent4,
  accentBgActive: colors.accent5,
  accentBorder: colors.accent7,
  accentBorderHover: colors.accent8,
  accentSolid: colors.accent9,
  accentSolidHover: colors.accent10,
  accentText: colors.accent11,
  accentTextContrast: colors.accent12,
  
  // Success (Green)
  successBg: colors.success3,
  successBgHover: colors.success4,
  successBorder: colors.success7,
  successBorderHover: colors.success8,
  successSolid: colors.success9,
  successSolidHover: colors.success10,
  successText: colors.success11,
  
  // Warning (Yellow)
  warningBg: colors.warning3,
  warningBgHover: colors.warning4,
  warningBorder: colors.warning7,
  warningBorderHover: colors.warning8,
  warningSolid: colors.warning9,
  warningSolidHover: colors.warning10,
  warningText: colors.warning11,
  
  // Danger/Error (Red)
  dangerBg: colors.danger3,
  dangerBgHover: colors.danger4,
  dangerBorder: colors.danger7,
  dangerBorderHover: colors.danger8,
  dangerSolid: colors.danger9,
  dangerSolidHover: colors.danger10,
  dangerText: colors.danger11,
  
  // Info/Blue
  infoBg: colors.info3,
  infoBgHover: colors.info4,
  infoBorder: colors.info7,
  infoBorderHover: colors.info8,
  infoSolid: colors.info9,
  infoSolidHover: colors.info10,
  infoText: colors.info11,
};
