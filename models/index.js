const {Sequelize, DataTypes } = require("sequelize");
require('dotenv').config()

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT
});

sequelize.authenticate()
    .then(() => { console.log(`Db connected`) })
    .catch((error) => { console.log(error) })

const db = {}

db.sequelize = sequelize
db.Sequelize = Sequelize

db.users = require('./userModel')(sequelize, DataTypes)
db.deposits = require('./depositModel')(sequelize, DataTypes)
db.investments = require('./investmentModel')(sequelize, DataTypes)
db.notifications = require('./notificationModel')(sequelize, DataTypes)
db.withdrawals = require('./withdrawalModel')(sequelize, DataTypes)
db.ups = require('./upModel')(sequelize, DataTypes)
db.wallets = require('./walletModel')(sequelize, DataTypes)
db.admin_wallets = require('./AdminWalletsModel')(sequelize, DataTypes)
db.trading_plans = require('./TradingPlans')(sequelize, DataTypes)


db.users.hasMany(db.deposits, {foreignKey: 'user', as: 'depositUser'})
db.users.hasMany(db.notifications, {foreignKey: 'user', as: 'notiUser'})
db.users.hasMany(db.withdrawals, {foreignKey: 'user', as: 'wthUser'})
db.users.hasMany(db.investments, {foreignKey: 'user', as: 'investmentUser'})
db.users.belongsTo(db.ups, {foreignKey: 'user', as: 'upUser'})
db.users.belongsTo(db.wallets, {foreignKey: 'user', as: 'walletUser'})

db.deposits.belongsTo(db.users, {foreignKey: 'user', as: 'depositUser'})
db.investments.belongsTo(db.users,  {foreignKey: 'user', as: 'investmentUser'})
db.notifications.belongsTo(db.users, {foreignKey: 'user', as: 'notitUser'})
db.withdrawals.belongsTo(db.users, {foreignKey: 'user', as: 'wthUser'})
db.ups.belongsTo(db.users, {foreignKey: 'user', as: 'upUser'})
db.wallets.belongsTo(db.users, {foreignKey: 'user', as: 'walletUser'})

db.sequelize.sync({ force:  false }).then(() => console.log('Tables synced'))

module.exports = db