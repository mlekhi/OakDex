"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = "md", 
  text, 
  className = "" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg", 
    lg: "text-2xl"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} text-blue-400 animate-spin mb-2`}>
        ◓
      </div>
      {text && (
        <p className={`text-muted-foreground ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
} 