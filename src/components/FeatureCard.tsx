type Props = {
  title: string;
  text: string;
  icon?: 'search' | 'calendar' | 'check' | 'truck';
};

export function FeatureCard({ title, text, icon = 'search' }: Props) {
  return (
    <div className="rounded-xl border border-base-200 p-4 bg-surface">
      <div className="text-brand mb-2">{iconEmoji(icon)}</div>
      <div className="font-medium">{title}</div>
      <div className="text-sm text-base-700 mt-1">{text}</div>
    </div>
  );
}

function iconEmoji(icon: Props['icon']) {
  switch (icon) {
    case 'calendar': return '📆';
    case 'check': return '✅';
    case 'truck': return '🚚';
    default: return '🔎';
  }
}
