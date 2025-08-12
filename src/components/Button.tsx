import Link from 'next/link';
import clsx from 'clsx';

type Props = {
  href?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
};

export function Button({ href = '#', children, className, variant = 'primary' }: Props) {
  const cn = clsx(
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold border transition',
    variant === 'primary' && 'bg-brand text-white border-transparent hover:brightness-95',
    variant === 'secondary' && 'bg-transparent text-brand border-brand hover:bg-brand/10',
    className
  );
  return <Link href={href} className={cn}>{children}</Link>;
}
