var con = require('../metadata/config')

var connectDB = () => {
    con.connect(function(err) {
        if (err) {
            console.log(err)
            throw err;
        }
        console.log("Connected to MySQL!");
    });
}

module.exports = connectDB;