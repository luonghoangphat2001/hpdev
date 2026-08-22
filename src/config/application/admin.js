'use strict';

const bcrypt = require('bcryptjs');

async function seedAdmin({ configRepo, userRepo }) {
  const username = process.env.ADMIN_USER || 'admin';
  const existingHash = configRepo.get('dashboard_password');
  const passwordHash = existingHash || (process.env.DASHBOARD_PASSWORD
    ? bcrypt.hashSync(process.env.DASHBOARD_PASSWORD, 10)
    : null);

  await userRepo.seedAdmin(username, passwordHash);
}

module.exports = seedAdmin;
