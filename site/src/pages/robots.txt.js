export function GET({ site }) {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${new URL(import.meta.env.BASE_URL + "sitemap.xml", site).href}\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
