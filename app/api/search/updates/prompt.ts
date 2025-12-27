interface GoogleSearchResult {
  title: string;
  snippet: string;
  link: string;
  publishedDate?: string;
  fullContent?: string;
}

export function buildUpdateAnalysisPrompt(
  query: string, 
  searchResults: GoogleSearchResult[], 
  lastUpdateDate: string
): string {
  const searchContent = searchResults.map((result, index) => 
    `${index + 1}. ${result.title}
${result.snippet}
${result.link}
${result.publishedDate || 'N/A'}
${result.fullContent || 'N/A'}
---`
  ).join('\n');

  return `Analyze "${query}" developments AFTER ${lastUpdateDate}

Return ONLY valid JSON starting with { and ending with }

JSON Structure:
{
  "has_new_updates": true,
  "status": "Justice/Injustice",
  "updates": [
    {
      "date": "YYYY-MM-DD",
      "title": "What happened (not case name)",
      "description": "Compact summary with all key facts, numbers, names. Use **keyword** once for most important term."
    }
  ]
}

RULES:

1. FILTERING: Only content AFTER ${lastUpdateDate}. If none: {"has_new_updates": false, "updates": []}

2. GROUPING: One update per date. Sort chronologically oldest→newest.

3. DATE: YYYY-MM-DD format matching publication date.

4. TITLE: Describe the development itself, NOT case name. Be specific and newsworthy.

5. DESCRIPTION: 
   - Concise but complete facts
   - Include specific data, numbers, names
   - Use **bold** ONCE on 2-3 word key term only
   - Escape quotes with \

6. STATUS: Analyze overall outcome, set "Justice" or "Injustice"

7. CONTENT: No speculation. Use exact article data. Professional tone.

LAST UPDATE: ${lastUpdateDate}

RESULTS:
${searchContent}

Return JSON only.`;
}