// Steam capsule images, served from our own CloudFront CDN as `{appId}-capsule.jpg` (231×87).
const CAPSULE_CDN_URL: string = import.meta.env.VITE_CAPSULE_CDN_URL ?? 'https://cdn.tobypeel.com';

export function capsuleUrl(appId: number): string {
  return `${CAPSULE_CDN_URL}/${appId}-capsule.jpg`;
}
