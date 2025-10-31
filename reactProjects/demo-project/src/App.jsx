import { useState } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState('')

  // Disease-specific recommendations
  const getDiseaseRecommendation = (diseaseName) => {
    const recommendations = {
      // Apple diseases
      'Apple___Apple_scab': 'Prune affected branches and apply fungicides containing captan or sulfur. Ensure good air circulation around trees.',
      'Apple___Black_rot': 'Remove and destroy infected fruits and branches. Apply fungicides during bloom period and consider resistant varieties.',
      'Apple___Cedar_apple_rust': 'Remove nearby juniper trees if possible. Apply fungicides in early spring before symptoms appear.',
      'Apple___healthy': 'Your apple plant is healthy! Continue regular care with proper watering, fertilization, and pruning.',
      
      // Cherry diseases
      'Cherry_(including_sour)___Powdery_mildew': 'Improve air circulation, avoid overhead watering, and apply fungicides containing potassium bicarbonate.',
      'Cherry_(including_sour)___healthy': 'Your cherry plant is healthy! Maintain regular care with proper watering and annual pruning.',
      
      // Corn diseases
      'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': 'Rotate crops, plant resistant varieties, and apply fungicides if necessary. Remove crop debris after harvest.',
      'Corn_(maize)___Common_rust_': 'Plant resistant varieties and apply fungicides if severe. Remove and destroy infected plant parts.',
      'Corn_(maize)___Northern_Leaf_Blight': 'Rotate crops, till under crop residues, and apply fungicides during critical growth stages.',
      'Corn_(maize)___healthy': 'Your corn plant is healthy! Continue with proper fertilization and pest management.',
      
      // Grape diseases
      'Grape___Black_rot': 'Prune infected canes, remove mummified berries, and apply fungicides during bloom and fruit development.',
      'Grape___Esca_(Black_Measles)': 'Prune out infected wood during dormant season and seal pruning wounds with wound dressing.',
      'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': 'Improve air circulation, avoid overhead irrigation, and apply fungicides preventatively.',
      'Grape___healthy': 'Your grape plant is healthy! Continue regular pruning and trellising for optimal growth.',
      
      // Peach diseases
      'Peach___Bacterial_spot': 'Apply copper-based bactericides during dormant season and avoid working in wet conditions.',
      'Peach___healthy': 'Your peach plant is healthy! Thin fruits for better quality and maintain regular pest control.',
      
      // Pepper diseases
      'Pepper,_bell___Bacterial_spot': 'Use disease-free seeds, rotate crops, and apply copper-based bactericides preventatively.',
      'Pepper,_bell___healthy': 'Your pepper plant is healthy! Provide consistent watering and support for heavy fruit loads.',
      
      // Potato diseases
      'Potato___Early_blight': 'Rotate crops, mulch plants, and apply fungicides containing chlorothalonil or mancozeb.',
      'Potato___Late_blight': 'Plant resistant varieties, avoid overhead watering, and apply fungicides preventatively during wet periods.',
      'Potato___healthy': 'Your potato plant is healthy! Hill soil around stems and maintain consistent moisture.',
      
      // Tomato diseases
      'Tomato___Bacterial_spot': 'Use disease-free seeds, avoid overhead watering, and apply copper-based bactericides.',
      'Tomato___Early_blight': 'Mulch plants, remove lower leaves, and apply fungicides containing chlorothalonil.',
      'Tomato___Late_blight': 'Plant resistant varieties, space plants properly, and apply fungicides during wet weather.',
      'Tomato___Leaf_Mold': 'Improve ventilation, reduce humidity, and apply fungicides containing chlorothalonil.',
      'Tomato___Septoria_leaf_spot': 'Remove infected leaves, mulch plants, and apply fungicides at first sign of disease.',
      'Tomato___Spider_mites Two-spotted_spider_mite': 'Increase humidity, introduce beneficial insects, and apply miticides if necessary.',
      'Tomato___Target_Spot': 'Rotate crops, remove plant debris, and apply fungicides containing chlorothalonil.',
      'Tomato___Tomato_Yellow_Leaf_Curl_Virus': 'Control whiteflies, remove infected plants, and plant resistant varieties.',
      'Tomato___Tomato_mosaic_virus': 'Disinfect tools, remove infected plants, and plant resistant varieties.',
      'Tomato___healthy': 'Your tomato plant is healthy! Provide consistent watering and support for vines.',
      
      // General healthy recommendations
      'Blueberry___healthy': 'Your blueberry plant is healthy! Maintain acidic soil and regular pruning.',
      'Orange___Haunglongbing_(Citrus_greening)': 'Remove infected trees, control psyllid vectors, and plant disease-free stock.',
      'Raspberry___healthy': 'Your raspberry plant is healthy! Provide trellising and regular pruning.',
      'Soybean___healthy': 'Your soybean plant is healthy! Continue with proper fertilization and pest management.',
      'Squash___Powdery_mildew': 'Improve air circulation, avoid overhead watering, and apply fungicides containing potassium bicarbonate.',
      'Strawberry___Leaf_scorch': 'Improve drainage, mulch plants, and ensure adequate watering during dry periods.',
      'Strawberry___healthy': 'Your strawberry plant is healthy! Renew plants every few years and maintain proper spacing.'
    };

    return recommendations[diseaseName] || 'General care: Ensure proper watering, adequate sunlight, and good soil drainage. Remove any infected plant parts and consider consulting with a local agricultural extension service for specific treatment options.';
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    setFileName(selectedFile ? selectedFile.name : '')
    // Clear text when file is selected
    if (selectedFile) {
      setText('')
    }
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
    // Clear file when text is entered
    if (e.target.value.trim() !== '') {
      setFile(null)
      setFileName('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Handle image prediction
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/image-prediction', {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || 'Failed to get image prediction')
        }
        
        const data = await response.json()
        const recommendation = getDiseaseRecommendation(data.predicted_class);
        
        setResult({
          type: 'image',
          disease_name: data.predicted_class,
          confidence: parseFloat(data.confidence),
          recommendation: recommendation
        })
      } 
      // Handle text prediction
      else if (text.trim()) {
        const response = await fetch('/api/text-prediction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input: text.trim() }),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || 'Failed to get text prediction')
        }
        
        const data = await response.json()
        const recommendation = getDiseaseRecommendation(data.predicted_disease);
        
        setResult({
          type: 'text',
          disease_name: data.predicted_disease,
          confidence: parseFloat(data.confidence),
          recommendation: recommendation
        })
      } 
      // No input provided
      else {
        throw new Error('Please provide either an image or text input')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const clearForm = () => {
    setFile(null)
    setText('')
    setFileName('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌱 Plant Disease Detection</h1>
        <p>Upload an image of a plant or describe symptoms to get a diagnosis</p>
      </header>

      <main className="app-main">
        <div className="input-section">
          <div className="card">
            <h2>Input</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="image-upload">Upload Plant Image:</label>
                <input 
                  type="file" 
                  id="image-upload" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
                {fileName && (
                  <p className="file-name">Selected: {fileName}</p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="symptoms">Or Describe Symptoms:</label>
                <textarea 
                  id="symptoms" 
                  placeholder="Describe plant symptoms, e.g. 'Yellow spots on leaves, wilting...'"
                  value={text}
                  onChange={handleTextChange}
                  rows="4"
                />
              </div>
              
              <div className="button-group">
                <button type="submit" disabled={loading}>
                  {loading ? 'Analyzing...' : 'Submit'}
                </button>
                <button type="button" onClick={clearForm} className="secondary">
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="result-section">
          <div className="card">
            <h2>Results</h2>
            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <p>Analyzing input...</p>
              </div>
            )}
            
            {error && (
              <div className="error">
                <p>{error}</p>
              </div>
            )}
            
            {result && (
              <div className="result">
                <h3>🩺 Disease Detected: {result.disease_name}</h3>
                <p>📊 Confidence: <strong>{(result.confidence * 100).toFixed(2)}%</strong></p>
                <div className="recommendation">
                  <h4>🌿 Treatment Recommendation:</h4>
                  <p>{result.recommendation}</p>
                </div>
                <p className="input-type">Analysis based on {result.type === 'image' ? '📷 image upload' : '📝 text description'}</p>
              </div>
            )}
            
            {!loading && !error && !result && (
              <div className="no-result">
                <p>Results will appear here after submission</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App