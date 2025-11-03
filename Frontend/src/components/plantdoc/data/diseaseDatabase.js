// src/components/plantdoc/data/diseaseDatabase.js
export const diseaseDatabase = {
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
