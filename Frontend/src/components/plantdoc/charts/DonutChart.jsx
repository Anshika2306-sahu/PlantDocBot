import React from "react";

export default function DonutChart({ data = [], size = 90, strokeWidth = 18 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size / 2},${size / 2})`}>
        <circle r={radius} fill="transparent" stroke="#0b1220" strokeWidth={strokeWidth} />
        {data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const stroke =
            d.color || ["#34d399", "#60a5fa", "#f59e0b", "#f87171"][i % 4];
          const res = (
            <circle
              key={i}
              r={radius}
              fill="transparent"
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90)"
              strokeLinecap="round"
            />
          );
          offset += dash;
          return res;
        })}
        <text
          x="0"
          y="5"
          textAnchor="middle"
          fontSize="13"
          fill="#cbd5e1"
        >
          Recent
        </text>
      </g>
    </svg>
  );
}
