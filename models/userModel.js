module.exports = (sequelize, DataTypes) => {
    return sequelize.define('user', {
        image: {type: DataTypes.STRING, allowNull: false},
        country_flag: {type: DataTypes.STRING, allowNull: false},
        full_name: {type: DataTypes.STRING, allowNull: false},
        username: {type: DataTypes.STRING, allowNull: false},
        role: {type: DataTypes.STRING, allowNull: false, defaultValue: 'user'},
        email: {type: DataTypes.STRING, allowNull: false},
        country: {type: DataTypes.STRING, allowNull: false},
        tradersCode: {type: DataTypes.STRING, allowNull: false},
        email_verified: {type: DataTypes.STRING, allowNull: true, defaultValue: 'false'},
        resetcode: {type: DataTypes.STRING, allowNull: true},
        password: {type: DataTypes.STRING, allowNull: false},
    })
}