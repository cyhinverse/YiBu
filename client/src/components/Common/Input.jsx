import React, { forwardRef } from "react";
import PropTypes from "prop-types";

const Input = forwardRef(
  ({ label, error, icon, className = "", type = "text", ...props }, ref) => {
    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-1.5 ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={`
              w-full
              bg-surface-highlight
              text-text-primary
              border transition-all duration-200
              rounded-xl
              focus:ring-2 focus:ring-primary/50 focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              placeholder:text-text-secondary/50
              ${icon ? "pl-10 pr-4" : "px-4"}
              ${error ? "border-error focus:ring-error/50" : "border-transparent"}
              py-2.5
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-error ml-1 animate-fadeIn">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  icon: PropTypes.node,
  className: PropTypes.string,
  type: PropTypes.string,
};

export default Input;
