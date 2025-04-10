const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).render('error', { error: 'Non authentifié' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).render('error', { error: 'Accès non autorisé' });
        }

        next();
    };
};

module.exports = { checkRole };