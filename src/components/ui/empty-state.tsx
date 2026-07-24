import { type LucideIcon, AlertCircle, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "error" | "warning";
  className?: string;
}

const variantStyles = {
  default: {
    container: "border-dashed border-border",
    icon: "text-muted-foreground/40",
    title: "text-foreground",
    description: "text-muted-foreground",
  },
  error: {
    container: "border-red-500/20 bg-red-500/5",
    icon: "text-red-500",
    title: "text-red-500",
    description: "text-red-500/80",
  },
  warning: {
    container: "border-amber-500/20 bg-amber-500/5",
    icon: "text-amber-500",
    title: "text-amber-500",
    description: "text-amber-500/80",
  },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const styles = variantStyles[variant];
  const DefaultIcon = Icon || (variant === "error" ? AlertCircle : SearchX);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border py-12 px-6 text-center",
        styles.container,
        className
      )}
    >
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-full bg-muted/50", styles.icon)}>
        <DefaultIcon className="h-7 w-7" />
      </div>
      <div className="max-w-xs">
        <p className={cn("text-sm font-semibold", styles.title)}>{title}</p>
        {description && (
          <p className={cn("mt-1 text-xs leading-relaxed", styles.description)}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          size="sm"
          className="mt-1 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
