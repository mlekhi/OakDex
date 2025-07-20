import { NextRequest, NextResponse } from 'next/server';

const TCGDEX_BASE_URL = 'https://api.tcgdex.net/v2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const setId = searchParams.get('setId');
    const lang = searchParams.get('lang') || 'en';

    if (!setId) {
      return NextResponse.json(
        { error: 'setId parameter is required' },
        { status: 400 }
      );
    }

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
  } catch (error) {
    console.error('Error calling TCGdex API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from TCGdex API' },
      { status: 500 }
    );
  }
} 