const database = require("../config/database");
const businessModel = require("./businessModel");
const serviceModel = require("./serviceModel");
const catalogModel = require("./catalogModel");
const contactModel = require("./contactModel");
const chatModel = require("./chatModel");

module.exports = {
  checkDatabaseHealth: database.checkConnection,
  getDatabaseMode: database.getMode,
  businessModel,
  serviceModel,
  catalogModel,
  contactModel,
  chatModel,
};
