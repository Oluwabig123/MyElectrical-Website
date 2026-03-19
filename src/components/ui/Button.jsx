import React from "react";

export default function Button({ variant = "primary", children, className = "", ...rest }) {
  return (
    <button className={`btn ${variant} ${className}`} {...rest}>
      {children}
    </button>
  );
}
