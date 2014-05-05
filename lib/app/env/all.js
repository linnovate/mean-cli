'use strict';

module.exports = {
    // root: process.cwd(),
    root: 'packages/system',
    port: process.env.PORT || 3000,
    db: process.env.MONGOHQ_URL,
    templateEngine: 'swig',

    // The secret should be set to a non-guessable string that
    // is used to compute a session hash
    sessionSecret: 'MEAN',
    // The name of the MongoDB collection to store sessions in
    sessionCollection: 'sessions'
};
