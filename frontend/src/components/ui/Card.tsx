import { HTMLAttributes } from "react";

export default function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-surface border border-hairline rounded-xl shadow-sm p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
