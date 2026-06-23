import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { HiOutlineArrowUp } from "react-icons/hi2";

export default function Layout({ children }) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="app-shell">
      <Navbar />

      <main className="app-main">
        {children}
      </main>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="scroll-top-button"
          aria-label="Back to top"
        >
          <HiOutlineArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
