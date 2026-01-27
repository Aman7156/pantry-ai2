const axios = require('axios');
const User = require('../models/User');

exports.chatWithTrainer = async (req, res) => {
  const { message, history } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ msg: "User not found" });

    const systemPrompt = `
      You are PantryAI Coach, an elite nutritionist and personal trainer.
      
      === USER PROFILE ===
      Name: ${user.username}
      Age: ${user.age}
      Gender: ${user.gender}
      Height: ${user.height}cm
      Weight: ${user.weight}kg
      Activity Level: ${user.activityLevel} (${user.workoutDays} workouts/week)
      Allergies: ${user.allergies.join(', ') || 'None'}
      Dietary Prefs: ${user.dietaryPreferences || 'None'}
      Calculated BMI: ${(user.weight / ((user.height/100) ** 2)).toFixed(1)}

      === RULES ===
      1. You MUST use the User Profile above to give personalized advice. (e.g., "Since you are vegetarian...", "At your weight of ${user.weight}kg...")
      2. STRICTLY LIMIT your answers to Fitness, Nutrition, Meal Planning, Workouts, and Health.
      3. If the user asks about ANYTHING else (coding, politics, history, general chat), politely refuse: "I am designed only to assist with your health and fitness goals."
      4. Keep answers concise, motivating, and actionable.
      5. Do not use markdown bolding excessively.
    `;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: message }
    ];

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.3-70b-instruct:free", 
        messages: messages,
        temperature: 0.7,
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://pantryai.com", 
        }
      }
    );

    const aiReply = response.data.choices[0].message.content;
    res.json({ reply: aiReply });

  } catch (err) {
    console.error("AI Chat Error:", err.response?.data || err.message);
    res.status(500).json({ msg: "My workout brain is tired. Try again later." });
  }
};