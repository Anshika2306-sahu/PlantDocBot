import React from "react";

export default function MiniBarChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 italic text-sm text-center">No data available</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 25;
  const gap = 15;
  const chartHeight = 120;
  const width = data.length * (barWidth + gap) + gap;

  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(250, width)} height={chartHeight}>
        {data.map((d, i) => {
          const barHeight = (d.value / max) * (chartHeight - 40);
          const x = i * (barWidth + gap) + gap;
          const y = chartHeight - barHeight - 20;

          return (
            <g key={i}>
              {/* Green Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill="#34d399"
                className="hover:opacity-80 transition duration-200"
              />

              {/* Value above bar */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                fontSize="11"
                textAnchor="middle"
                fill="#111827"
                fontWeight="bold"
              >
                {d.value}
              </text>

              {/* Label below bar */}
              <text
                x={x + barWidth / 2}
                y={chartHeight - 5}
                fontSize="10"
                textAnchor="middle"
                fill="#374151"
              >
                {d.label.length > 8 ? d.label.slice(0, 7) + "…" : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
