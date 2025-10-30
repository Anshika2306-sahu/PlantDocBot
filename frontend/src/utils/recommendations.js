// src/utils/recommendations.js
const RULES = [
  // --- Healthy (catch-all for healthy labels) ---
  {
    test: /(healthy)/i,
    title: "Looks Healthy",
    severity: "low",
    advice: [
      "Your plant appears healthy. Keep monitoring for any new spots or discoloration.",
      "Water at the base (avoid wetting leaves) and ensure good air circulation.",
      "Maintain a balanced fertilization routine and remove debris around the plant."
    ],
  },

  // --- Fungal diseases ---
  {
    test: /(early\s*blight|late\s*blight)/i,
    title: "Blight suspected",
    severity: "high",
    advice: [
      "Remove and discard heavily infected leaves (do not compost).",
      "Avoid overhead watering; water early so foliage dries quickly.",
      "Consider a fungicide labeled for blight (e.g., copper-based) and follow local guidance."
    ],
  },
  {
    test: /(leaf\s*mold|septoria)/i,
    title: "Leaf disease suspected",
    severity: "medium",
    advice: [
      "Prune lower leaves to improve airflow; stake or cage plants.",
      "Disinfect pruning tools; do not work plants when leaves are wet.",
      "Use a fungicide labeled for the disease if symptoms spread."
    ],
  },
  {
    test: /(powdery\s*mildew)/i,
    title: "Powdery mildew suspected",
    severity: "medium",
    advice: [
      "Increase airflow and sunlight exposure; avoid crowding plants.",
      "Remove the worst-affected leaves.",
      "Use a sulfur or potassium bicarbonate product if needed (follow label)."
    ],
  },
  {
    test: /(rust)/i,
    title: "Rust disease suspected",
    severity: "medium",
    advice: [
      "Remove infected leaves and plant debris.",
      "Improve airflow; water early and at the base.",
      "Use a labeled fungicide if symptoms progress."
    ],
  },

  // --- Pests ---
  {
    test: /(spider\s*mite|mites?)/i,
    title: "Mite damage suspected",
    severity: "medium",
    advice: [
      "Spray undersides of leaves with strong water to knock off mites.",
      "Use insecticidal soap or horticultural oil; repeat per label.",
      "Reduce plant stress; increase humidity if appropriate."
    ],
  },

  // --- Viruses ---
  {
    test: /(virus|mosaic)/i,
    title: "Viral infection suspected",
    severity: "high",
    advice: [
      "Remove and destroy infected plants to prevent spread.",
      "Control insect vectors (e.g., whiteflies, aphids).",
      "Disinfect tools; avoid handling healthy plants after infected ones."
    ],
  },
];

export function getRecommendation(label = "", probability = 0) {
  // Default if nothing matched
  let rec = {
    title: "Recommendation",
    severity: "medium",
    advice: [
      "Your plant seems affected. Consider proper diagnosis and treatment.",
      "If symptoms worsen, consult a local agricultural expert."
    ],
  };

  // If clearly healthy by label or very low confidence
  if (/(healthy)/i.test(label) || probability < 0.35) {
    return {
      title: "Looks Healthy",
      severity: "low",
      advice: [
        "Your plant appears healthy. Keep monitoring for any new spots or discoloration.",
        "Water at the base and maintain good airflow.",
      ],
    };
  }

  const match = RULES.find(r => r.test.test(label));
  return match ?? rec;
}
