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
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "yb-btn-primary",
    secondary: "yb-btn-secondary",
    outline:
      "border border-border text-text-primary hover:bg-surface-hover hover:border-border-light",
    ghost: "yb-btn-ghost",
    danger: "bg-error text-white hover:bg-error/90",
    default: "bg-surface-secondary text-text-primary hover:bg-surface-hover",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant] || variants.primary} ${
        sizes[size]
      } ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : startIcon ? (
        <span className="flex-shrink-0">{startIcon}</span>
      ) : null}

      {children}

      {endIcon && <span className="flex-shrink-0">{endIcon}</span>}
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
    "default",
  ]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default Button;
