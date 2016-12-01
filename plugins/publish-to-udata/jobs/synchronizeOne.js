const mongoose = require('mongoose');
const Dataset = mongoose.model('Dataset');

module.exports = function (job, jobDone) {
    const { recordId, organizationId } = job.data;
    let { action } = job.data;

    Dataset.findById(recordId).exec()
      .then(foundPublicationInfo => {
        if (!foundPublicationInfo && action && ['update', 'unpublish'].includes(action)) {
          throw new Error('Cannot update or unpublish a non published dataset');
        }
        if (foundPublicationInfo && !action) {
          action = 'update';
        }
        if (!foundPublicationInfo && !action) {
          action = 'publish';
        }

        const publicationInfo = foundPublicationInfo || new Dataset({ _id: recordId, 'publication.organization': organizationId });

        return publicationInfo[action]()
          .catch(err => {
            if (err.message === 'Unchanged dataset') {
              job.log('Unchanged dataset');
              return;
            }
            throw err;
          });
      })
      .thenReturn()
      .then(jobDone)
      .catch(err => {
        if (err.status && err.response) {
          job.log(`Error ${err.status}`);
          job.log(err.response.body);
        }
        jobDone(err);
      });
};