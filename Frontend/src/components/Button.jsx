import { cn } from '../lib/utils';

const Button = ({ 
  children, 
  type = "submit", 
  variant = "default",
  size = "default",
  className,
  ...props 
}) => {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-gradient-to-r from-[#0fa6e5] to-[#00a0e3] text-white hover:from-[#00a0e3] hover:to-[#0fa6e5]": variant === "default",
          "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
          "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
          "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground": variant === "ghost",
          "bg-transparent text-foreground underline-offset-4 hover:underline": variant === "link",
          "bg-gray-900 text-white border border-white hover:bg-gray-800": variant === "signature",
          "bg-green-600 text-white hover:bg-green-700": variant === "success",
          "bg-cyan-600 text-white hover:bg-cyan-700": variant === "primary",
          "bg-orange-600 text-white hover:bg-orange-700": variant === "warning",
          "bg-purple-600 text-white hover:bg-purple-700": variant === "info",
        },
        {
          "h-10 px-4 py-2": size === "default",
          "h-9 rounded-md px-3": size === "sm",
          "h-11 rounded-md px-8": size === "lg",
          "h-9 w-9": size === "icon",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
