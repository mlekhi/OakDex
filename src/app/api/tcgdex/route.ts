import { NextRequest, NextResponse } from 'next/server';

const TCGDEX_BASE_URL = 'https://api.tcgdex.net/v2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const setId = searchParams.get('setId');
    const cardId = searchParams.get('cardId');
    const lang = searchParams.get('lang') || 'en';

    console.log('TCGdex API called with:', { setId, cardId, lang });

    if (setId) {
      // Fetch cards from a set
      console.log('Fetching set:', setId);
      const response = await fetch(`${TCGDEX_BASE_URL}/${lang}/sets/${setId}`, {
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
    } else if (cardId) {
      // Fetch individual card by ID
      console.log('Fetching card:', cardId);
      const response = await fetch(`${TCGDEX_BASE_URL}/${lang}/cards/${cardId}`, {
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
    return NextResponse.json(
      { error: 'Failed to fetch data from TCGdex API' },
      { status: 500 }
    );
  }
} 