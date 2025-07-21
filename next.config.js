/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.tcgdex.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { // no embedding/framing
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          { // no loading resources from other domains
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          { // url privacy protection
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          { // load resources from trusted sources
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.tcgdex.net https://api.openai.com https://api.pinecone.io;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 