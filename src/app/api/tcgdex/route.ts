import { NextRequest, NextResponse } from 'next/server';
import { validateSetId, validateCardId, validateLanguage, sanitizeParameter } from '@/utils/validation';

const TCGDEX_BASE_URL = 'https://api.tcgdex.net/v2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const setId = searchParams.get('setId');
    const cardId = searchParams.get('cardId');
    const lang = searchParams.get('lang') || 'en';

    console.log('TCGdex API called with:', { setId, cardId, lang });

    // Enhanced input validation using shared functions
    let sanitizedSetId: string | null = null;
    let sanitizedCardId: string | null = null;
    const sanitizedLang = sanitizeParameter(lang);

    if (setId) {
      sanitizedSetId = sanitizeParameter(setId);
      if (!validateSetId(sanitizedSetId)) {
        return NextResponse.json(
          { error: 'Invalid setId format. Must be 1-20 alphanumeric characters.' },
          { status: 400 }
        );
      }
    }

    if (cardId) {
      sanitizedCardId = sanitizeParameter(cardId);
      if (!validateCardId(sanitizedCardId)) {
        return NextResponse.json(
          { error: 'Invalid cardId format. Must be 1-50 alphanumeric characters or hyphens.' },
          { status: 400 }
        );
      }
    }

    if (!validateLanguage(sanitizedLang)) {
      return NextResponse.json(
        { error: 'Invalid language format. Must be 2 lowercase letters (e.g., "en", "es").' },
        { status: 400 }
      );
    }

    // Ensure only one parameter is provided
    if (setId && cardId) {
      return NextResponse.json(
        { error: 'Cannot specify both setId and cardId. Use one or the other.' },
        { status: 400 }
      );
    }

    if (sanitizedSetId) {
      // Fetch cards from a set
      const response = await fetch(`${TCGDEX_BASE_URL}/${sanitizedLang}/sets/${sanitizedSetId}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'prof-oak-app/1.0'
        },
      });

      if (!response.ok) {
        throw new Error(`TCGdex API responded with status: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    } else if (sanitizedCardId) {
      // Fetch individual card by ID
      const response = await fetch(`${TCGDEX_BASE_URL}/${sanitizedLang}/cards/${sanitizedCardId}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'prof-oak-app/1.0'
        },
      });

      if (!response.ok) {
        throw new Error(`TCGdex API responded with status: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json({ card: data });
    } else {
      console.log('No setId or cardId provided');
      return NextResponse.json(
        { error: 'Either setId or cardId parameter is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error calling TCGdex API:', error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        return NextResponse.json(
          { 
            error: 'TCGdex API is currently unavailable. Please try again later.',
            details: 'Network connection to TCGdex failed'
          },
          { status: 503 }
        );
      }
      
      if (error.message.includes('status: 429')) {
        return NextResponse.json(
          { 
            error: 'Too many requests to TCGdex API. Please wait a moment and try again.',
            details: 'Rate limit exceeded'
          },
          { status: 429 }
        );
      }
      
      if (error.message.includes('status: 404')) {
        return NextResponse.json(
          { 
            error: 'Card or set not found in TCGdex database.',
            details: 'The requested data does not exist'
          },
          { status: 404 }
        );
      }
      
      if (error.message.includes('status: 5')) {
        return NextResponse.json(
          { 
            error: 'TCGdex API is experiencing issues. Please try again later.',
            details: 'Server error on TCGdex side'
          },
          { status: 502 }
        );
      }
    }
    
    // Generic fallback error
    return NextResponse.json(
      { 
        error: 'Unable to fetch card data from TCGdex. Please try again later.',
        details: 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 