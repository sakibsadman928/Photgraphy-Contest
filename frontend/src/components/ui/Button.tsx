import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover hover:-translate-y-0.5 active:translate-y-0",
  secondary:
    "bg-white text-ink border border-hairline hover:border-accent hover:text-accent-text hover:-translate-y-0.5",
  ghost: "bg-transparent text-ink hover:bg-accent/10 hover:text-accent-text",
  danger:
    "bg-white border-2 border-accent text-accent-text hover:bg-accent/10 hover:-translate-y-0.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      loading,
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
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
  },
);
Button.displayName = "Button";

export default Button;
