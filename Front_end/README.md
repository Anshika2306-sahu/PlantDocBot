# PlantDoc: Local Full-Stack Edition

An AI-powered chatbot that allows users to upload images of plant leaves or describe symptoms via text, and receive accurate plant disease diagnosis and treatment recommendations.

This version is designed to run completely locally with a Python backend and a React frontend, perfect for demonstrations.

## Project Structure

- `/backend`: A FastAPI server that simulates the AI model's diagnosis.
- `/src`, `/public`: The React-based user interface.
- `requirements.txt`: Python dependencies for the backend.

## How to Run Locally

This project consists of two separate parts: a backend server and a frontend client. You will need to run them in two separate terminals.

### Prerequisites
- Python 3.8+ and `pip`
- A code editor like VS Code with a live server extension (e.g., "Live Server").
- A modern web browser.

### 1. Run the Backend Server

First, set up and run the FastAPI server.

```bash
# 1. Open a terminal in the project's root directory.

# 2. (Optional but recommended) Create and activate a Python virtual environment.
# On Windows:
# python -m venv venv
# venv\Scripts\activate
#
# On macOS/Linux:
# python3 -m venv venv
# source venv/bin/activate

# 3. Install the required Python packages.
pip install -r requirements.txt

# 4. Start the backend server from the root directory.
cd backend
uvicorn main:app --reload
```
The server will start on `http://127.0.0.1:8000`. Keep this terminal running.

### 2. Run the Frontend Application

Now, open a **new terminal** to serve the frontend.

The simplest way is to use a live server extension in your code editor.

1.  Open the project's root folder in VS Code.
2.  In the VS Code explorer, find the `public/index.html` file.
3.  Right-click on `public/index.html` and choose "Open with Live Server".

This will open the application in your browser at an address like `http://127.0.0.1:5500`. It's now connected to your local backend and ready to use!

### Start Diagnosing
- The application is now running.
- Type a description of your plant's symptoms or upload a photo of an affected leaf to get a diagnosis from the local backend server.