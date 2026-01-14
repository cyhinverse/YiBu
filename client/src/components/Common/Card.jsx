import React from 'react';
import PropTypes from 'prop-types';

const Card = ({
  children,
  className = '',
  hover = false,
  noBorder = true,
  ...props
}) => {
  return (
    <div
      className={`
        bg-surface
        ${noBorder ? '' : 'border border-border'}
        rounded-2xl
        ${
          hover
            ? 'hover:bg-surface-hover transition-colors duration-200 cursor-pointer'
            : ''
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  hover: PropTypes.bool,
  noBorder: PropTypes.bool,
};

export default Card;
