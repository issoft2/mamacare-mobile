import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { colors, typography, spacing } from '../tokens';

interface SafeMarkdownProps {
  content: string;
}

export function SafeMarkdown({ content }: SafeMarkdownProps) {
  return (
    <Markdown style={markdownStyles}>
      {content}
    </Markdown>
  );
}

// ── Markdown Layout Styles linked directly to Safeborn Design Tokens ──────────

const markdownStyles = {
  // Main copy configuration
  body: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.base, // 16px
    color: colors.gray[800],
    lineHeight: 24, 
  },
  
  // Custom H2 layout styling (## Heading)
  heading2: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.fontSize.lg, // 18px
    fontWeight: typography.fontWeight.bold,
    color: colors.navy[800],
    marginTop: spacing[4], // 16px
    marginBottom: spacing[2], // 8px
    lineHeight: 24,
  },

  // Highlight bold sections (**text**)
  strong: {
    fontWeight: typography.fontWeight.bold,
    color: colors.rose[700], // Premium brand rose accent
  },

  // List structuring elements
  bullet_list: {
    marginTop: spacing[1],
    marginBottom: spacing[1],
  },
  
  bullet_list_row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[1],
  },
  
  bullet_list_icon: {
    fontSize: typography.fontSize.lg,
    color: colors.rose[500],
    marginRight: spacing[2], // 8px
    lineHeight: 24,
    ...Platform.select({
      ios: { transform: [{ translateY: -1 }] },
      android: { transform: [{ translateY: 1 }] },
    }),
  },
  
  bullet_list_content: {
    flex: 1,
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.base,
    color: colors.gray[800],
    lineHeight: 24,
  },
  
  // Eliminates layout padding overlaps within dynamic chat bubbles
  paragraph: {
    marginTop: spacing[1],
    marginBottom: spacing[1],
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
} as StyleSheet.NamedStyles<any>;