# Plant DocBot: AI-Powered Plant Disease Diagnosis

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=flat&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)

**Live Project Link:** [Plant DocBot on Render](https://plantdocbot-dm89.onrender.com/)  
**GitHub Repository:** [PlantDocBot (intern-AnshikaSahu Branch)](https://github.com/Anshika2306-sahu/PlantDocBot/tree/intern-AnshikaSahu)

**Plant DocBot** is an end-to-end Artificial Intelligence system designed to automate the detection of plant leaf diseases. Users can upload leaf images via a web interface, receive real-time classifications, and get actionable treatment and prevention recommendations.

Developed during the **Infosys Springboard AI/ML Internship**, this project integrates a custom-trained Deep Learning pipeline with a high-performance production API to deliver stable inference in under 2 seconds.

---

## Key Features

* **Automated Real-Time Diagnosis:** Fast file upload pipeline allowing seamless automated classification via a responsive web application.
* **Massive Disease Coverage:** Successfully identifies **35+ distinct plant leaf diseases** and nutritional deficiencies.
* **Advanced Inference (TTA):** Utilizes **Test-Time Augmentation (TTA)** during inference to average predictions across multiple spatial augmentations, ensuring robust stability against real-world lighting and orientations.
* **Top-1 Confidence Scoring:** Implements softmax probability pipelines to select and display the single highest-probability prediction from model outputs.
* **Actionable Insights:** Dynamically maps classified conditions to contextual cure, treatment, and long-term prevention protocols.

---

## 🛠️ Technical Architecture & Tech Stack

### **Machine Learning Deep Dive**
* **Model Architecture:** Custom 4-Layer Convolutional Neural Network (`PlantCNN`) 
  * *Convolutions:* 4 sequential Conv2D layers scaling features up to 256 channels ($3 \times 3$ kernels).
  * *Regularization:* Integrated `BatchNorm2d` after each convolution and a $50\%$ `Dropout` layer before the final dense layer to mitigate overfitting.
  * *Downsampling:* MaxPool2d ($2 \times 2$ window) decreasing spatial dimension down to an effective $8 \times 8$ feature map.
* **Training Pipeline Optimization:**
  * *Loss Function:* Cross-Entropy Loss.
  * *Optimizer:* Adam Optimizer initialized with a learning rate of $0.0008$.
  * *Learning Rate Scheduling:* `StepLR` scheduler dropped the learning rate by a factor of $\gamma = 0.7$ every 3 epochs.
  * *Dataset:* Trained on **10,000+ augmented images** from the *Plant Village* and *Plant Doc* repositories via Kaggle.

### **Backend Engineering**
* **API Framework:** FastAPI (Asynchronous Python framework optimized for fast, multi-threaded inference workers).
* **Data Pipelines:** Integrated PIL image wrappers and explicit `torchvision.transforms` normalization (ImageNet standards) matching training distributions.

### **Frontend Interface**
* Built using a decoupled modern UI engine (React/HTML/CSS) managing asynchronous API fetch cycles, state management for file drops, and real-time inference rendering.

---

## Repository Structure

```text
├── backend/
│   ├── main.py                 # FastAPI production server configuration
│   ├── class_mapping.json      # Serialized index-to-class label mapping file
│   ├── recommendations.json    # 35+ Disease mitigation & treatment metadata
│   ├── requirements.txt        # Production Python dependencies (FastAPI, PyTorch)
│   ├── package.json
│   ├── LICENSE
│   └── .gitignore
├── frontend/
│   ├── public/
│   ├── src/                    # State rendering components, UI modules, and upload hooks
│   ├── package.json
│   ├── package-lock.json
│   └── .gitignore
├── Img_Classification.ipynb    # Model architecture training & optimization environment
├── Img_Classificaton.ipynb     # Model validation & checkpoint testbed
├── Text_classification.ipynb   # Supplemental text metrics & analytics processing
└── README.md
