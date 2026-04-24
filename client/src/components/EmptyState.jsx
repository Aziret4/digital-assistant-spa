import { IconInbox } from './Icons';

export default function EmptyState({ icon, title, description, action }) {
  const IconComponent = icon || IconInbox;
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <IconComponent width={48} height={48} />
      </div>
      <h3>{title}</h3>
      {description && <p className="muted">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
