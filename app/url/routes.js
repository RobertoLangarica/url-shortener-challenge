const router = require('express').Router();
const url = require('./url');
const visit = require('../visit/visit');

router.get('/:hash', async (req, res, next) => {
  // Querying only the desired fields
  const source = await url.getUrl({hash:req.params.hash},{_id:0, url:1});
  
  if(source != null){
    // Register visit
    visit.registerVisit(source.url, req.params.hash);

    // Behave based on the requested format using the 'Accept' header.
    // If header is not provided or is */* redirect instead.
    const accepts = req.get('Accept');

    switch (accepts) {
      case 'text/plain':
        res.end(source.url);
        break;
      case 'application/json':
        res.json(source);
        break;
      default:
        res.redirect(source.url);
        break;
    }
  } else {
    //Responding with a 404 when the hash wasn't found
    res.status(404);
    next();
  }
});

router.post('/', async (req, res, next) => {

  //Validate 'req.body.url' presence
  if(!req.body.url){
    const e = new Error();
    e.status = 400; // bad request
    e.message = `An ERROR ocurred: It is necessary to provide an 'url' field to be shortened.`;
    next(e);
    return;
  }

  try {
    let shortUrl = await url.shorten(req.body.url);
    res.json(shortUrl);
  } catch (e) {
    // TODO: Personalized Error Messages
    next(e);
  }
});


router.delete('/:hash/remove/:removeToken', async (req, res, next) => {
  // TODO: Remove shortened URL if the remove token and the hash match
  let notImplemented = new Error('Not Implemented');
  notImplemented.status = 501;
  next(notImplemented);
});

module.exports = router;
