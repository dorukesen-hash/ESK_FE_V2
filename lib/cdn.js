export function resolveImageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const base = (process.env.NEXT_PUBLIC_CDN_URL || '').replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');

  return `${base}/${cleanPath}`;
}
