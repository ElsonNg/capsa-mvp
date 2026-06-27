"use client";

import { useEffect, useState } from "react";

const SCROLL_THRESHOLD = 520;

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > SCROLL_THRESHOLD);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <button
      type="button"
      aria-label="Scroll back to top"
      onClick={scrollToTop}
      className={`fixed bottom-5 right-5 z-50 grid h-12 w-12 place-items-center rounded-full border border-[#e2bfb0] bg-white/92 text-[#a04100] shadow-[0_10px_30px_rgba(15,23,42,0.14)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-[#ff6a00] hover:bg-[#fff8f4] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[rgba(255,106,0,0.28)] sm:bottom-7 sm:right-7 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 19V5M6.5 10.5 12 5l5.5 5.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
      </svg>
    </button>
  );
}
