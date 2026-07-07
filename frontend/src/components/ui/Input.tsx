import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldWrapperProps;
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldWrapperProps;

const fieldClasses =
  "w-full rounded-xl border border-hairline bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-paper disabled:text-ink-muted transition-colors";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = "", ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium tracking-wide uppercase text-ink-muted">
          {label}
        </label>
      )}
      <input ref={ref} id={id} className={`${fieldClasses} ${className}`} {...props} />
      {hint && !error && <span className="text-xs text-ink-muted">{hint}</span>}
      {error && <span className="text-xs text-accent">{error}</span>}
    </div>
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className = "", ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium tracking-wide uppercase text-ink-muted">
          {label}
        </label>
      )}
      <textarea ref={ref} id={id} className={`${fieldClasses} ${className}`} {...props} />
      {hint && !error && <span className="text-xs text-ink-muted">{hint}</span>}
      {error && <span className="text-xs text-accent">{error}</span>}
    </div>
  )
);
Textarea.displayName = "Textarea";
