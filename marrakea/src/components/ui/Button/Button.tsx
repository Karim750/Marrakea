import { type ButtonHTMLAttributes, type ElementType, forwardRef } from 'react';
import { cn } from '@/lib/utils/formatters';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  as?: ElementType;
  href?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, as, children, ...props }, ref) => {
    const Component = as || 'button';

    return (
      <Component
        ref={ref}
        className={cn(
          styles.button,
          styles[variant],
          styles[size],
          fullWidth && styles.fullWidth,
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Button.displayName = 'Button';
