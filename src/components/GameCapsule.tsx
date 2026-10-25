import { useState } from 'react';
import { capsuleUrl } from './capsule';

type Props = {
  appId: number;
  size?: 'row' | 'thumb';
};

/**
 * A game's capsule image, or a same-sized placeholder if the CDN has none (404) or it fails
 * to load. Decorative: the game's name is always shown next to it, so alt is empty.
 * Give it `key={appId}` where the same slot can show different games, so a failed state
 * doesn't carry over to the next game.
 */
export function GameCapsule({ appId, size = 'row' }: Props) {
  const [failed, setFailed] = useState(false);
  const className = `capsule capsule--${size}`;

  if (failed) {
    return (
      <span className={`${className} capsule--placeholder`} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="2.5" y="7" width="19" height="11" rx="5.5" />
          <path d="M7.5 10.5v4M5.5 12.5h4" strokeLinecap="round" />
          <circle cx="15.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="17.5" cy="13.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      </span>
    );
  }

  return (
    <img
      className={className}
      src={capsuleUrl(appId)}
      alt=""
      width={231}
      height={87}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
