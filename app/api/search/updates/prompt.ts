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
  return `Analyze news articles about "${query}" published after ${lastUpdateDate}.

Extract meaningful updates and return ONLY valid JSON:

{
  "status": "Justice" or "Injustice",
  "updates": [
    {
      "date": "YYYY-MM-DD",
      "title": "Specific development (not case name)",
      "description": "Concise summary with key facts, numbers, names. Use **keyword** once for most important term."
    }
  ]
}

RULES:
- One update per date, sorted chronologically (oldest→newest)
- DATE: YYYY-MM-DD format from article publication date
- TITLE: Describe the event/development, be specific and newsworthy
- DESCRIPTION: Complete facts, include data/numbers/names, **bold** once, escape quotes with \, no speculation
- STATUS: Overall outcome - "Justice" or "Injustice"
- Skip articles without meaningful new information

LAST UPDATE: ${lastUpdateDate}

ARTICLES:
${searchResults.map((result, index) => 
  `${index + 1}. ${result.title}
${result.snippet}
Published: ${result.publishedDate || 'N/A'}
Full Content: ${result.fullContent || 'N/A'}
---`
).join('\n')}`;
}