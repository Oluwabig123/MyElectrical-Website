import React from "react";

export default function SectionHeader({ kicker, title, subtitle }) {
  return (
    <div className="sectionHeader">
      {kicker ? <div className="kicker">{kicker}</div> : null}
      <h2 className="h2">{title}</h2>
      {subtitle ? <p className="p">{subtitle}</p> : null}
    </div>
  );
}
