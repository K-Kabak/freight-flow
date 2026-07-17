import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-emerald-800",
  outline: "border border-slate-200 bg-white hover:bg-slate-50",
  ghost: "hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function buttonClassName({
  className,
  variant = "primary",
}: {
  className?: string;
  variant?: ButtonVariant;
} = {}) {
  return cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    className,
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button className={buttonClassName({ className, variant })} {...props} />;
}
