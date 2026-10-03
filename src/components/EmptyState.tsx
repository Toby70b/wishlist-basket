import type { ReactNode } from 'react';

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty" role="status">
      <h2 className="empty__title">{title}</h2>
      {children && <div className="empty__body">{children}</div>}
    </div>
  );
}
