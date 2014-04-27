'use strict';

var auth;
require('meanio').resolve(function(authorization) {
    console.log('authorization:', authorization);
    auth = authorization;
});

// Article authorization helpers
var hasAuthorization = function(req, res, next) {
    if (req.article.user.id !== req.user.id) {
        return res.send(401, 'User is not authorized');
    }
    next();
};

module.exports = function(Articles, app) {

    app.get('/articles', Articles.all);
    app.post('/articles', auth.requiresLogin, Articles.create);
    app.get('/articles/:articleId', Articles.show);
    app.put('/articles/:articleId', auth.requiresLogin, hasAuthorization, Articles.update);
    app.del('/articles/:articleId', auth.requiresLogin, hasAuthorization, Articles.destroy);

    // Finish with setting up the articleId param
    app.param('articleId', Articles.article);

};
