import React from "react";
import { Link } from "react-router-dom";

export default function OduzzAssistantWidget() {
  return (
    <div className="oduzzAssistant" role="region" aria-label="Oduzz customer assistant">
      <Link className="oduzzAssistantToggle" to="/assistant">
        Oduzz Assistant
      </Link>
    </div>
  );
}
