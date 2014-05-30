/*
** Module dependencies
*/
var mongoose = require('mongoose');
var _ = require('lodash');
var Service = mongoose.model('Service');

/*
** Middlewares
*/
exports.service = function(req, res, next, id) {
    Service
        .findById(id)
        .populate('addedBy', 'fullName')
        .exec(function(err, service) {
            if (err) return next(err);
            if (!service) return res.send(404);
            req.service = service;
            next();
        });
};

/*
** Actions
*/
exports.list = function(req, res, next) {
    Service
        .find()
        .populate('addedBy', 'fullName')
        .exec(function(err, services) {
            if (err) return next(err);
            res.json(services);
        });
};

exports.create = function(req, res, next) {
    var service = new Service();
    service.set(_.pick(req.body, 'name', 'location', 'protocol'));
    service.addedBy = req.user;

    service.save(function(err) {
        if (err) return next(err);
        res.json(service);
    });
};

exports.show = function(req, res) {
    res.send(req.service);
};


exports.harvest = function(req, res, next) {
    req.service.harvest(function(err) {
        if (err) return next(err);
        res.send(req.service);
    });
};

exports.search = function(req, res, next) {
    if (!req.query.location) return res.send(400);
    Service.findByLocation(req.query.location).exec(function(err, services) {
        if (err) return next(err);
        res.json(services);
    });
};