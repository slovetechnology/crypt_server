const {Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize('aiweb', 'root', '', {
    host:'localhost',
    dialect: 'mysql'
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


db.users.hasMany(db.deposits, {foreignKey: 'user', as: 'deposituser'})
db.users.hasMany(db.notifications, {foreignKey: 'user', as: 'notiuser'})
db.users.hasMany(db.withdrawals, {foreignKey: 'user', as: 'wthuser'})
db.users.hasMany(db.investments, {foreignKey: 'user', as: 'investmentuser'})
db.users.belongsTo(db.ups, {foreignKey: 'user', as: 'upuser'})
db.users.belongsTo(db.wallets, {foreignKey: 'user', as: 'walletuser'})

db.deposits.belongsTo(db.users, {foreignKey: 'user', as: 'deposituser'})
db.investments.belongsTo(db.users,  {foreignKey: 'user', as: 'investmentuser'})
db.notifications.belongsTo(db.users, {foreignKey: 'user', as: 'notituser'})
db.withdrawals.belongsTo(db.users, {foreignKey: 'user', as: 'wthuser'})
db.ups.belongsTo(db.users, {foreignKey: 'user', as: 'upuser'})
db.wallets.belongsTo(db.users, {foreignKey: 'user', as: 'walletuser'})

db.sequelize.sync({ force:  false }).then(() => console.log('Tables synced'))

module.exports = db