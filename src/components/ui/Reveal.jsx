import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function Reveal({ children, delay = 0 }) {
  const reducedMotion = useReducedMotion();
  const MotionDiv = motion.div;

  return (
    <MotionDiv
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1], delay }}
    >
      {children}
    </MotionDiv>
  );
}
