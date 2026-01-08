/**
 * String similarity utilities using Levenshtein distance and fuzzy matching
 */

/**
 * Calculate Levenshtein distance between two strings
 * Represents the minimum number of single-character edits required to change one word into another
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns The Levenshtein distance
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  // Handle empty strings
  if (s1.length === 0) return s2.length
  if (s2.length === 0) return s1.length

  // Create a matrix to store distances
  const matrix: number[][] = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(0))

  // Initialize first column and row
  for (let i = 0; i <= s1.length; i++) {
    matrix[0][i] = i
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[j][0] = j
  }

  // Fill in the matrix
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + cost // substitution
      )
    }
  }

  return matrix[s2.length][s1.length]
}

/**
 * Calculate similarity score based on Levenshtein distance
 * Returns a normalized score between 0 and 1, where 1 is an exact match
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score (0-1)
 */
export function levenshteinSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2)
  const maxLength = Math.max(str1.length, str2.length)

  if (maxLength === 0) return 1.0 // Both strings are empty

  return 1 - distance / maxLength
}

/**
 * Simple fuzzy matching that checks if all characters in the pattern appear
 * in the target string in the same order (but not necessarily consecutively)
 *
 * @param pattern - The search pattern
 * @param target - The string to search in
 * @returns Fuzzy match score (0-1)
 */
export function fuzzyScore(pattern: string, target: string): number {
  const p = pattern.toLowerCase().trim()
  const t = target.toLowerCase().trim()

  if (p.length === 0) return 1.0
  if (t.length === 0) return 0.0

  let patternIndex = 0
  let targetIndex = 0
  let matchedCharacters = 0

  while (targetIndex < t.length && patternIndex < p.length) {
    if (p[patternIndex] === t[targetIndex]) {
      matchedCharacters++
      patternIndex++
    }
    targetIndex++
  }

  // If we matched all pattern characters, calculate score based on position
  if (patternIndex === p.length) {
    // Bonus for matches that appear early
    const consecutiveBonus = matchedCharacters / p.length
    const positionBonus = 1 - targetIndex / t.length / 2
    return Math.max(0.5, Math.min(1, (consecutiveBonus + positionBonus) / 2))
  }

  return 0.0
}

/**
 * Extract reference IDs and keywords from a string
 * Looks for common patterns like invoice numbers, order IDs, etc.
 *
 * @param text - The text to extract from
 * @returns Array of extracted reference IDs and keywords
 */
export function extractReferences(text: string): string[] {
  const refs: string[] = []

  if (!text) return refs

  // Extract numbers that might be invoice/order IDs
  const numberMatches = text.match(/\b\d{3,}\b/g)
  if (numberMatches) {
    refs.push(...numberMatches)
  }

  // Extract alphanumeric sequences (like INV-001, ORD-12345)
  const alphanumericMatches = text.match(/\b[A-Z]{1,4}-?\d{1,10}\b/gi)
  if (alphanumericMatches) {
    refs.push(...alphanumericMatches.map((m) => m.toUpperCase()))
  }

  // Extract words (potential customer names or descriptions)
  const words = text
    .toLowerCase()
    .split(/[\s\-_(),]/g)
    .filter((w) => w.length > 2)
  refs.push(...words)

  return [...new Set(refs)] // Remove duplicates
}

/**
 * Compare two sets of references and return a similarity score
 * Uses both exact matches and fuzzy matching
 *
 * @param refs1 - First set of references
 * @param refs2 - Second set of references
 * @returns Similarity score (0-1)
 */
export function compareReferenceSets(refs1: string[], refs2: string[]): number {
  if (refs1.length === 0 && refs2.length === 0) return 1.0
  if (refs1.length === 0 || refs2.length === 0) return 0.0

  let totalScore = 0
  let comparisons = 0

  // Check each reference from refs1 against all in refs2
  for (const ref1 of refs1) {
    let bestMatch = 0

    for (const ref2 of refs2) {
      // Exact match (highest priority)
      if (ref1 === ref2) {
        bestMatch = 1.0
        break
      }

      // Levenshtein similarity
      const similarity = levenshteinSimilarity(ref1, ref2)
      bestMatch = Math.max(bestMatch, similarity)

      // Fuzzy match
      const fuzzy = fuzzyScore(ref1, ref2)
      bestMatch = Math.max(bestMatch, fuzzy)
    }

    totalScore += bestMatch
    comparisons++
  }

  return comparisons > 0 ? totalScore / comparisons : 0.0
}
