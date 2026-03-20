import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function OduzzAssistantWidget() {
  const { pathname } = useLocation();

  if (pathname === "/assistant" || pathname === "/test-your-memory") return null;

  return (
    <div className="oduzzAssistant" role="region" aria-label="Oduzz customer assistant">
      <Link className="oduzzAssistantToggle" to="/assistant" aria-label="Open Oduzz Assistant">
        <span className="oduzzAssistantToggleBadge" aria-hidden="true">
          AI
        </span>
        <span className="oduzzAssistantToggleText">
          <strong>Oduzz Assistant</strong>
          <span>Solar, lighting, wiring, quotes</span>
        </span>
      </Link>
    </div>
  );
}
