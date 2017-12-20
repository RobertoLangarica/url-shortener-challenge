const VisitModel = require('./schema');

/**
 * Create a new visit record for the hash and url provided
 * @param {string} url
 * @param {string} hash
 * @returns {boolean}
 */
async function registerVisit(url, hash) {
    // new visit instance
    const visit = new VisitModel({
        url,
        hash,
    });

    try
    {
    const saved = await visit.save();
    }
    catch(e){
        console.log('UNABLE TO SAVE THE VISIT');
        console.log(e.message);
    }
    // TODO: Handle save errors

    return true;
  }

  module.exports = {
    registerVisit,
  }