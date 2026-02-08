import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'alt';
}

export default function Card({ children, variant = 'default', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-4',
        {
          'bg-card': variant === 'default',
          'bg-card-alt': variant === 'alt',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
