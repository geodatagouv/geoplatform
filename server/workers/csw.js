var _ = require('lodash');
var csw = require('csw');
var mongoose = require('../mongoose');
var Record = mongoose.model('Record');
var Service = mongoose.model('Service');
var util = require('util');

function harvestService(service, job, done) {
    var client = csw(service.location, {
        maxSockets: job.data.maxSockets || 5,
        keepAlive: true,
        retry: job.data.maxRetry || 3,
        userAgent: 'Afigeo CSW harvester'
    });

    var harvester = client.harvest({
        mapper: 'iso19139',
        namespace: 'xmlns(gmd=http://www.isotc211.org/2005/gmd)'
    });

    var total;

    harvester.on('error', function(err) {
        job.log(JSON.stringify(err));
        console.log(util.inspect(err, { showHidden: true, depth: null }));
    });

    harvester.on('start', function(stats) {
        total = stats.matched;
        job.log(JSON.stringify(stats));
    });

    harvester.on('page', function(infos) {
        if (infos.announced < infos.found) {
            total -= (infos.announced - infos.found);
            job.log('Notice: %d records found of %d announced!', infos.found, infos.announced);
        }
    });

    harvester.on('end', function(err, stats) {
        if (stats) job.log(JSON.stringify(stats));
        service
            .set('harvesting.state', err ? 'error' : 'idle')
            .set('harvesting.jobId', null)
            .set('items', stats.returned)
            .save(function(err) {
                if (err) return done(err);
                done();
            });
    });

    harvester.on('record', function(data) {
        var record = data.record;
        job.progress(data.stats.returned, total);

        if (!record.fileIdentifier) {
            job.log('Dropping 1 record!');
            return;
        }

        var query = { 
            identifier: record.fileIdentifier,
            parentCatalog: service.id
        };

        var metadata = _.pick(record, [
            'title',
            'abstract',
            'type',
            'representationType',
            'keywords',
            'onlineResources'
        ]);

        var update = { $set: { metadata: metadata }};

        Record.findOneAndUpdate(query, update, { upsert: true }, function(err) {
            if (err) console.log(err);
        });
        
    });
}

exports.harvest = function(job, done) {
    Service.findById(job.data.serviceId, function(err, service) {
        if (err) return done(err);
        if (!service) return done(new Error('Unable to fetch service ' + job.data.serviceId));
        if (!service.harvesting.enabled) return done(new Error('Harvesting is disabled for service ' + job.data.serviceId));
        if (service.harvesting.state !== 'queued') return done(new Error('Unconsistent state for service ' + job.data.serviceId));
        if (service.harvesting.jobId != parseInt(job.id)) return done(new Error('Unconsistent jobId for service ' + job.data.serviceId));

        setTimeout(function() {
            service
                .set('harvesting.state', 'processing')
                .save(function(err) {
                    if (err) return done(err);
                    harvestService(service, job, done);
                });
        }, 2000);
    });
};
