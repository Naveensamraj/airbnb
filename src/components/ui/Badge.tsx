interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variants = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-violet-100 text-violet-700',
};

const dotColors = {
  default: 'bg-slate-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  purple: 'bg-violet-500',
};

export default function Badge({ label, variant = 'default', size = 'sm', dot = false }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeClass} ${variants[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {label}
    </span>
  );
}

export function bookingStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    pending: { label: 'Pending', variant: 'warning' },
    awaiting_payment: { label: 'Awaiting Payment', variant: 'warning' },
    awaiting_approval: { label: 'Awaiting Approval', variant: 'info' },
    confirmed: { label: 'Confirmed', variant: 'success' },
    checked_in: { label: 'Checked In', variant: 'success' },
    checked_out: { label: 'Checked Out', variant: 'default' },
    cancelled: { label: 'Cancelled', variant: 'error' },
    refunded: { label: 'Refunded', variant: 'purple' },
  };
  const cfg = map[status] ?? { label: status, variant: 'default' as const };
  return <Badge label={cfg.label} variant={cfg.variant} dot />;
}

export function propertyStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    available: { label: 'Available', variant: 'success' },
    occupied: { label: 'Occupied', variant: 'info' },
    maintenance: { label: 'Maintenance', variant: 'error' },
    reserved: { label: 'Reserved', variant: 'warning' },
  };
  const cfg = map[status] ?? { label: status, variant: 'default' as const };
  return <Badge label={cfg.label} variant={cfg.variant} dot />;
}
