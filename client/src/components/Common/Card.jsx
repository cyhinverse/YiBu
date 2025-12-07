import React from "react";
import PropTypes from "prop-types";

const Card = ({ children, className = "", hover = false, ...props }) => {
  return (
    <div
      className={`
        bg-card
        rounded-2xl
        p-6
        ${hover ? "hover:shadow-md hover:border-primary/20 transition-all duration-300" : ""}
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
};

export default Card;
