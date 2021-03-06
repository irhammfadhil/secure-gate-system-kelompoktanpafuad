var db = require('../config/databases');
var response = require('./response');
const moment = require('moment');
const bcrypt = require('bcrypt');
const saltRounds = 10;
// var Users = [];

exports.index = function(req, res, next) {
    res.render('dashboard/index', { path: "/"});
};

// page user
exports.addUser = function(req, res, next) {
    res.render('dashboard/users/index');
};

exports.editUser = function(req, res, next) {
    res.render('dashboard/users/edit');
};

// page gate
exports.addGate = function(req, res, next) {
    res.render('dashboard/gates/index');
};

exports.editGate = function(req, res, next) {
    res.render('dashboard/gates/edit');
};

// page role
exports.addRole = function(req, res, next) {
    res.render('dashboard/roles/index');
};

exports.editRole = function(req, res, next) {
    res.render('dashboard/roles/edit');
};

// page login
exports.loginPage = function(req, res, next) {
    db.query('SELECT * FROM gates', function(error, result, fields) {
        // console.log(result[0]);
        if(error) {
            console.log(error);
        } else {
            res.render('auth/login', { rules : result });
        }
    });
};

function insertLog(des, gate_id, user_id){
    db.query('INSERT INTO logs (description, gate_id, user_id) VALUES (?, ?, ?)', [ des, gate_id, user_id ]);
}

exports.login = function(req, res, next) {
    var nrp = req.body.nrp;
    var password = req.body.password;
    var gate_id = req.body.gates;
    if(!nrp || !password || !gate_id){
        res.render('auth/login', { message: "Please Enter NRP and Password" });
    } else {
        db.query('SELECT * FROM users WHERE nrp = ?', [nrp], function(error, result, fields) {
            if(result.length == 1) {
                var user_id = result[0].user_id;
                var hash = result[0].password;
                var pass = bcrypt.compareSync(password, hash);
                if(pass) {
                    db.query('SELECT * FROM rules where user_id = ? and gate_id = ?', [ user_id, gate_id ],
                    function (error, result, fields){
                        if(error){
                            console.log(error)
                        }
                        if(result.length == 1) {
                            // console.log('masuk result');
                            var start = result[0].start;
                            var finish = result[0].finish;
                            var today = new Date();
                            var timeToday = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
                            if(moment.duration(start) < moment.duration(timeToday) &&  moment.duration(finish) > moment.duration(timeToday)){
                                req.session.loggedin = true;
                                req.session.nrp = nrp;
                                req.session.user_id = user_id;
                                req.session.gate_id = gate_id;
                                var status = "Login Success!"
                                insertLog(status, gate_id, user_id);
                                response.ok(status,res);
                            } else {
                                var status = "Gate Closed!"
                                insertLog(status, gate_id, user_id);
                                response.ok(status,res);
                            }
                            
                        } else {
                            var status = "Dont Have Access!"
                            insertLog(status, gate_id, user_id);
                            response.ok(status,res);
                        }
                    });
                } else {
                    var status = "Password Salah!"
                    insertLog(status, gate_id, user_id);
                    response.ok(status,res);
                }
            } else {
                var status = "User Not Found!"
                insertLog(status, gate_id, user_id);
                response.ok(status,res);
            }
        });
    }
};

// page register
exports.registerPage = function(req, res, next) {
    res.render('auth/register');
};

exports.register = function(req, res, next) {
    var nrp = req.body.nrp;
    var password = req.body.password;
    if(!nrp || !password){
        res.status("400");
        res.send("Invalid details!");
     } else {
        var hash = bcrypt.hashSync(password, saltRounds);
        db.query('INSERT INTO users (nrp, password) VALUES (?,?)', [nrp, hash], function(error, result, fields) {
            console.log(req.session.logedin);
            if(error) {
                res.render('auth/register', { message: "User Already Exists! Login or choose another NRP"});
            } else {
                req.session.loggedin = true;
                req.session.nrp = nrp;
                res.redirect('/');
            }
        });
     }
};

// logout
exports.logout = function(req, res){
    var user_id = req.session.user_id;
    var gate_id = req.session.gate_id;
    var status = "Logged Out!"
    insertLog(status, gate_id, user_id);
    response.ok(status,res);
};