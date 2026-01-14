import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const Input = forwardRef(
  (
    {
      label,
      error,
      icon,
      className = '',
      type = 'text',
      variant = 'default',
      ...props
    },
    ref
  ) => {
    const variants = {
      default: `
        bg-surface-highlight/50
        focus:bg-surface-highlight focus:ring-1 focus:ring-primary/20
        rounded-[4px]
      `,
      search: `
        bg-surface-highlight
        focus:bg-surface focus:ring-1 focus:ring-primary/20
        rounded-full
      `,
      outline: `
        bg-surface-highlight/30
        focus:bg-surface-highlight focus:ring-1 focus:ring-primary/20
        rounded-[4px]
      `,
    };

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-[13px] font-medium text-text-secondary mb-1">
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
              text-text-primary
              transition-all duration-200
              focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              placeholder:text-text-secondary
              ${icon ? 'pl-10 pr-4' : 'px-4'}
              ${
                error
                  ? 'border-error focus:border-error focus:ring-error/20'
                  : ''
              }
              py-3
              text-[15px]
              ${variants[variant] || variants.default}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-[13px] text-error animate-fadeIn">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  icon: PropTypes.node,
  className: PropTypes.string,
  type: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'search', 'outline']),
};

export default Input;
