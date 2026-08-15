'use strict';

const app = require('./src/app');

// CloudLinux Passenger intercepts listen() and supplies its own socket.
app.listen();
