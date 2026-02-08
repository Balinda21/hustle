import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, rightIcon, className, ...props }, ref) => {
    return (
      <div
        className={cn(
          'flex items-center bg-card rounded-xl h-14 px-4 border border-[#2a2a2a]',
          className
        )}
      >
        {icon && <span className="mr-3 text-text-secondary">{icon}</span>}
        <input
          ref={ref}
          className="flex-1 bg-transparent text-text-primary text-base outline-none placeholder:text-text-secondary"
          {...props}
        />
        {rightIcon && <span className="ml-2 text-text-secondary">{rightIcon}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
