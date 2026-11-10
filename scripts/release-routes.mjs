// Every public content route must agree before a release can be published.
export const releaseRoutes = [
  '/', '/what-we-do', '/how-we-work', '/our-work', '/our-approach', '/contact', '/privacy',
  ...['retail-pricing', 'technology-deployment', 'remote-infrastructure-printing', 'month-end-reporting'].map(slug => `/our-work/${slug}`),
];
