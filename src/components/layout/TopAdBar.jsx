import React from "react";
import { Link } from "react-router-dom";
import Container from "./Container.jsx";

const adItems = [
  {
    to: "/quote",
    text: "Fast site visits in Ikorodu and Lagos mainland. Request a quote and get scoped properly.",
  },
  {
    to: "/assistant",
    text: "Ask Oduzz AI to narrow your service type before booking wiring, solar, CCTV, or lighting work.",
  },
  {
    to: "/projects",
    text: "Review recent installations before you commit, from panel cleanup to chandelier finishing.",
  },
  {
    to: "/products",
    text: "Need electrical materials too? Check available products while planning your project.",
  },
];

export default function TopAdBar() {
  return (
    <div className="topAdBar" aria-label="Promotions and announcements">
      <Container className="topAdBarInner">
        <div className="topAdBarViewport">
          <div className="topAdBarTrack">
            {[...adItems, ...adItems].map((item, index) => (
              <Link key={`${item.to}-${index}`} to={item.to} className="topAdBarLink">
                <span className="topAdBarLabel">Notice</span>
                <span className="topAdBarText">{item.text}</span>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
