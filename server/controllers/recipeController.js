const { spawn } = require('child_process');
const path = require('path');
const User = require('../models/User');

exports.suggestRecipes = async (req, res) => {
  try {
    const { ingredients, mode } = req.body;

    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ success: false, message: 'No ingredients provided' });
    }

    let expiringItems = [];

    if (mode === 'maximize_fridge' && req.user) {
      const user = await User.findById(req.user.id);

      if (user && user.pantry) {
        const today = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(today.getDate() + 3);

        expiringItems = user.pantry
          .filter(item => {
            if (!item.expiryDate) return false;
            const expiry = new Date(item.expiryDate);
            return expiry >= today && expiry <= threeDaysFromNow;
          })
          .map(item => item.name);
      }
    }

    const pythonExecutable = process.env.PYTHON_PATH || 'python3';
    const scriptPath = path.join(__dirname, '..', 'ML', 'recommender.py');

    const pythonProcess = spawn(pythonExecutable, [
      scriptPath,
      ingredients.join(' '),
      mode || 'standard',
      expiringItems.join(',')
    ]);

    pythonProcess.on('error', (err) => {
      console.error('Failed to launch Python:', err.message);
      if (!res.headersSent) {
        return res.status(500).json({
          message: 'Could not start Python. Check PYTHON_PATH in your .env file.',
          error: err.message
        });
      }
    });

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python error: ${errorString}`);
        return res.status(500).json({
          success: false,
          message: 'AI model failed to generate recommendations',
          debug: errorString
        });
      }

      try {
        const results = JSON.parse(dataString);
        res.status(200).json({
          success: true,
          mode: mode,
          recommendations: results
        });
      } catch (err) {
        console.error('JSON parse error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to parse AI response'
        });
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};