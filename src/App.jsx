import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import SiteLayout from "./components/layout/SiteLayout.jsx";

import Home from "./pages/Home.jsx";

const Services = lazy(() => import("./pages/Services.jsx"));
const Blog = lazy(() => import("./pages/Blog.jsx"));
const BlogArticle = lazy(() => import("./pages/BlogArticle.jsx"));
const Academy = lazy(() => import("./pages/Academy.jsx"));
const Products = lazy(() => import("./pages/Products.jsx"));
const Projects = lazy(() => import("./pages/Projects.jsx"));
const Quote = lazy(() => import("./pages/Quote.jsx"));
const Assistant = lazy(() => import("./pages/Assistant.jsx"));
const MemoryGame = lazy(() => import("./pages/MemoryGame.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

function RouteFallback() {
  return (
    <div className="routeFallback" role="status" aria-live="polite">
      <div className="container">
        <div className="routeFallbackCard">Loading page...</div>
      </div>
    </div>
  );
}

function DeferredPage({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="/services" element={<DeferredPage><Services /></DeferredPage>} />
        <Route path="/blog" element={<DeferredPage><Blog /></DeferredPage>} />
        <Route path="/blog/:slug" element={<DeferredPage><BlogArticle /></DeferredPage>} />
        <Route path="/academy" element={<DeferredPage><Academy /></DeferredPage>} />
        <Route path="/products" element={<DeferredPage><Products /></DeferredPage>} />
        <Route path="/projects" element={<DeferredPage><Projects /></DeferredPage>} />
        <Route path="/quote" element={<DeferredPage><Quote /></DeferredPage>} />
        <Route path="/assistant" element={<DeferredPage><Assistant /></DeferredPage>} />
        <Route path="/test-your-memory" element={<DeferredPage><MemoryGame /></DeferredPage>} />
        <Route path="/about" element={<DeferredPage><About /></DeferredPage>} />
        <Route path="/contact" element={<DeferredPage><Contact /></DeferredPage>} />
        <Route path="*" element={<DeferredPage><NotFound /></DeferredPage>} />
      </Route>
    </Routes>
  );
}
