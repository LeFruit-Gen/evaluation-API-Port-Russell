const isAdmin = (req, res, next) => {
    if (!req.user) {
        req.flash('error', 'Vous devez être connecté');
        return res.redirect('/');
    }

    if (req.user.role !== 'admin') {
        req.flash('error', 'Accès réservé aux administrateurs');
        return res.redirect('/dashboard');
    }

    next();
};

module.exports = isAdmin;