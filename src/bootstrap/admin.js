'use strict';

const bcrypt = require('bcryptjs');

async function seedAdmin({ configRepo, userRepo }) {
  const username = process.env.ADMIN_USER ? process.env.ADMIN_USER : 'admin';
  const existingHash = configRepo.get('dashboard_password');
  let passwordHash = existingHash;
  if (!passwordHash && process.env.DASHBOARD_PASSWORD) {
    passwordHash = bcrypt.hashSync(process.env.DASHBOARD_PASSWORD, 10);
  }

  await userRepo.seedAdmin(username, passwordHash);
}

module.exports = seedAdmin;
