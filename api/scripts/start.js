const path = require('path');
const { main: bootstrap } = require('./render-bootstrap');

bootstrap({ skipGenerate: true })
    .then(() => {
        require(path.join(__dirname, '..', 'dist', 'index.js'));
    })
    .catch((error) => {
        console.error('[start] Failed to prepare database before startup.');
        console.error(error);
        process.exit(1);
    });
