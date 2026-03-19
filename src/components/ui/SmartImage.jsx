import React from "react";

export default function SmartImage({ src, alt, className = "", ...rest }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      {...rest}
    />
  );
}
