module.exports = (sequelize, DataTypes) => {
    return sequelize.define('user', {
        image: {type: DataTypes.STRING, allowNull: true},
        country_flag: {type: DataTypes.STRING},
        full_name: {type: DataTypes.STRING},
        username: {type: DataTypes.STRING},
        role: {type: DataTypes.STRING, defaultValue: 'user'},
        email: {type: DataTypes.STRING},
        country: {type: DataTypes.STRING},
        referral_code: {type: DataTypes.STRING, allowNull: true},
        email_verified: {type: DataTypes.STRING, allowNull: true, defaultValue: 'false'},
        resetcode: {type: DataTypes.STRING, allowNull: true},
        password: {type: DataTypes.STRING},
    })
}