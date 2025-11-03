import React from "react";

const Leaf = ({ className }) => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth={2}
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M11 20A7 7 0 0 1 7 6a7 7 0 0 1 4-4 7 7 0 0 1 4 4 7 7 0 0 1-4 14z" />
    <path d="M9 9c-2 1-4 4-3 7" />
  </svg>
);
export default Leaf;
