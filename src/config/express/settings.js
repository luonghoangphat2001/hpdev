'use strict';

const path = require('path');
const DashboardTemplate = require('../../utils/DashboardTemplate');

const VIEWS_DIR = path.join(__dirname, '../../../views');

function configureSettings(app) {
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

  app.engine('html', DashboardTemplate.engine);
  app.set('views', VIEWS_DIR);
  app.set('view engine', 'html');
}

module.exports = configureSettings;
