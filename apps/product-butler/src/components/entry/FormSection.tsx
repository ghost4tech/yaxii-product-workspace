import React from 'react';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  title: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** Borderless form section: eyebrow header + rule, no nested card. */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  hint,
  icon: Icon,
  action,
  className,
  children,
}) => (
  <section className={cn('min-w-0', className)}>
    <header className="flex items-center gap-2.5 pb-2.5 mb-3 border-b border-border">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-foreground/70">
        {title}
      </h3>
      {hint && (
        <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">{hint}</span>
      )}
      {action && <div className="ms-auto shrink-0">{action}</div>}
    </header>
    <div className="stack">{children}</div>
  </section>
);

/** Small labelled field wrapper used for non-react-hook-form controls. */
export const FieldShell: React.FC<{
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, hint, htmlFor, children, className }) => (
  <div className={cn('min-w-0', className)}>
    <label htmlFor={htmlFor} className="field-label flex items-center gap-1.5">
      {label}
      {hint && <span className="font-normal text-muted-foreground">· {hint}</span>}
    </label>
    {children}
  </div>
);
