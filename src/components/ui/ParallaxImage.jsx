import React from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import SmartImage from "./SmartImage";

export default function ParallaxImage({ src, alt, height = 360, intensity = 60 }) {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [-intensity, intensity]);
  const MotionDiv = motion.div;

  return (
    <div className="media" style={{ height }} aria-label={alt}>
      <MotionDiv
        style={{
          y: reduced ? 0 : y,
          width: "100%",
          height: "110%",
          position: "absolute",
          inset: 0,
          willChange: "transform",
          transform: "translateZ(0)",
        }}
        aria-hidden="true"
      >
        <SmartImage
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            inset: 0,
          }}
        />
      </MotionDiv>

      <div className="mediaOverlay" />
      <div className="mediaNoise" />
    </div>
  );
}
