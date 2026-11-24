/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { dirs: ['src'] },
  // Pin the project root to this folder. Without it, Next.js can pick up a
  // package.json/lockfile in a parent folder (e.g. the user's home folder) and
  // load the wrong Tailwind version from there, leaving the site unstyled.
  outputFileTracingRoot: __dirname,

  // Old URLs keep working after the folder clean-up.
  async redirects() {
    return [
      // Winnerland moved out of /public into a real Next.js section.
      { source: '/winnerland.html', destination: '/winnerland', permanent: true },
      { source: '/winnerland2.html', destination: '/winnerland', permanent: true },
      { source: '/school-portal-demo', destination: '/winnerland', permanent: true },
      { source: '/school-portal-demo/login.html', destination: '/winnerland/login', permanent: true },
      { source: '/school-portal-demo/watchlist.html', destination: '/winnerland/watchlist', permanent: true },
      { source: '/school-portal-demo/polls.html', destination: '/winnerland/polls', permanent: true },
      { source: '/school-portal-demo/admin.html', destination: '/winnerland/admin', permanent: true },
      { source: '/school-portal-demo/:path*', destination: '/winnerland', permanent: true },
      { source: '/teacher-demo.html', destination: '/', permanent: true },

      // Library display screens now live under /library.
      { source: '/levents.html', destination: '/library/events.html', permanent: true },
      { source: '/Libraryevents', destination: '/library/events-legacy.html', permanent: true },
      { source: '/librarydash.html', destination: '/library/dashboard.html', permanent: true },

      // Proposal PDF has a tidier name.
      { source: '/:file(Makertruck.+Proposal\\.pdf)', destination: '/docs/makertruck-proposal.pdf', permanent: true },
    ];
  },
};

module.exports = nextConfig;
