/** @type {import('next').NextConfig} */
const nextConfig = {
  // أضف هذا الجزء فقط - لا يخرب أي شيء
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' }
        ]
      }
    ];
  }
}

module.exports = nextConfig