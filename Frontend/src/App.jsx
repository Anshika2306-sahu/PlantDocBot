import React, { useEffect, useState } from "react";

/* ======================
   Inline SVG Icon components
   (kept lightweight)
   ====================== */
const IconProps = {
  stroke: "currentColor",
  fill: "none",
  strokeWidth: 2,
  viewBox: "0 0 24 24",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const Leaf = ({ className }) => (
  <svg {...IconProps} className={className}><path d="M11 20A7 7 0 0 1 7 6a7 7 0 0 1 4-4 7 7 0 0 1 4 4 7 7 0 0 1-4 14z"/><path d="M9 9c-2 1-4 4-3 7"/></svg>
);
const Check = ({ className }) => (
  <svg {...IconProps} className={className}><path d="M20 6L9 17l-5-5"/></svg>
);
const Alert = ({ className }) => (
  <svg {...IconProps} className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const Activity = ({ className }) => (
  <svg {...IconProps} className={className}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);

/* ======================
   Config / Endpoints
   ====================== */
const API_BASE = "http://127.0.0.1:8000";
const IMAGE_ENDPOINT = `${API_BASE}/predict`;
const TEXT_ENDPOINT = `${API_BASE}/predict_text`;

/* ======================
   Demo disease DB (expandable)
   ====================== */
const diseaseDatabase = {
  pepper_bacterial_spot: {
    display: "Pepper — Bacterial spot",
    recommendations: [
      { text: "Remove and destroy infected tissue.", tone: "high" },
      { text: "Apply copper-based bactericides every 7–10 days.", tone: "medium" },
      { text: "Avoid overhead watering; use drip irrigation.", tone: "low" },
    ],
    stats: { occurrence: 34, severity: 8.2, recovery: 65, region: "High" },
    color: "bg-red-500",
  },
  tomato_early_blight: {
    display: "Tomato — Early blight",
    recommendations: [
      { text: "Remove infected lower leaves and debris.", tone: "medium" },
      { text: "Apply appropriate fungicide at first signs.", tone: "high" },
      { text: "Practice crop rotation and mulch.", tone: "low" },
    ],
    stats: { occurrence: 42, severity: 6.8, recovery: 75, region: "Moderate" },
    color: "bg-orange-500",
  },
  potato_late_blight: {
    display: "Potato — Late blight",
    recommendations: [
      { text: "Use certified disease-free seed potatoes.", tone: "high" },
      { text: "Destroy infected plants immediately.", tone: "high" },
    ],
    stats: { occurrence: 28, severity: 9.1, recovery: 45, region: "High" },
    color: "bg-red-600",
  },
  "corn_(maize)___common_rust": {
    display: "Corn — Common rust",
    recommendations: [
      { text: "Remove infected debris after harvest.", tone: "medium" },
      { text: "Plant resistant varieties where available.", tone: "low" },
    ],
    stats: { occurrence: 60, severity: 5.5, recovery: 80, region: "Moderate" },
    color: "bg-yellow-500",
  },
};

/* ======================
   Small reusable UI pieces
   ====================== */
function StatBar({ label, value, max = 100 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-300 mb-1">
        <span>{label}</span>
        <span className="font-semibold text-white">{value}{max !== 100 ? ` / ${max}` : "%"}</span>
      </div>
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-400 to-green-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ======================
   Charts (SVG, no external libs)
   - Mini Bar Chart (top N)
   - Donut Chart (distribution)
   ====================== */
function MiniBarChart({ data = [] }) {
  // data: [{label, value}]
  const max = Math.max(...data.map(d => d.value), 1);
  const barWidth = 18;
  const gap = 10;
  const width = data.length * (barWidth + gap);
  const height = 80;

  return (
    <svg width={Math.max(200, width)} height={height}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 20);
        const x = i * (barWidth + gap);
        const y = height - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={h} rx="3" fill="#34d399" opacity="0.9" />
            <text x={x + barWidth / 2} y={height - 2} fontSize="10" textAnchor="middle" fill="#cbd5e1">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ data = [], size = 90, strokeWidth = 18 }) {
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
          const stroke = d.color || ["#34d399", "#60a5fa", "#f59e0b", "#f87171"][i % 4];
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
        <text x="0" y="5" textAnchor="middle" fontSize="13" fill="#cbd5e1">Recent</text>
      </g>
    </svg>
  );
}

/* ======================
   Main Component
   ====================== */
export default function App() {
  const [mode, setMode] = useState("image"); // image or text
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [prediction, setPrediction] = useState(null); // {class, confidence, diseaseKey}
  const [history, setHistory] = useState([]);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("plantdoc_history_v2");
    if (saved) setHistory(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem("plantdoc_history_v2", JSON.stringify(history.slice(0, 50)));
  }, [history]);

  // Handlers
  const handleImageChange = (e) => {
    setApiError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setApiError("Please upload a valid image file (PNG/JPG).");
      return;
    }
    setImageFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(f);
    setPrediction(null);
  };

  const handleImagePredict = async () => {
    if (!imageFile) { setApiError("Choose an image first."); return; }
    setApiError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image_file", imageFile);
      const resp = await fetch(IMAGE_ENDPOINT, { method: "POST", body: fd });
      if (!resp.ok) {
        let detail = resp.statusText;
        try { const j = await resp.json(); detail = j.detail || JSON.stringify(j); } catch {}
        throw new Error(detail);
      }
      const data = await resp.json();
      // data: { class: displayName, confidence: pctNumber, diseaseKey }
      const item = {
        source: "image",
        class: data.class || "Unknown",
        confidence: Number(data.confidence || 0),
        diseaseKey: data.diseaseKey || sanitizeKey(data.class || data.disease || "unknown"),
        time: new Date().toISOString(),
        raw: data,
      };
      setPrediction(item);
      setHistory(prev => [item, ...prev].slice(0, 50));
    } catch (err) {
      console.error(err);
      setApiError("Prediction failed: " + (err.message || "Server error"));
    } finally { setLoading(false); }
  };

  const handleTextPredict = async () => {
    if (!textInput.trim()) { setApiError("Please describe the symptoms."); return; }
    setApiError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("symptoms", textInput);
      const resp = await fetch(TEXT_ENDPOINT, { method: "POST", body: fd });
      if (!resp.ok) {
        let detail = resp.statusText;
        try { const j = await resp.json(); detail = j.detail || JSON.stringify(j); } catch {}
        throw new Error(detail);
      }
      const data = await resp.json();
      const item = {
        source: "text",
        class: data.class || "Unknown",
        confidence: Number(data.confidence || 0),
        diseaseKey: data.diseaseKey || sanitizeKey(data.class || "unknown"),
        time: new Date().toISOString(),
        raw: data,
      };
      setPrediction(item);
      setHistory(prev => [item, ...prev].slice(0, 50));
    } catch (err) {
      console.error(err);
      setApiError("Text prediction failed: " + (err.message || "Server error"));
    } finally { setLoading(false); }
  };

  const sanitizeKey = (s) => String(s || "").toLowerCase().replace(/___/g, "_").replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "_");

  const clearAll = () => {
    setImageFile(null); setImagePreview(null); setPrediction(null); setTextInput(""); setApiError(null);
  };

  // Statistics derived from history
  const totalPredictions = history.length;
  const counts = history.reduce((acc, h) => {
    const k = h.diseaseKey || sanitizeKey(h.class || "unknown");
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const topDiseases = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => ({ label: k.split("_").slice(0,3).join(" "), value: v }));
  const avgConfidence = history.length ? (history.reduce((s, h) => s + (h.confidence||0), 0) / history.length) : 0;
  const donutData = Object.entries(counts).slice(0, 4).map(([k, v], i) => ({ label: k, value: v, color: ["#34d399", "#60a5fa", "#f59e0b", "#f87171"][i % 4] }));

  // Pretty display for prediction result
  const displayInfo = prediction ? (diseaseDatabase[prediction.diseaseKey] || diseaseDatabase[sanitizeKey(prediction.class)] || null) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">PlantDoc — AI Plant Disease Classifier</h1>
              <p className="text-xs text-gray-400">Image & text modes • Backend: <span className="font-mono">127.0.0.1:8000</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-300 mr-2">Mode</div>
            <div className="inline-flex rounded-xl bg-slate-800/40 p-1 ring-1 ring-slate-700">
              <button onClick={() => setMode("image")} className={`px-4 py-2 rounded-lg ${mode === "image" ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow" : "text-gray-300"}`}>Image</button>
              <button onClick={() => setMode("text")} className={`px-4 py-2 rounded-lg ${mode === "text" ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow" : "text-gray-300"}`}>Text</button>
            </div>
          </div>
        </header>

        <main className="grid lg:grid-cols-3 gap-6">
          {/* Left/center (forms + result) */}
          <section className="lg:col-span-2 space-y-6">
            {/* Image / Text box */}
            <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50">
              <div className="flex gap-6">
                {/* large preview area */}
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-3">Image Analysis</h2>
                  <div className="rounded-xl overflow-hidden border-2 border-dashed border-slate-700 bg-slate-900/40 h-64 flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="preview" className="object-cover w-full h-full" />
                    ) : (
                      <div className="text-center text-gray-400 p-6">
                        <Activity className="w-16 h-16 mx-auto mb-2 opacity-60" />
                        <div>Upload plant image (PNG, JPG)</div>
                        <div className="text-xs text-gray-500 mt-1">Try to crop close to the diseased leaf for best results</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      <div className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">Choose image</div>
                    </label>

                    <button onClick={handleImagePredict} disabled={!imageFile || loading} className="px-4 py-2 rounded-lg bg-blue-600 disabled:bg-slate-600 text-white font-bold">
                      {loading && prediction?.source === "image" ? "Analyzing..." : "Get Prediction"}
                    </button>

                    <button onClick={clearAll} className="px-3 py-2 rounded-lg bg-slate-700 text-gray-300">Clear</button>
                  </div>

                  {apiError && <div className="mt-3 text-sm text-red-400 bg-red-500/10 p-3 rounded-md flex items-center gap-2"><Alert className="w-4 h-4" />{apiError}</div>}
                </div>

                {/* Recommendations + statistics (right inside this card) */}
                <div className="w-80 pl-3">
                  <h3 className="text-sm text-gray-300 mb-2">Recommendations</h3>

                  {/* If we have a recent prediction, show tailored recommendations */}
                  {displayInfo ? (
                    <div className="space-y-3">
                      {displayInfo.recommendations.map((r, i) => (
                        <div key={i} className="bg-slate-900/30 p-3 rounded-lg flex items-start gap-3">
                          <div className={`p-2 rounded-md ${r.tone === "high" ? "bg-red-600/20" : r.tone === "medium" ? "bg-yellow-500/10" : "bg-emerald-500/10"}`}>
                            <Check className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-sm text-gray-200">{r.text}</div>
                        </div>
                      ))}
                      <div className="mt-2 text-xs text-gray-400">Tailored suggestions based on the detected disease.</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-300 mb-2">General suggestions</div>
                      <div className="text-sm text-gray-200">• Keep leaves dry and avoid overhead watering.</div>
                      <div className="text-sm text-gray-200">• Improve air circulation and remove infected material.</div>
                      <div className="text-sm text-gray-200">• Use recommended fungicides/bactericides when necessary.</div>
                    </div>
                  )}

                  {/* Compact Stats */}
                  <div className="mt-5">
                    <div className="text-sm text-gray-300 mb-3">Quick Statistics</div>
                    <div className="p-3 bg-slate-900/30 rounded-lg space-y-3">
                      <div className="text-sm text-gray-300">Total analyses</div>
                      <div className="text-2xl font-bold">{totalPredictions}</div>
                      <div className="text-sm text-gray-400">Average confidence</div>
                      <div className="text-lg font-semibold">{Math.round(avgConfidence)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text mode */}
            {mode === "text" && (
              <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50">
                <h2 className="text-lg font-bold mb-3">Text Symptom Analysis</h2>
                <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Symptoms: yellowing, brown spots, wilting..." className="w-full h-36 p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 text-white placeholder-gray-500" />
                <div className="mt-3 flex gap-3">
                  <button onClick={handleTextPredict} disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold">{loading && prediction?.source === "text" ? "Analyzing..." : "Analyze Symptoms"}</button>
                  <button onClick={() => { setTextInput(""); setPrediction(null); setApiError(null); }} className="px-3 py-2 rounded-lg bg-slate-700 text-gray-300">Clear</button>
                </div>
              </div>
            )}

            {/* Result Card */}
            {prediction && (
              <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="text-sm text-gray-300">Detected</div>
                    <h3 className="text-2xl font-bold">{prediction.class}</h3>
                    <div className="text-xs text-gray-400 mt-1">Source: <span className="font-mono">{prediction.source}</span></div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-300">Confidence</div>
                    <div className="text-4xl font-bold">{Math.round(prediction.confidence)}%</div>
                    <div className="mt-2 text-xs text-gray-400">Measured confidence from model</div>
                  </div>
                </div>

                {/* Visual gauge bar */}
                <div className="mt-6">
                  <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500" style={{ width: `${Math.max(2, Math.min(100, prediction.confidence))}%` }} />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex gap-3">
                  <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(prediction.raw || prediction, null, 2))} className="px-3 py-2 bg-slate-700 rounded text-sm">Copy result</button>
                  <button onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(prediction.class)}`, "_blank")} className="px-3 py-2 bg-emerald-500 rounded text-sm">Search more</button>
                  <button onClick={() => { /* placeholder for save/export */ }} className="px-3 py-2 bg-blue-600 rounded text-sm">Save</button>
                </div>

                {/* If we have curated card for disease show key stats */}
                {displayInfo ? (
                  <div className="mt-6 grid md:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-900/30 rounded">
                      <div className="text-xs text-gray-400">Severity</div>
                      <div className="text-lg font-bold">{displayInfo.stats.severity}/10</div>
                      <StatBar label="Severity" value={displayInfo.stats.severity} max={displayInfo.stats.severity.max || 10} />
                    </div>
                    <div className="p-3 bg-slate-900/30 rounded">
                      <div className="text-xs text-gray-400">Recovery rate</div>
                      <div className="text-lg font-bold">{displayInfo.stats.recovery}%</div>
                      <StatBar label="Recovery" value={displayInfo.stats.recovery} max={100} />
                    </div>
                    <div className="p-3 bg-slate-900/30 rounded">
                      <div className="text-xs text-gray-400">Occurrence</div>
                      <div className="text-lg font-bold">{displayInfo.stats.occurrence}%</div>
                      <StatBar label="Occurrence" value={displayInfo.stats.occurrence} max={100} />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-xs text-gray-400">No curated statistics for this class. Add it to the internal DB to show tailored stats.</div>
                )}

                <div className="mt-4 text-xs text-gray-400">Raw server response:</div>
                <pre className="mt-2 p-3 bg-slate-900/30 rounded text-xs overflow-auto">{JSON.stringify(prediction.raw || {}, null, 2)}</pre>
              </div>
            )}
          </section>

          {/* Right column: overall stats + history */}
          <aside className="space-y-6">
            <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-300">Server Health</div>
                  <div className="text-xs text-gray-400">Local FastAPI • Ensure uvicorn main:app</div>
                </div>
                <div className="text-xs text-gray-400">Online</div>
              </div>
            </div>

            <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm text-gray-300">Analytics</div>
                <div className="text-xs text-gray-400">Last {Math.min(50, history.length)} results</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-300">Total</div>
                  <div className="font-semibold">{totalPredictions}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-300">Top confidence</div>
                  <div className="font-semibold">{history.length ? `${Math.round(Math.max(...history.map(h => h.confidence || 0)))}%` : "—"}</div>
                </div>

                <div className="mt-2">
                  <MiniBarChart data={topDiseases.length ? topDiseases : [{label: "none", value: 1}]} />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <DonutChart data={donutData.length ? donutData : [{label: "none", value: 1, color: "#34d399"}]} size={80} strokeWidth={14} />
                  <div className="text-xs text-gray-300">
                    <div className="font-semibold">{history.length ? `${Math.round(avgConfidence)}%` : "—"}</div>
                    <div className="text-gray-400">Avg confidence</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-300">Recent Predictions</div>
                <div className="text-xs text-gray-400"> ({history.length})</div>
              </div>

              <div className="max-h-56 overflow-auto space-y-2">
                {history.length === 0 && <div className="text-xs text-gray-500">No predictions yet</div>}
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-slate-900/30 p-2 rounded-md">
                    <div>
                      <div className="font-medium">{h.class}</div>
                      <div className="text-gray-400">{new Date(h.time).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{Math.round(h.confidence)}%</div>
                      <div className="text-gray-400">{h.source}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <button onClick={() => { setHistory([]); localStorage.removeItem("plantdoc_history_v2"); }} className="text-xs px-2 py-1 bg-slate-700 rounded">Clear</button>
                <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(history.slice(0, 10), null, 2))} className="text-xs px-2 py-1 bg-slate-700 rounded">Copy (top 10)</button>
              </div>
            </div>

            <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50 text-xs text-gray-400">
              This demo uses local prediction history to show compact statistics. Add curated classes to the internal DB for richer results.
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
