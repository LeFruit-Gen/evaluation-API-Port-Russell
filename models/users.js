const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 }
}, { timestamps: true });

// Hash le mot de passe avant de le sauvegarder
userSchema.pre('save', async function(next) {
  // Ne hash le mot de passe que s'il a été modifié ou si c'est un nouvel utilisateur
  if (!this.isModified('password')) return next();
  
  // Vérifie si le mot de passe est déjà hashé
  try {
    // Si bcrypt.getRounds ne lance pas d'erreur, le mot de passe est déjà hashé
    bcrypt.getRounds(this.password);
    return next();
  } catch (err) {
    // Le mot de passe n'est pas hashé, on le hash
    this.password = await bcrypt.hash(this.password, 10);
    next();
  }
});

// Vérification du mot de passe
userSchema.methods.isValidPassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;