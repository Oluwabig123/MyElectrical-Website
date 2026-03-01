import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function OduzzAssistantWidget() {
  const { pathname } = useLocation();

  if (pathname === "/assistant") return null;

  return (
    <div className="oduzzAssistant" role="region" aria-label="Oduzz customer assistant">
      <Link className="oduzzAssistantToggle" to="/assistant">
        Oduzz Assistant
      </Link>
    </div>
  );
}
