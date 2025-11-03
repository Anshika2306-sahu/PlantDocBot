import React from "react";
import logo from "../../../assets/logo.png";

export default function Header({ mode, setMode }) {
  return (
    <header className="flex justify-between items-center mb-6">
      
      <div className="flex items-center gap-2">
        <img
          src={logo}
          alt="PlantDoc Logo"
          className="ml-2 w-8 h-8 object-contain"
        />
        <span className="text-2xl font-bold bg-gradient-to-r from-green-500 to-purple-500 bg-clip-text text-transparent">
          Plantify
        </span>
      </div>

      <div className="flex gap-3">
        <button
          className={`px-4 py-1 rounded-lg font-medium ${
            mode === "image"
              ? "bg-green-700 text-white"
              : "bg-white text-gray-700"
          }`}
          onClick={() => setMode("image")}
        >
          Image Mode
        </button>
        <button
          className={`px-4 py-1 rounded-lg font-medium ${
            mode === "text"
              ? "bg-green-700 text-white"
              : "bg-white text-gray-700"
          }`}
          onClick={() => setMode("text")}
        >
          Text Mode
        </button>
      </div>

    </header>
  );
}
