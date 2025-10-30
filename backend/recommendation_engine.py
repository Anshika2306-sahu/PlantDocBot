"""
AI-Powered Plant Disease Recommendation Engine
Generates dynamic recommendations using GPT/LLM or rule-based system
"""

import json
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

@dataclass
class Recommendation:
    disease_name: str
    severity: str
    description: str
    treatment: List[str]
    prevention: List[str]
    organic_solutions: List[str]
    care_instructions: List[str]
    
    def to_dict(self):
        return asdict(self)


class RecommendationEngine:
    """
    Dynamic recommendation engine that generates recommendations
    based on disease classification results
    """
    
    def __init__(self, knowledge_base_path: Optional[str] = None):
        """
        Initialize recommendation engine
        Args:
            knowledge_base_path: Path to JSON file with disease information (optional)
        """
        self.logger = logging.getLogger(__name__)
        self.knowledge_base = {}
        
        if knowledge_base_path:
            self._load_knowledge_base(knowledge_base_path)
    
    def _load_knowledge_base(self, path: str):
        """Load existing knowledge base from JSON file"""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                self.knowledge_base = json.load(f)
            self.logger.info(f"Loaded knowledge base with {len(self.knowledge_base)} entries")
        except Exception as e:
            self.logger.warning(f"Could not load knowledge base: {e}")
    
    def generate_recommendation(self, 
                               disease_class: str, 
                               confidence: float,
                               plant_type: Optional[str] = None) -> Dict:
        """
        Generate recommendations for detected disease
        
        Args:
            disease_class: Predicted disease class (e.g., "Tomato___Early_blight")
            confidence: Prediction confidence score (0-1)
            plant_type: Optional plant type override
            
        Returns:
            Dictionary containing recommendations
        """
        # Parse disease class
        parts = disease_class.split("___")
        if len(parts) == 2:
            plant = parts[0].replace("_", " ")
            disease = parts[1].replace("_", " ")
        else:
            plant = plant_type or "Unknown"
            disease = disease_class.replace("_", " ")
        
        # Check if we have pre-existing knowledge
        if disease_class in self.knowledge_base:
            return self._format_existing_recommendation(
                self.knowledge_base[disease_class], 
                confidence
            )
        
        # Generate dynamic recommendation based on disease name
        return self._generate_dynamic_recommendation(plant, disease, confidence)
    
    def _format_existing_recommendation(self, data: Dict, confidence: float) -> Dict:
        """Format pre-existing recommendation from knowledge base"""
        data['confidence'] = round(confidence, 4)
        data['source'] = 'knowledge_base'
        return data
    
    def _generate_dynamic_recommendation(self, 
                                        plant: str, 
                                        disease: str, 
                                        confidence: float) -> Dict:
        """
        Generate recommendations dynamically based on disease characteristics
        Uses rule-based approach with disease name analysis
        """
        
        # Normalize disease name
        disease_lower = disease.lower()
        is_healthy = "healthy" in disease_lower
        
        if is_healthy:
            return self._generate_healthy_recommendation(plant, confidence)
        
        # Analyze disease type from name
        disease_info = self._analyze_disease_type(disease_lower)
        
        # Generate recommendations based on disease characteristics
        recommendation = {
            "disease_name": f"{plant} - {disease}",
            "plant_type": plant,
            "disease_type": disease,
            "confidence": round(confidence, 4),
            "severity": disease_info['severity'],
            "description": self._generate_description(plant, disease, disease_info),
            "treatment": self._generate_treatment(disease_info),
            "prevention": self._generate_prevention(disease_info),
            "organic_solutions": self._generate_organic_solutions(disease_info),
            "care_instructions": self._generate_care_instructions(plant, disease_info),
            "source": "dynamic_generation"
        }
        
        return recommendation
    
    def _analyze_disease_type(self, disease_name: str) -> Dict:
        """Analyze disease characteristics from its name"""
        info = {
            'is_fungal': False,
            'is_bacterial': False,
            'is_viral': False,
            'affects_leaves': False,
            'affects_fruit': False,
            'severity': 'Moderate'
        }
        
        # Fungal indicators
        fungal_keywords = ['blight', 'rust', 'mold', 'mildew', 'spot', 'rot', 'scab', 'wilt']
        if any(keyword in disease_name for keyword in fungal_keywords):
            info['is_fungal'] = True
        
        # Bacterial indicators
        bacterial_keywords = ['bacterial', 'canker']
        if any(keyword in disease_name for keyword in bacterial_keywords):
            info['is_bacterial'] = True
        
        # Viral indicators
        viral_keywords = ['mosaic', 'virus', 'curl', 'yellow']
        if any(keyword in disease_name for keyword in viral_keywords):
            info['is_viral'] = True
        
        # Affected parts
        if any(word in disease_name for word in ['leaf', 'leaves']):
            info['affects_leaves'] = True
        if any(word in disease_name for word in ['fruit', 'berry']):
            info['affects_fruit'] = True
        
        # Severity assessment
        high_severity = ['late blight', 'bacterial', 'virus', 'wilt']
        if any(severe in disease_name for severe in high_severity):
            info['severity'] = 'High'
        
        return info
    
    def _generate_description(self, plant: str, disease: str, info: Dict) -> str:
        """Generate disease description"""
        if info['is_fungal']:
            return f"Fungal disease affecting {plant} plants, causing {disease.lower()}. Thrives in humid conditions."
        elif info['is_bacterial']:
            return f"Bacterial infection in {plant} plants causing {disease.lower()}. Spreads through water and contaminated tools."
        elif info['is_viral']:
            return f"Viral disease affecting {plant} plants, characterized by {disease.lower()}. Transmitted by insects or mechanical means."
        else:
            return f"Plant disease affecting {plant}, manifesting as {disease.lower()}."
    
    def _generate_treatment(self, info: Dict) -> List[str]:
        """Generate treatment recommendations based on disease type"""
        treatments = []
        
        if info['is_fungal']:
            treatments.extend([
                "Remove and destroy infected plant parts immediately",
                "Apply appropriate fungicide (copper-based or synthetic)",
                "Improve air circulation around plants",
                "Reduce humidity and avoid overhead watering",
                "Apply treatments early morning or evening"
            ])
        
        if info['is_bacterial']:
            treatments.extend([
                "Remove infected plants or parts to prevent spread",
                "Apply copper-based bactericide",
                "Disinfect all tools with 10% bleach solution",
                "Isolate affected plants from healthy ones",
                "Avoid working with wet plants"
            ])
        
        if info['is_viral']:
            treatments.extend([
                "Remove and destroy infected plants completely",
                "Control insect vectors (aphids, whiteflies, etc.)",
                "No cure exists - focus on prevention",
                "Disinfect tools between each plant",
                "Do not compost infected material"
            ])
        
        if not treatments:
            treatments = [
                "Identify the specific disease for targeted treatment",
                "Remove affected plant parts",
                "Consult local agricultural extension for specific recommendations",
                "Monitor plant closely for symptom progression"
            ]
        
        return treatments
    
    def _generate_prevention(self, info: Dict) -> List[str]:
        """Generate prevention recommendations"""
        prevention = [
            "Use disease-resistant varieties when available",
            "Practice crop rotation (3-4 year cycle)",
            "Maintain proper plant spacing for air circulation",
            "Water at the base of plants, avoid wetting foliage",
            "Remove plant debris and weeds regularly"
        ]
        
        if info['is_fungal']:
            prevention.extend([
                "Apply preventive fungicide sprays before disease appears",
                "Ensure good drainage to reduce moisture",
                "Mulch to prevent soil splash on lower leaves"
            ])
        
        if info['is_bacterial']:
            prevention.extend([
                "Use certified disease-free seeds and transplants",
                "Sterilize pots and tools before use",
                "Avoid overhead irrigation systems"
            ])
        
        if info['is_viral']:
            prevention.extend([
                "Control insect populations with appropriate methods",
                "Use reflective mulches to repel aphids",
                "Remove infected plants immediately to prevent spread",
                "Plant virus-resistant varieties"
            ])
        
        return prevention
    
    def _generate_organic_solutions(self, info: Dict) -> List[str]:
        """Generate organic treatment options"""
        organic = []
        
        if info['is_fungal']:
            organic.extend([
                "Neem oil spray (2 tbsp per gallon of water)",
                "Baking soda solution (1 tbsp baking soda + 1 tsp dish soap per gallon)",
                "Copper soap fungicide (organic approved)",
                "Sulfur-based fungicide",
                "Compost tea foliar spray for beneficial microbes"
            ])
        
        if info['is_bacterial']:
            organic.extend([
                "Copper-based organic bactericide",
                "Bacillus subtilis biological control",
                "Maintain plant health with compost and organic fertilizers",
                "Garlic or horseradish spray as natural antibacterial"
            ])
        
        if info['is_viral']:
            organic.extend([
                "Insecticidal soap for vector control",
                "Neem oil to deter insect vectors",
                "Introduce beneficial insects (ladybugs, lacewings)",
                "Diatomaceous earth around plant base"
            ])
        
        organic.extend([
            "Strengthen plant immunity with seaweed extract",
            "Apply mycorrhizal fungi to improve root health"
        ])
        
        return organic
    
    def _generate_care_instructions(self, plant: str, info: Dict) -> List[str]:
        """Generate ongoing care instructions"""
        care = [
            f"Monitor your {plant} plants daily for new symptoms",
            "Maintain consistent watering schedule - water deeply but infrequently",
            "Apply balanced organic fertilizer according to plant needs",
            "Prune dead or diseased material promptly",
            "Keep growing area clean and free of debris"
        ]
        
        if info['severity'] == 'High':
            care.insert(0, "⚠️ High severity disease - act immediately to prevent spread")
            care.append("Consider removing severely affected plants to protect others")
        
        return care
    
    def _generate_healthy_recommendation(self, plant: str, confidence: float) -> Dict:
        """Generate recommendations for healthy plants"""
        return {
            "disease_name": f"Healthy {plant}",
            "plant_type": plant,
            "disease_type": "None - Plant is Healthy",
            "confidence": round(confidence, 4),
            "severity": "None",
            "description": f"Your {plant} plant appears healthy with no visible disease symptoms!",
            "treatment": [
                "No treatment needed - continue current care routine",
                "Monitor regularly for any changes in plant health"
            ],
            "prevention": [
                "Continue proper watering practices",
                "Apply balanced fertilizer as needed",
                "Maintain good air circulation",
                "Remove dead leaves and debris",
                "Inspect plants weekly for early disease detection",
                "Practice good garden hygiene"
            ],
            "organic_solutions": [
                "Use compost to enrich soil naturally",
                "Apply organic mulch to retain moisture",
                "Encourage beneficial insects for pest control",
                "Spray compost tea monthly for disease prevention"
            ],
            "care_instructions": [
                f"Keep your {plant} healthy with consistent care",
                "Water deeply but allow soil to dry between waterings",
                "Ensure adequate sunlight exposure",
                "Fertilize during growing season",
                "Prune as needed to maintain shape and airflow"
            ],
            "source": "healthy_plant"
        }
    
    def add_to_knowledge_base(self, disease_class: str, recommendation: Dict):
        """Add new recommendation to knowledge base"""
        self.knowledge_base[disease_class] = recommendation
    
    def save_knowledge_base(self, path: str):
        """Save knowledge base to JSON file"""
        try:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(self.knowledge_base, f, indent=2, ensure_ascii=False)
            self.logger.info(f"Saved knowledge base to {path}")
        except Exception as e:
            self.logger.error(f"Error saving knowledge base: {e}")


# Optional: OpenAI GPT-based recommendation engine
class GPTRecommendationEngine(RecommendationEngine):
    """
    Advanced recommendation engine using OpenAI GPT
    Requires: pip install openai
    """
    
    def __init__(self, api_key: str, knowledge_base_path: Optional[str] = None):
        super().__init__(knowledge_base_path)
        try:
            import openai
            self.client = openai.OpenAI(api_key=api_key)
            self.use_gpt = True
        except ImportError:
            self.logger.warning("OpenAI not installed. Falling back to rule-based engine.")
            self.use_gpt = False
    
    def _generate_dynamic_recommendation(self, plant: str, disease: str, confidence: float) -> Dict:
        """Generate recommendations using GPT"""
        if not self.use_gpt:
            return super()._generate_dynamic_recommendation(plant, disease, confidence)
        
        try:
            prompt = f"""You are a plant disease expert. Provide detailed recommendations for:
Plant: {plant}
Disease: {disease}
Confidence: {confidence:.2%}

Provide recommendations in JSON format with these fields:
- severity (Low/Moderate/High/Very High)
- description (2-3 sentences)
- treatment (list of 4-6 treatment steps)
- prevention (list of 5-7 prevention measures)
- organic_solutions (list of 4-6 organic treatment options)
- care_instructions (list of 4-5 ongoing care tips)

Be specific, practical, and actionable."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            gpt_data = json.loads(response.choices[0].message.content)
            
            return {
                "disease_name": f"{plant} - {disease}",
                "plant_type": plant,
                "disease_type": disease,
                "confidence": round(confidence, 4),
                "source": "gpt_generated",
                **gpt_data
            }
            
        except Exception as e:
            self.logger.error(f"GPT generation failed: {e}")
            return super()._generate_dynamic_recommendation(plant, disease, confidence)