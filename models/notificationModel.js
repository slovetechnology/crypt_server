module.exports = (sequelize, DataTypes) => {
    return sequelize.define('notification', {
        user: {type: DataTypes.INTEGER},
        title: {type: DataTypes.STRING},
        content: {type: DataTypes.STRING},
        read: {type: DataTypes.STRING, defaultValue: 'false'},
        status: {type: DataTypes.STRING, allowNull: true}, 
        URL: {type: DataTypes.STRING, allowNull: true}, 
    })
}