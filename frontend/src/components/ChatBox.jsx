import React, { useState } from 'react';

// Utility function to make the API call with exponential backoff
const callGeminiApi = async (userPrompt, systemInstruction, responseSchema, tools) => {
    const apiKey = ""; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    };

    if (tools) {
        payload.tools = tools;
    }

    const MAX_RETRIES = 5;
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                // If it's a 429 (rate limit), we retry
                if (response.status === 429 && i < MAX_RETRIES - 1) {
                    const delay = Math.pow(2, i) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue; // Retry loop
                }
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API call failed with status ${response.status}`);
            }

            const result = await response.json();
            const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!jsonText) {
                throw new Error("Received an empty response from the model.");
            }
            return JSON.parse(jsonText);

        } catch (error) {
            if (i === MAX_RETRIES - 1) {
                throw error; // Re-throw if last retry failed
            }
            // Retrying, no console error needed
        }
    }
};

const ChatBox = () => {
    const [symptoms, setSymptoms] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 1. Integrated the Remediation Map from the Canvas file
    const REMEDIATION_MAP = {
      "Apple___Healthy": "Monitor for early signs of fungal issues; maintain balanced fertilization and perform winter pruning.",
      "Tomato___Early_blight": "Implement a 3-year crop rotation, stake plants to improve airflow, and apply protective fungicides (e.g., chlorothalonil) as needed.",
      "Potato___Late_blight": "Immediately remove and destroy infected foliage and tubers. Apply systemic fungicides and ensure proper hilling to cover tubers.",
      "Pepper_bell___Bacterial_spot": "Use copper-based bactericides at the start of the season. Avoid all overhead watering to reduce bacterial splash and spread.",
      "Apple___Black_rot": "Prune out dead wood and cankers during dormancy. Apply fungicides (e.g., captan) from the pink bud stage through early cover sprays.",
      "Apple___Cedar_apple_rust": "Apply fungicides (e.g., myclobutanil) beginning at the pink bud stage. If possible, remove nearby juniper hosts to break the disease cycle.",
      "Rice___Blast": "Use resistant cultivars when planting. Optimize nitrogen fertilizer use (avoid excess). Apply strobilurin fungicides if the disease is severe.",
      "Rice___Brown_Spot": "Use certified clean seeds and manage field water levels to avoid stress. Apply appropriate foliar fungicides upon detection.",
      "Tomato___Septoria_leaf_spot": "Remove the oldest, lowest infected leaves immediately. Mulch heavily to prevent soil splash and apply a protective fungicide.",
      "Tomato___Leaf_Mold": "In greenhouse settings, improve ventilation to reduce humidity. In fields, use resistant varieties and protective fungicides.",
      "Wheat___Healthy": "Maintain standard farming practices. Monitor soil pH and nutrient levels regularly to ensure optimal growth conditions.",
      "Wheat___Leaf_Rust": "Plant rust-resistant varieties for the next season. Apply labeled fungicides (e.g., triazole) early upon the first sign of symptoms.",
      "Cassava___Mosaic": "Use only certified virus-free planting material (cuttings). Uproot and destroy all infected plants immediately upon sight.",
      "Cassava___Brown_Streak": "Use clean propagation material. Plant in cooler, higher elevations where the disease vector is less active.",
      "Almond___Scab": "Apply fungicides (e.g., azoxystrobin) at petal fall and first cover spray. Prune trees to encourage better air circulation.",
      "Almond___Leaf_Blight": "Apply copper fungicides during the dormant season and early spring. Improve overall irrigation management to reduce stress.",
      "Sugarcane___Red_Rot": "Plant resistant cane varieties to prevent infection. Destroy affected stubble and setts immediately after harvest.",
      "Potato___Early_blight": "Implement crop rotation and deep mulch. Apply protective fungicides before symptoms become widespread or when weather favors disease.",
      "Potato___Healthy": "Maintain consistent soil moisture, fertilize according to soil test recommendations, and scout regularly for emerging pests or diseases.",
      "Pepper_bell___Healthy": "Ensure good soil health, consistent moisture, and appropriate sun exposure (6-8 hours daily).",
      "Corn___Common_rust": "Select and plant resistant hybrids for future seasons. Fungicides are an option for high-value crops if the infection is detected early.",
      "Corn___Gray_leaf_spot": "Rotate corn with non-host crops (like soybeans). Use minimum tillage to help decompose infected residue quickly.",
      "Corn___Northern_Leaf_Blight": "Plant resistant hybrids (those rated 'R' or 'MR'). Consider fungicide application if conditions favor rapid disease spread.",
      "Sugarcane___Grassy_Shoot": "Use hot-water treated setts for planting. Remove and destroy infected clumps as they appear in the field.",
      "Tea___Red_Rust": "Improve bush health with proper nutrition, especially potassium. Apply copper oxychloride in cases of severe infestation.",
      "Grape___Esca_(Black_Measles)": "Prune late in the dormant season. Apply protective paste or fungicide to fresh pruning wounds to prevent spore entry.",
      "Grape___Black_rot": "Remove and destroy all mummified berries from the vineyard floor and vines. Apply fungicides (e.g., mancozeb) starting at bud break.",
      "Grape___Isariopsis_Leaf_Spot_(Sooty_Mold)": "Improve canopy airflow via strategic pruning to reduce humidity. Apply fungicides as warranted by weather conditions.",
      "Tea___Algal_Leaf_Spot": "Improve drainage and soil aeration in the tea garden. Remove and destroy severely affected branches and leaves.",
      "Pomegranate___Bacterial_Blight": "Prune out all infected branches during the dry season. Apply copper-based fungicides at bud break and early fruit set.",
      "Cherry___Powdery_mildew": "Apply wettable sulfur or biological fungicides (e.g., bacillus subtilis). Prune to open the canopy and improve sunlight penetration.",
      "Cherry___Healthy": "Maintain consistent watering and fertilization. Protect developing buds and flowers from late-spring frost events.",
      "Cherry___Shot_hole": "Rake and destroy fallen leaves in the fall. Apply copper sprays post-harvest and again at leaf drop.",
      "Peach___Bacterial_spot": "Use highly resistant cultivars. Apply copper sprays during the dormant season and early spring to manage inoculum.",
      "Peach___Healthy": "Maintain proper pruning and strategic fruit thinning to ensure good air circulation and quality fruit development.",
      "Peach___Leaf_curl": "Apply a dormant-season fungicide (e.g., chlorothalonil or copper) thoroughly before the buds begin to swell in late winter.",
      "Strawberry___Leaf_scorch": "Use resistant varieties in future plantings. Apply fungicides (e.g., azoxystrobin) if the disease is confirmed early.",
      "Strawberry___Healthy": "Ensure raised beds for excellent drainage. Use drip irrigation to keep foliage dry and reduce the risk of disease.",
      "Strawberry___Angular_leaf_spot": "Use certified disease-free plants. Avoid overhead irrigation and apply copper if the infection is confirmed.",
      "Soybean___Healthy": "Monitor for minor nutrient deficiencies and maintain excellent weed control to limit competition and stress.",
      "Soybean___Bacterial_blight": "Plant resistant varieties and always use certified, clean seed. Implement a strong crop rotation program.",
      "Squash___Powdery_mildew": "Apply horticultural oils or sulfur fungicides upon sighting. Select resistant squash varieties for future planting.",
      "Squash___Gummy_stem_blight": "Practice crop rotation with non-cucurbit crops. Apply protective fungicides on a weekly schedule during the growing season.",
      "Squash___Healthy": "Water deeply at the base of the plant to keep leaves dry. Provide a trellis or staking for optimal air circulation.",
      "Pomegranate___Healthy": "Prune root suckers regularly. Ensure consistent, deep watering during dry periods, especially as fruit develops.",
      "Raspberry___Healthy": "Plant in well-drained soil and avoid wet, heavy clay. Prune out old fruiting canes immediately after harvest.",
      "Raspberry___Leaf_spot": "Apply fungicides (e.g., captan) only if the disease is severe. Improve cane vigor and reduce moisture around the leaves.",
      "Citrus___Canker": "Remove and destroy infected fruit and branches to limit spread. Apply copper sprays regularly, especially before rain events. ",
      "Citrus___Greening": "The disease is currently incurable; remove and destroy infected trees immediately to protect neighbors. Aggressively control the Asian citrus psyllid vector. ",
      "Plum___Rust": "Apply fungicides (e.g., sulfur) at the first sign of rust lesions. Rake and destroy all fallen, infected leaves in autumn.",
      "Unknown": "Please upload a clearer image or capture the affected area closer. The current image prevents accurate diagnosis."
    };
    
    // Get the list of valid keys for the LLM to choose from
    const VALID_DIAGNOSES = Object.keys(REMEDIATION_MAP).filter(key => key !== 'Unknown');

    // 2. Updated diagnosisSchema to remove the LLM-generated recommendation
    const diagnosisSchema = {
        type: "OBJECT",
        properties: {
            diagnosis_key: { // Changed to key
                type: "STRING",
                description: `The single best classification key from the following list based on the symptoms: ${VALID_DIAGNOSES.join(', ')}. If uncertain, return 'Unknown'.`
            },
            confidence: {
                type: "NUMBER",
                description: "A confidence score for the diagnosis, from 0.0 to 1.0."
            }
        },
        required: ["diagnosis_key", "confidence"],
        propertyOrdering: ["diagnosis_key", "confidence"]
    };

    const handleDiagnosis = async (e) => {
        e.preventDefault();
        if (!symptoms.trim()) {
            setError("Please describe the plant's symptoms.");
            setResult(null);
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        // 3. Updated systemPrompt to instruct the LLM to select a key
        const systemPrompt = `You are PlantDoc AI, an expert botanical diagnostician. Your task is to select the single best diagnosis key from the provided list based on the user's symptoms. The key MUST be one of the following: ${VALID_DIAGNOSES.join(', ')} or 'Unknown'. Respond only with the requested JSON object containing the diagnosis_key and confidence score. Do not include any other text or formatting.`;
        const userPrompt = `Plant symptoms: "${symptoms}". Choose the best diagnosis key from the list and provide a confidence score.`;

        try {
            const apiResult = await callGeminiApi(userPrompt, systemPrompt, diagnosisSchema, [{ google_search: {} }]);
            
            const diagnosisKey = apiResult.diagnosis_key || 'Unknown';
            const confidence = apiResult.confidence || 0.0;
            
            // 4. Implemented Lookup Logic
            const recommendation = REMEDIATION_MAP[diagnosisKey] || REMEDIATION_MAP['Unknown'];
            
            // Format the key for display (e.g., 'Apple___Black_rot' -> 'Apple - Black rot')
            const [plant, condition] = diagnosisKey.split('___');
            
            setResult({
                diagnosis: condition ? `${plant} - ${condition.replace(/_/g, ' ')}` : diagnosisKey,
                rawKey: diagnosisKey,
                confidence: confidence,
                recommendation: recommendation
            });

        } catch (err) {
            console.error("Diagnosis API Error:", err);
            // Fallback for user if API fails to parse or returns a general error
            setError(`Diagnosis failed. Please try again. If the issue persists, the model may be overwhelmed.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card h-full flex flex-col p-6 bg-white rounded-xl shadow-lg font-['Inter']">
            <style>
                {`
                @keyframes pulse-fade {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
                .loading-animation {
                    animation: pulse-fade 1.5s infinite;
                }
                `}
            </style>
            <h2 className="text-2xl font-extrabold text-emerald-800 mb-4 border-b pb-2">PlantDoc AI: Symptom Diagnosis</h2>
            
            <form onSubmit={handleDiagnosis} className="flex flex-col flex-grow">
                <label htmlFor="symptoms-input" className="text-sm font-medium text-gray-700 mb-1">
                    Describe the symptoms you see on your plant:
                </label>
                <textarea
                    id="symptoms-input"
                    value={symptoms}
                    onChange={(e) => {
                        setSymptoms(e.target.value);
                        setError(null); // Clear error on change
                    }}
                    placeholder="E.g., 'My grape leaves have black spots with tan centers, and the fruit is shriveling and turning black like mummies.'"
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 resize-vertical text-gray-700 shadow-sm"
                    disabled={loading}
                />
                
                {error && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-medium">
                        <span className="font-bold">Error:</span> {error}
                    </div>
                )}
                
                <button 
                    type="submit" 
                    disabled={loading || !symptoms.trim()}
                    className="mt-4 py-3 px-6 bg-emerald-600 text-white font-semibold rounded-lg shadow-lg hover:bg-emerald-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? (
                        <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing Symptoms...
                        </span>
                    ) : (
                        "Get Structured Diagnosis"
                    )}
                </button>
            </form>

            {/* Diagnosis Result Display */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                {result && (
                    <div className="result bg-emerald-50 p-6 rounded-xl shadow-inner border border-emerald-200">
                        <h3 className="text-xl font-bold text-emerald-800 mb-4">Diagnosis Report</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            <div className="bg-white p-3 rounded-lg border border-emerald-300 shadow-sm">
                                <p className="text-xs font-semibold uppercase text-gray-500">Classification Key</p>
                                <p className="font-mono text-sm text-gray-800">{result.rawKey}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-emerald-300 shadow-sm md:col-span-2">
                                <p className="text-xs font-semibold uppercase text-gray-500">Primary Diagnosis</p>
                                <p className="font-bold text-base text-emerald-700">{result.diagnosis}</p>
                            </div>
                        </div>

                        <p className="text-gray-700 mb-4">
                            <span className="font-semibold text-emerald-600">Confidence Score:</span> 
                            <span className={`font-mono ml-2 text-lg font-bold ${result.confidence >= 0.75 ? 'text-green-600' : result.confidence >= 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {typeof result.confidence === 'number' ? (result.confidence * 100).toFixed(1) : '0.0'}%
                            </span>
                        </p>
                        
                        <div className="bg-emerald-100 p-4 rounded-md mt-4 border-l-4 border-emerald-500">
                            <p className="font-bold text-lg text-emerald-800 mb-1">Actionable Recommendation:</p>
                            <p className="text-base text-emerald-900">{result.recommendation}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatBox;
