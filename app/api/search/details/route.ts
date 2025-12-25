import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import config from '../../../api/config.json';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const API_SECRET_KEY = process.env.API_SECRET_KEY;

interface EventDetails {
  location: string;
  details: string;
  accused: string[];
  victims: string[];
  timeline: string[];
  sources: string[];
  images: string[];
}

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
}

interface ScrapedArticle {
  url: string;
  title: string;
  content: string;
  publishDate?: string;
  author?: string;
  source: string;
}

interface ScrapedData {
  results: GoogleSearchResult[];
  articles: ScrapedArticle[];
  images: string[];
}

function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

function isHTMLResponse(response: string): boolean {
  return response.trim().toLowerCase().startsWith('<!doctype') || 
         response.trim().toLowerCase().startsWith('<html');
}

function extractArticleContent(html: string, url: string): ScrapedArticle {
  let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  cleanHtml = cleanHtml.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');
  cleanHtml = cleanHtml.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');
  cleanHtml = cleanHtml.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
  
  const titleMatch = cleanHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  
  const metaDescMatch = cleanHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const metaContent = metaDescMatch ? metaDescMatch[1] : '';
  
  const articleMatches = cleanHtml.match(/<(?:article|main|div[^>]*class=["'][^"']*(?:content|article|post|story|news|entry|body)[^"']*["'])[^>]*>([\s\S]*?)<\/(?:article|main|div)>/gi);
  let content = '';
  
  if (articleMatches && articleMatches.length > 0) {
    const longestMatch = articleMatches.reduce((a, b) => a.length > b.length ? a : b);
    content = longestMatch
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
  
  if (!content || content.length < 300) {
    const paragraphs = cleanHtml.match(/<p[^>]*>([^<]+(?:<[^p][^>]*>[^<]*<\/[^>]*>[^<]*)*)<\/p>/gi);
    if (paragraphs && paragraphs.length > 0) {
      content = paragraphs
        .map(p => p.replace(/<[^>]*>/g, ' ').trim())
        .filter(p => p.length > 50)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }
  
  if (!content || content.length < 200) {
    const divMatches = cleanHtml.match(/<div[^>]*class=["'][^"']*(?:text|content|article)[^"']*["'][^>]*>([^<]*(?:<[^\/][^>]*>[^<]*<\/[^>]*>[^<]*)*)<\/div>/gi);
    if (divMatches) {
      const textContent = divMatches
        .map(div => div.replace(/<[^>]*>/g, ' ').trim())
        .filter(t => t.length > 50)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (textContent.length > content.length) {
        content = textContent;
      }
    }
  }
  
  if (!content || content.length < 100) {
    content = metaContent;
  }
  
  const source = new URL(url).hostname.replace('www.', '');
  
  return {
    url,
    title,
    content: content.substring(0, 5000),
    publishDate: '',
    author: '',
    source
  };
}

async function scrapeArticle(url: string): Promise<ScrapedArticle | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const html = await response.text();
    
    if (!html || html.length < 100) {
      console.warn(`Insufficient content from ${url}`);
      return null;
    }
    
    return extractArticleContent(html, url);
    
  } catch (error) {
    if (error instanceof Error) {
      console.warn(`Error scraping ${url}: ${error.message}`);
    }
    return null;
  }
}

async function searchImages(query: string): Promise<string[]> {
  const API_KEY = process.env.GOOGLE_API_KEY;
  const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!API_KEY || !SEARCH_ENGINE_ID) {
    console.warn('Google API credentials not configured for image search');
    return [];
  }

  try {
    console.log('Searching for images...');
    
    const imageSearchUrl = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&searchType=image&num=10&safe=active&imgSize=medium`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const imageResponse = await fetch(imageSearchUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);

    if (!imageResponse.ok) {
      console.warn(`Image search failed with status: ${imageResponse.status}`);
      return [];
    }

    const imageResponseText = await imageResponse.text();
    
    if (!isValidJSON(imageResponseText) || isHTMLResponse(imageResponseText)) {
      console.warn('Invalid JSON response from image search');
      return [];
    }

    const imageData = JSON.parse(imageResponseText);
    
    if (imageData.error) {
      console.warn('Image search API error:', imageData.error);
      return [];
    }

    if (!imageData.items || !Array.isArray(imageData.items)) {
      console.warn('No image items found in response');
      return [];
    }

    const imageLinks = imageData.items
      .map((item: any) => item.link)
      .filter(Boolean)
      .filter((link: string) => {
        const url = link.toLowerCase();
        return !url.includes('favicon') && 
               !url.includes('/logo') && 
               !url.includes('/icon') &&
               (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || 
                url.includes('.webp') || url.includes('.gif') || url.includes('image'));
      })
      .slice(0, 10);

    console.log(`Found ${imageLinks.length} valid image links`);
    return imageLinks;

  } catch (error) {
    console.warn('Image search error:', error);
    return [];
  }
}

async function searchGoogleAndScrape(query: string): Promise<ScrapedData> {
  const API_KEY = process.env.GOOGLE_API_KEY;
  const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!API_KEY || !SEARCH_ENGINE_ID) {
    throw new Error('Google API credentials not configured');
  }

  try {
    const allResults: GoogleSearchResult[] = [];

    for (let page = 1; page <= 3; page++) {
      const startIndex = (page - 1) * 10 + 1;
      
      const webSearchUrl = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=10&start=${startIndex}`;
      
      console.log(`Making web search request for page ${page}...`);
      
      try {
        const webResponse = await fetch(webSearchUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!webResponse.ok) {
          console.warn(`Web search page ${page} failed:`, webResponse.status);
          continue;
        }

        const webResponseText = await webResponse.text();
        
        if (isHTMLResponse(webResponseText) || !isValidJSON(webResponseText)) {
          console.warn(`Invalid response for page ${page}, skipping`);
          continue;
        }

        const webData = JSON.parse(webResponseText);

        if (webData.error) {
          console.warn(`API error on page ${page}:`, webData.error);
          continue;
        }

        const pageResults: GoogleSearchResult[] = webData.items?.map((item: any) => ({
          title: item.title || 'No title',
          link: item.link || '',
          snippet: item.snippet || 'No snippet available',
          displayLink: item.displayLink || '',
        })) || [];

        allResults.push(...pageResults);
        console.log(`Page ${page}: Found ${pageResults.length} results`);

        if (page < 3) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.warn(`Error on page ${page}:`, error);
        continue;
      }
    }

    console.log(`Total search results: ${allResults.length}`);

    const filteredResults = allResults.filter((result, index, self) => {
      const isDuplicate = index !== self.findIndex(r => r.link === result.link);
      if (isDuplicate) return false;
      
      const url = result.link.toLowerCase();
      const domain = result.displayLink?.toLowerCase() || '';
      
      const blockDomains = ['tiktok.com', 'pinterest.com', 'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com'];
      const isBlocked = blockDomains.some(blocked => domain.includes(blocked) || url.includes(blocked));
      
      return !isBlocked && result.title && result.snippet;
    });

    console.log(`Filtered to ${filteredResults.length} valid results`);

    const redditResults = filteredResults.filter(r => 
      r.displayLink?.toLowerCase().includes('reddit.com') || r.link.toLowerCase().includes('reddit.com')
    ).slice(0, 2);
    
    const nonRedditResults = filteredResults.filter(r => 
      !r.displayLink?.toLowerCase().includes('reddit.com') && !r.link.toLowerCase().includes('reddit.com')
    );

    const articlesToScrape = [...nonRedditResults.slice(0, 16), ...redditResults].slice(0, 18);
    
    console.log(`Scraping content from ${articlesToScrape.length} articles (including max ${redditResults.length} Reddit)...`);
    
    const scrapePromises = articlesToScrape.map(result => scrapeArticle(result.link));
    const scrapedArticles = await Promise.allSettled(scrapePromises);
    
    const successfulArticles: ScrapedArticle[] = scrapedArticles
      .filter((result): result is PromiseFulfilledResult<ScrapedArticle> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value)
      .filter(article => article.content.length > 100);

    console.log(`Successfully scraped ${successfulArticles.length} articles`);

    const imageLinks = await searchImages(query);
    console.log(`Found ${imageLinks.length} image URLs`);

    return { 
      results: filteredResults, 
      articles: successfulArticles,
      images: imageLinks
    };

  } catch (error) {
    console.error('Google Search API error:', error);
    throw new Error(`Failed to fetch data from Google Search API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function processArticlesWithGroq(scrapedData: ScrapedData, query: string): Promise<Omit<EventDetails, 'images' | 'sources'>> {
  const topArticles = scrapedData.articles
    .sort((a, b) => b.content.length - a.content.length)
    .slice(0, 15);

  const articleContent = topArticles.map((article, index) => {
    const contentToUse = article.content.substring(0, 4000);
    return `
=== SOURCE ${index + 1}: ${article.source.toUpperCase()} ===
Title: ${article.title}
URL: ${article.url}
Content: ${contentToUse}
---`;
  }).join('\n\n');

  const topSnippets = scrapedData.results
    .slice(0, 15)
    .map((result, index) => `${index + 1}. [${result.displayLink}] ${result.title}: ${result.snippet}`)
    .join('\n');

  const prompt = `You are a factual data extraction system. Extract comprehensive information about: "${query}"

SOURCES:
${articleContent}

SNIPPETS:
${topSnippets}

CRITICAL: You must respond with ONLY valid JSON. No preamble, no explanation, no markdown formatting, no backticks. Start with { and end with }.

EXTRACTION RULES:
- Extract ONLY verifiable facts from sources
- Include all specifics: names, ages, numbers, dates, charges, statute codes, amounts, locations
- Each person = separate array entry (accused and victims)
- Use **highlights** on 2-3 word phrases ONLY for the most critical facts (charges, verdicts, death counts, bail amounts)
- Keep highlights sparse: 2-3 in details section, at least 1 in accused/victims/timeline entries
- Write complete, detailed sentences with maximum factual density
- Escape all quotes inside strings using backslash

JSON STRUCTURE (respond with this exact format):
{
  "location": "string",
  "details": "string",
  "accused": ["string per person"],
  "victims": ["string per person"],
  "timeline": ["string per event"]
}

FIELD SPECIFICATIONS:

location: City, State/Province, Country. For lesser-known: (X km from Major City)

details: One compelling headline sentence. Then comprehensive coverage in 800-1200 words covering background context, the incident chronologically with exact times and locations, all parties involved with full details, investigation specifics including evidence and testimonies, legal proceedings with exact charges and statute numbers, official statements from authorities, witness accounts, media coverage and public reaction, current status of all proceedings, and outcomes. Use **2-3 word highlights** sparingly on critical facts only.

accused: Array with separate entry per person. Each entry 150-250 words: Full legal name with aliases, exact age/DOB, occupation/title, employer, business affiliations, residential address, education, specific criminal role and involvement level, relationship to victims/co-accused, complete charges with statute numbers, additional charges, plea entered, bail amount and reasoning, bail status, legal representation with attorney names, custody location and facility, custody conditions, prior record, co-conspirators, trial date, aggravating factors, mitigating circumstances, statements made. Use **highlights** sparingly on critical facts.

victims: Array with separate entry per person. Each entry 150-250 words: Full legal name if released, exact age/DOB, gender, occupation/title, employer, residential location, education, family details with names and ages, relationship to accused, location during incident, complete injury description with medical terminology or cause of death, immediate medical response, emergency services, hospital names, specific surgeries/procedures with dates, ICU status, current condition and prognosis, recovery timeline, permanent disabilities, psychological trauma, impact on dependents, financial impact, victim advocacy involvement, impact statements. Use **highlights** sparingly on critical facts.

timeline: Array with separate entry per date. Each entry format "Month Day, Year: 6-10 detailed sentences" covering what happened, individuals involved and roles, precise locations with addresses, specific actions step-by-step, evidence discovered with details, official responses, witness observations, legal filings with case numbers, media reports, community reactions, specific times if available. Use **2-3 word highlights** sparingly on critical facts only.

REQUIREMENTS:
- Details: 800-1200 words minimum
- Accused entries: 150-250 words each
- Victim entries: 150-250 words each
- Timeline entries: 6-10 sentences each
- Highlights: 2-3 words max, used sparingly
- No speculation—only verified facts
- Escape all quotes in strings

RESPOND WITH ONLY THE JSON OBJECT. NO OTHER TEXT.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a precise data extraction system. You MUST respond with ONLY valid JSON. No markdown, no backticks, no preamble, no explanation. Start your response with { and end with }. Ensure all strings are properly escaped."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: config.groq.model,
      temperature: config.groq.temperature,
      max_tokens: config.groq.max_tokens,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from Groq API');
    }

    let cleanedResponse = response.trim();
    
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    cleanedResponse = cleanedResponse.trim();
    
    const jsonStart = cleanedResponse.indexOf('{');
    const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      console.error('No JSON object found in response. First 500 chars:', cleanedResponse.substring(0, 500));
      throw new Error('Invalid JSON response from Groq - no JSON object found');
    }
    
    const jsonString = cleanedResponse.substring(jsonStart, jsonEnd);
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('First 1000 chars of JSON string:', jsonString.substring(0, 1000));
      console.error('Last 500 chars of JSON string:', jsonString.substring(Math.max(0, jsonString.length - 500)));
      throw new Error(`Invalid JSON format from Groq response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }
    
    const requiredFields: (keyof Omit<EventDetails, 'images' | 'sources'>)[] = ['location', 'details', 'accused', 'victims', 'timeline'];
    for (const field of requiredFields) {
      if (!(field in parsedData)) {
        parsedData[field] = Array.isArray(['accused', 'victims', 'timeline'].includes(field)) ? [] : '';
      }
    }
    
    console.log('Groq analysis complete:');
    console.log(`- Details length: ${parsedData.details?.length || 0} characters`);
    console.log(`- Accused entries: ${parsedData.accused?.length || 0}`);
    console.log(`- Victim entries: ${parsedData.victims?.length || 0}`);
    console.log(`- Timeline entries: ${parsedData.timeline?.length || 0}`);
    
    return parsedData;
    
  } catch (error) {
    console.error('Groq processing error:', error);
    throw new Error(`Failed to process data with Groq API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function fetchEventFromDatabase(event_id: string) {
  const { data: eventData, error: fetchError } = await supabase
    .from('events')
    .select('query, title')
    .eq('event_id', event_id)
    .single();
    
  if (fetchError) {
    console.error('Event fetch error:', fetchError);
    throw new Error(`Event not found: ${fetchError.message}`);
  }
  
  if (!eventData || !eventData.query) {
    throw new Error('Event not found or missing query');
  }
  
  return eventData;
}

async function saveEventDetails(event_id: string, structuredData: EventDetails) {
  console.log(`Saving event details for ${event_id}:`);
  console.log(`- Sources: ${structuredData.sources.length}`);
  console.log(`- Images: ${structuredData.images.length}`);

  const { data: existingDetails, error: checkError } = await supabase
    .from('event_details')
    .select('event_id')
    .eq('event_id', event_id)
    .single();

  const timestamp = new Date().toISOString();
  
  let dbOperation;
  if (existingDetails && !checkError) {
    console.log('Updating existing record...');
    dbOperation = supabase
      .from('event_details')
      .update({
        location: structuredData.location,
        details: structuredData.details,
        accused: structuredData.accused,
        victims: structuredData.victims,
        timeline: structuredData.timeline,
        sources: structuredData.sources,
        images: structuredData.images,
        updated_at: timestamp
      })
      .eq('event_id', event_id);
  } else {
    console.log('Inserting new record...');
    dbOperation = supabase
      .from('event_details')
      .insert({
        event_id: event_id,
        location: structuredData.location,
        details: structuredData.details,
        accused: structuredData.accused,
        victims: structuredData.victims,
        timeline: structuredData.timeline,
        sources: structuredData.sources,
        images: structuredData.images,
        created_at: timestamp,
        updated_at: timestamp
      });
  }

  const { error: saveError } = await dbOperation;
  if (saveError) {
    console.error('Database save error:', saveError);
    throw new Error(`Failed to save event details: ${saveError.message}`);
  }
  
  console.log('Successfully saved event details');
}

async function updateEventTimestamp(event_id: string) {
  const { error: updateError } = await supabase
    .from('events')
    .update({ last_updated: new Date().toISOString() })
    .eq('event_id', event_id);

  if (updateError) {
    console.warn('Failed to update timestamp:', updateError);
  }
}

async function processEvent(event_id: string) {
  console.log(`Processing event for detailed analysis: ${event_id}`);

  const eventData = await fetchEventFromDatabase(event_id);
  console.log(`Event: ${eventData.title}`);
  console.log(`Query: ${eventData.query}`);

  console.log('Conducting comprehensive search and scraping...');
  const scrapedData = await searchGoogleAndScrape(eventData.query);

  if (!scrapedData.articles || scrapedData.articles.length === 0) {
    throw new Error('No articles found or scraped');
  }

  console.log(`Scraped ${scrapedData.articles.length} articles and found ${scrapedData.images.length} images for detailed analysis`);

  console.log('Processing with Groq for comprehensive detailed analysis...');
  const analyzedData = await processArticlesWithGroq(scrapedData, eventData.query);

  const scrapedSourceUrls = scrapedData.articles
    .filter(article => article.url && article.content.length > 100)
    .map(article => article.url);

  const structuredData: EventDetails = {
    ...analyzedData,
    sources: scrapedSourceUrls,
    images: scrapedData.images
  };

  console.log(`Detailed analysis complete: ${scrapedSourceUrls.length} sources analyzed, ${scrapedData.images.length} images found`);
  console.log(`Details length: ${structuredData.details.length} characters`);
  console.log(`Timeline events: ${structuredData.timeline.length}`);
  console.log(`Accused parties: ${structuredData.accused.length}`);
  console.log(`Victims: ${structuredData.victims.length}`);

  await saveEventDetails(event_id, structuredData);
  await updateEventTimestamp(event_id);

  console.log('Successfully completed detailed processing');

  return {
    eventData,
    structuredData,
    scrapedData
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');
    const api_key = searchParams.get('api_key');

    if (!api_key || api_key !== API_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    if (!event_id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const { eventData, structuredData, scrapedData } = await processEvent(event_id);

    return NextResponse.json({
      success: true,
      message: "Event analyzed and saved successfully with detailed information",
      event_id: event_id,
      event_title: eventData.title,
      query_used: eventData.query,
      articles_scraped: structuredData.sources.length,
      images_found: structuredData.images.length,
      sources_analyzed: [...new Set(scrapedData.articles.map(a => a.source))].join(', '),
      analysis_summary: {
        location: structuredData.location,
        accused_count: structuredData.accused.length,
        victims_count: structuredData.victims.length,
        timeline_events: structuredData.timeline.length,
        details_length: structuredData.details.length,
        total_content_analyzed: scrapedData.articles.reduce((sum, article) => sum + article.content.length, 0)
      }
    });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during detailed event analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { event_id } = await request.json();

    if (!event_id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const { eventData, structuredData, scrapedData } = await processEvent(event_id);

    return NextResponse.json({
      success: true,
      event_id: event_id,
      event_title: eventData.title,
      query_used: eventData.query,
      data: structuredData,
      articles_scraped: structuredData.sources.length,
      images_found: structuredData.images.length,
      sources_analyzed: [...new Set(scrapedData.articles.map(a => a.source))].join(', '),
      details_length: structuredData.details.length,
      comprehensive_analysis: true
    });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during detailed event analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}