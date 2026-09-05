'use strict';

require('module-alias/register');
const app = require('@app');

// CloudLinux Passenger intercepts listen() and supplies its own socket.
app.listen();
