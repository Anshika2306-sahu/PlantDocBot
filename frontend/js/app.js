// Initialize app
let predictionHistory = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
let stats = JSON.parse(localStorage.getItem('stats') || '{"total": 0, "confidenceSum": 0, "today": 0, "lastDate": ""}');

// Check if it's a new day
const today = new Date().toDateString();
if (stats.lastDate !== today) {
    stats.today = 0;
    stats.lastDate = today;
}

// Load saved dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// Loading Screen
window.addEventListener('load', function() {
    setTimeout(function() {
        document.getElementById('loadingScreen').classList.add('hidden');
    }, 2000);
});

updateStats();
renderHistory();

// Image Preview
document.getElementById('imageFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Image Form Submit
document.getElementById('imageForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('imageFile');
    const btn = document.getElementById('imageBtn');
    const loading = document.getElementById('imageLoading');
    const result = document.getElementById('imageResult');
    
    if (!fileInput.files[0]) {
        showResult(result, 'error', 'Please select an image file');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    btn.disabled = true;
    loading.classList.add('active');
    result.style.display = 'none';
    hideRecommendations();

    try {
        const response = await fetch('/api/image-prediction', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            const confidence = (parseFloat(data.confidence) * 100).toFixed(2);
            showResult(result, 'success', `
                <h3>Detection Results:</h3>
                <div class="result-item"><strong>Disease:</strong> ${data.predicted_class.replace(/_/g, ' ')}</div>
                <div class="result-item"><strong>Confidence:</strong> ${confidence}%</div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${confidence}%"></div>
                </div>
                <div class="result-item"><strong>Filename:</strong> ${data.filename}</div>
            `);
            
            // Display recommendations
            if (data.recommendations) {
                displayRecommendations(data.recommendations);
            }
            
            // Save to history
            addToHistory({
                type: 'Image',
                disease: data.predicted_class,
                confidence: confidence,
                input: data.filename,
                timestamp: new Date().toISOString(),
                recommendations: data.recommendations
            });
            
            showToast('Image analyzed successfully! ✓');
        } else {
            showResult(result, 'error', `Error: ${data.detail || 'Failed to analyze image'}`);
        }
    } catch (error) {
        showResult(result, 'error', `Error: ${error.message}`);
    } finally {
        btn.disabled = false;
        loading.classList.remove('active');
    }
});

// Text Form Submit
document.getElementById('textForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const textInput = document.getElementById('textInput');
    const btn = document.getElementById('textBtn');
    const loading = document.getElementById('textLoading');
    const result = document.getElementById('textResult');

    if (!textInput.value.trim()) {
        showResult(result, 'error', 'Please enter a description');
        return;
    }

    btn.disabled = true;
    loading.classList.add('active');
    result.style.display = 'none';
    hideRecommendations();

    try {
        const response = await fetch('/api/text-prediction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ input: textInput.value })
        });

        const data = await response.json();

        if (response.ok) {
            const confidence = (parseFloat(data.confidence) * 100).toFixed(2);
            showResult(result, 'success', `
                <h3>Detection Results:</h3>
                <div class="result-item"><strong>Disease:</strong> ${data.predicted_disease.replace(/_/g, ' ')}</div>
                <div class="result-item"><strong>Confidence:</strong> ${confidence}%</div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${confidence}%"></div>
                </div>
                <div class="result-item"><strong>Your Input:</strong> "${data.input_text}"</div>
            `);
            
            // Display recommendations
            if (data.recommendations) {
                displayRecommendations(data.recommendations);
            }
            
            // Save to history
            addToHistory({
                type: 'Text',
                disease: data.predicted_disease,
                confidence: confidence,
                input: data.input_text,
                timestamp: new Date().toISOString(),
                recommendations: data.recommendations
            });
            
            showToast('Symptoms analyzed successfully! ✓');
        } else {
            showResult(result, 'error', `Error: ${data.detail || 'Failed to analyze text'}`);
        }
    } catch (error) {
        showResult(result, 'error', `Error: ${error.message}`);
    } finally {
        btn.disabled = false;
        loading.classList.remove('active');
    }
});

function showResult(element, type, content) {
    element.className = `result ${type}`;
    element.innerHTML = content;
    element.style.display = 'block';
}

function displayRecommendations(recommendations) {
    const section = document.getElementById('recommendationsSection');
    const content = document.getElementById('recommendationsContent');
    
    if (!recommendations) {
        section.style.display = 'none';
        return;
    }
    
    const isHealthy = recommendations.disease_name.toLowerCase().includes('healthy');
    
    let html = '';
    
    if (isHealthy) {
        html = `
            <div class="healthy-message">
                🎉 Great news! Your ${recommendations.disease_name} shows no signs of disease. 
                Keep up the excellent care!
            </div>
        `;
    } else {
        html = `
            <div class="disease-description">
                <h4>📋 Disease Information</h4>
                <p><strong>${recommendations.disease_name}</strong></p>
                <p>${recommendations.description}</p>
            </div>
        `;
        
        if (recommendations.symptoms && recommendations.symptoms.length > 0 && 
            !recommendations.symptoms.includes("No disease detected")) {
            html += `
                <div class="symptoms-list">
                    <h4>⚠️ Common Symptoms</h4>
                    <ul>
                        ${recommendations.symptoms.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }
    
    if (recommendations.treatment && recommendations.treatment.length > 0 && 
        !recommendations.treatment.includes("No treatment needed")) {
        html += `
            <div class="recommendation-card">
                <h4>💊 Treatment Recommendations</h4>
                <ul>
                    ${recommendations.treatment.map(t => `<li>${t}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (recommendations.prevention && recommendations.prevention.length > 0) {
        html += `
            <div class="recommendation-card">
                <h4>🛡️ Prevention Methods</h4>
                <ul>
                    ${recommendations.prevention.map(p => `<li>${p}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (recommendations.organic_solutions && recommendations.organic_solutions.length > 0) {
        html += `
            <div class="recommendation-card">
                <h4>🌱 Organic Solutions</h4>
                <ul>
                    ${recommendations.organic_solutions.map(o => `<li>${o}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    content.innerHTML = html;
    section.style.display = 'block';
    
    // Scroll to recommendations
    setTimeout(() => {
        section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
}

function hideRecommendations() {
    const section = document.getElementById('recommendationsSection');
    section.style.display = 'none';
}

function addToHistory(data) {
    predictionHistory.unshift(data);
    if (predictionHistory.length > 50) predictionHistory.pop();
    
    stats.total++;
    stats.today++;
    stats.confidenceSum += parseFloat(data.confidence);
    
    localStorage.setItem('predictionHistory', JSON.stringify(predictionHistory));
    localStorage.setItem('stats', JSON.stringify(stats));
    
    updateStats();
    renderHistory();
}

function updateStats() {
    document.getElementById('totalPredictions').textContent = stats.total;
    document.getElementById('todayCount').textContent = stats.today;
    const avgConf = stats.total > 0 ? (stats.confidenceSum / stats.total).toFixed(1) : 0;
    document.getElementById('avgConfidence').textContent = avgConf + '%';
}

function renderHistory() {
    const historyList = document.getElementById('historyList');
    if (predictionHistory.length === 0) {
        historyList.innerHTML = '<p class="history-empty">No predictions yet. Start by uploading an image or entering symptoms!</p>';
        return;
    }

    historyList.innerHTML = predictionHistory.map(item => {
        const date = new Date(item.timestamp);
        const timeAgo = getTimeAgo(date);
        return `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-type">${item.type}</span>
                    <span class="history-time">${timeAgo}</span>
                </div>
                <div class="history-disease">${item.disease.replace(/_/g, ' ')}</div>
                <div class="history-confidence">Confidence: ${item.confidence}%</div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${item.confidence}%"></div>
                </div>
                <div class="history-input">${item.input.length > 100 ? item.input.substring(0, 100) + '...' : item.input}</div>
            </div>
        `;
    }).join('');
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
        predictionHistory = [];
        stats = {total: 0, confidenceSum: 0, today: 0, lastDate: today};
        localStorage.setItem('predictionHistory', JSON.stringify(predictionHistory));
        localStorage.setItem('stats', JSON.stringify(stats));
        updateStats();
        renderHistory();
        hideRecommendations();
        showToast('History cleared successfully!');
    }
}

function exportData() {
    const exportData = {
        history: predictionHistory,
        stats: stats,
        exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plant-disease-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully! 💾');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    showToast(isDark ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showAbout() {
    document.getElementById('aboutModal').style.display = 'block';
}

function closeAbout() {
    document.getElementById('aboutModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('aboutModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + D for dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleDarkMode();
    }
    // Ctrl/Cmd + E for export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportData();
    }
});
