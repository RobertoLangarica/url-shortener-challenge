const router = require('express').Router();
const url = require('./url');
const visit = require('../visit/visit');

router.get('/:hash', async (req, res, next) => {
  // Querying only the desired fields
  const source = await url.getUrl({active: true, hash:req.params.hash},{_id:0, url:1});
  
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

router.get('/:hash/visits', async (req, res, next) => {
  // Querying for the visits
  const result = await url.getURLVisits(req.params.hash);
  
  if(result.success){
    res.json({visitsCount:result.data.length, visits:result.data});
    res.end();
  } else {
    //Error while retrieving the visits
    let e = new Error(result.message)
    e.status = 500; //internal error
    next(e);
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
  //Remove shortened URL if the remove token and the hash match
  let result = await url.deactivateURL(req.params.hash, req.params.removeToken)

  if(result.success){
    res.json(result);
    res.end();
  } else {
    // an error ocurred
    let error = new Error(result.message);
    error.status = 500; //internal error
    next(error);
  }
});

module.exports = router;
