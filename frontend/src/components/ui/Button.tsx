import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-gradient text-white shadow-glow hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0",
  secondary:
    "bg-white text-ink border border-hairline hover:border-accent hover:text-accent hover:-translate-y-0.5",
  ghost: "bg-transparent text-ink hover:bg-accent/5 hover:text-accent",
  danger: "bg-pink text-white hover:bg-pink/90 hover:-translate-y-0.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading, disabled, className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {loading ? "Working…" : children}
      </button>
    );
  }
);
Button.displayName = "Button";

export default Button;

