const jwt = require('jsonwebtoken');
const User = require('../models/users');
require('dotenv').config({ path: './.env/.env' });

const isAuthenticated = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    req.flash('error', 'Veuillez vous connecter');
    return res.redirect('/');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).lean();
    
    if (!user) {
      req.flash('error', 'Utilisateur non trouvé');
      res.clearCookie('token');
      return res.redirect('/');
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur JWT:', error);
    req.flash('error', 'Session invalide, veuillez vous reconnecter');
    res.clearCookie('token');
    return res.redirect('/');
  }
};

module.exports = isAuthenticated;