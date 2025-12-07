import React from "react";
import PropTypes from "prop-types";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  startIcon,
  endIcon,
  isLoading,
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/30 focus:ring-primary",
    secondary:
      "bg-secondary text-secondary-foreground hover:brightness-110 shadow-lg shadow-secondary/30 focus:ring-secondary",
    outline:
      "border-2 border-primary text-primary hover:bg-primary/10 focus:ring-primary",
    ghost:
      "text-text-secondary hover:bg-surface-highlight hover:text-text-primary",
    danger:
      "bg-error text-white hover:bg-error/90 shadow-lg shadow-error/30 focus:ring-error",
    gradient:
      "bg-gradient-to-r from-primary to-secondary text-white hover:brightness-110 shadow-lg",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : startIcon ? (
        <span className="mr-2">{startIcon}</span>
      ) : null}
      
      {children}

      {endIcon && <span className="ml-2">{endIcon}</span>}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    "primary",
    "secondary",
    "outline",
    "ghost",
    "danger",
    "gradient",
  ]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default Button;
