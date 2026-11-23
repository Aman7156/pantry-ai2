# PantryAI

A full stack web app that tracks what's in your kitchen, suggests recipes you can cook with the ingredients you already have, and gives personalised nutrition and fitness advice through an AI chatbot.

Built by a team of two: **Aman Kumar Singh** ([@Aman7156](https://github.com/Aman7156)) and [@karan13-collab](https://github.com/karan13-collab).

<!-- Add 2 or 3 screenshots here (dashboard, recipe suggestions, chatbot). It's the first thing people look at. -->

---

## Features

- **Pantry inventory:** add items with quantity and expiry date; the pantry is sorted by expiry and expired items are cleared automatically
- **Recipe suggestions (ML):** type or select your ingredients and get the 5 best recipes, with match %, missing ingredients, cooking time and nutrition
- **Cook what's about to expire:** suggestions can be built from the items that expire first, to reduce food waste
- **AI nutrition coach:** a chatbot that answers fitness and meal-planning questions using your profile (age, weight, activity level, allergies, diet)
- **Households:** share one pantry with the people you live with
- **Shopping lists**
- **Accounts:** registration with email OTP, login with JWT, password reset by email

---

## My contribution

I built three parts of the app:

| Part | What I built |
|---|---|
| **ML recipe engine** | The recommendation model and its FastAPI service (`server/ML/ml/`) |
| **AI chatbot** | The nutrition and fitness coach (`server/controllers/chatController.js`, `client/src/components/FitnessChat.jsx`) |
| **Frontend** | The React app: dashboard, recipe suggestions, shopping list, login and registration (`client/`) |

My teammate built the Node.js backend: authentication, inventory, households and shopping lists.

<!-- EDIT: correct this split if it isn't exactly right. -->

---

## How the recipe engine works

1. **Clean the input:** ingredient names are lower-cased and plurals are normalised (for example "tomatoes" becomes "tomato").
2. **Encode:** each recipe and the user's ingredients are turned into a multi-hot vector with scikit-learn's `MultiLabelBinarizer`.
3. **Find candidates:** a **k-nearest-neighbours** model (`NearestNeighbors`) returns the 30 recipes closest to the user's ingredients.
4. **Re-rank:** a custom score rewards recipes that use more of what you have and penalises missing ingredients (salt, pepper, oil and water are treated as optional).
5. **Return the top 5**, each labelled *cookable* (nothing missing), *almost* (1 or 2 missing) or *hard*, with nutrition parsed from the dataset.

The model is trained on **5,000 recipes** from the Food.com recipe dataset.

<!-- EDIT: confirm the dataset name and size. -->

## How the chatbot works

The backend builds a system prompt from the user's saved profile (age, height, weight, activity level, allergies, dietary preferences, and BMI calculated from them) and sends the conversation to **Llama 3.3 70B** through the OpenRouter API. The coach only answers fitness, nutrition and health questions and politely refuses anything else.

---

## Architecture

```
React frontend (port 3000)
        |
Node.js / Express API (port 5002) ---- MongoDB
        |                     \
FastAPI ML service (port 8000)  OpenRouter API (Llama 3.3 70B)
```

The Express server proxies recipe requests to the FastAPI service, so the frontend only talks to one API.

## Tech stack

| Area | Tools |
|---|---|
| Frontend | React, React Router, Tailwind CSS, Axios |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, Nodemailer, Helmet, rate limiting |
| Machine learning | Python, FastAPI, scikit-learn (k-nearest neighbours, MultiLabelBinarizer), pandas |
| AI chatbot | Llama 3.3 70B via OpenRouter |

---

## Getting started

### 1. ML service

```bash
cd server/ML/ml
pip install fastapi uvicorn scikit-learn pandas
uvicorn app:app --port 8000
```

### 2. Backend

Create `server/.env` with:

```
PORT=5002
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_long_random_string
OPENROUTER_API_KEY=your_openrouter_key
ML_SERVICE_URL=http://localhost:8000
SPOONACULAR_API_KEY=your_spoonacular_key
PYTHON_PATH=python3
BREVO_HOST=smtp-relay.brevo.com
BREVO_PORT=587
BREVO_USER=your_brevo_login
BREVO_PASS=your_brevo_smtp_key
BREVO_SENDER=your_sender_email
```

The `BREVO_*` variables send the sign-up and password-reset OTP emails through Brevo.

```bash
cd server
npm install
node server.js
```

### 3. Frontend

```bash
cd client
npm install
npm start
```

Then open http://localhost:3000.

---

## Project structure

```
client/                 React frontend
  src/pages/            Dashboard, recipe suggestions, shopping list, login, register
  src/components/       Chatbot and shared components
server/                 Node.js / Express backend
  controllers/          Auth, inventory, households, recipes, chat
  models/               MongoDB models (User, Inventory, Household, ShoppingList)
  routes/               API routes
  ML/ml/                FastAPI recipe recommendation service and trained model
```

## Author

**Aman Kumar Singh**, M.Sc. Data Science and Engineering, Politecnico di Torino  
[LinkedIn](https://linkedin.com/in/aman-kumar-singh-4a632a1a0) · [GitHub](https://github.com/Aman7156)
