import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'font-semibold rounded-xl transition-all duration-200 flex items-center justify-center',
        'hover:opacity-80 active:opacity-60 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-accent text-black': variant === 'primary',
          'bg-card border border-border text-text-primary': variant === 'secondary',
          'bg-danger text-white': variant === 'danger',
          'bg-transparent text-text-primary hover:bg-card': variant === 'ghost',
        },
        {
          'h-10 px-4 text-sm': size === 'sm',
          'h-14 px-6 text-base': size === 'md',
          'h-16 px-8 text-lg': size === 'lg',
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
