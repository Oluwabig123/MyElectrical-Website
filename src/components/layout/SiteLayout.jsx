import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import TopAdBar from "./TopAdBar.jsx";
import Footer from "./Footer.jsx";
import FloatingContactCTA from "./FloatingContactCTA.jsx";
import OduzzAssistantWidget from "./OduzzAssistantWidget.jsx";
import ScrollToTop from "./ScrollToTop.jsx";

export default function SiteLayout() {
  return (
    <>
      <ScrollToTop />
      <a className="skip" href="#content">Skip to content</a>
      <TopAdBar />
      <Navbar />
      <main id="content">
        <Outlet />
      </main>
      <Footer />
      <FloatingContactCTA />
      <OduzzAssistantWidget />
    </>
  );
}
