const uuidv4 = require('uuid/v4');
const { domain } = require('../../environment');
const SERVER = `${domain.protocol}://${domain.host}`;

const UrlModel = require('./schema');
const parseUrl = require('url').parse;
const validUrl = require('valid-url');

/**
 * Lookup for existant, active shortened URLs by the query provided.
 * 'null' will be returned when no matches were found.
 * @param {string} query any json object for the query for example a hash to lookup by hash{"hash":"value"}
 * @returns {object}
 */
async function getUrl(query, fieldProjection) {
  let source = await UrlModel.findOne({ active: true, ...query }, fieldProjection);
  return source;
}

/**
 * Generate an unique hash-ish- for an URL.
 * @param {string} id
 * @returns {string} hash
 */
function generateHash(url) {
  const  uuid = uuidv4();

  // lets convert the uuid to a decimal value
  const uuidDecimal = convertUUIDToDecimal(uuid);

  // converting the decimal to a hash string
  return generateHashFromDecimal(uuidDecimal);
}

/**
 * Convert the provided uuid to a decimal value
 * @returns {int} a decimal integer value 
 */
function convertUUIDToDecimal(uuid){
  // split in words (8-4-4-4-12)
  const s8   = uuid.substring(0,8);
  const s4_1 = uuid.substring(9,13);
  const s4_2 = uuid.substring(14,18);
  const s4_3 = uuid.substring(19,23);
  const s12  = uuid.substring(24,36);


  let uuidDecimal = 0;

  // first s8 half as the initial value, next s8 half subdivied in two and added with himself to be used as multiplier for the initial value
  // Max posibble value = 0xFFFF*0xFE01 = 0xFE0001FF
  uuidDecimal += parseInt(s8.substring(0,4), 16);
  uuidDecimal *= (parseInt(s8.substring(4,6), 16) * parseInt(s8.substring(6,8), 16));

  // adding the s4 first characters to use the result as a multiplier for the previous value
  //max value = 0xFE0001FF * 0xF0 = 0xEE2001DF10
  uuidDecimal *= (parseInt(s4_1.substring(0,1), 16) + parseInt(s4_2.substring(0,1), 16) + parseInt(s4_3.substring(0,1), 16) + parseInt(s4_1.substring(1,2), 16))<<2;

  // Helper function that takes every character and multiply that character with an initial value (every new multiplication is added to the result)
  const multiplyString = (target)=>{
    let result = 1;
    let characterValue;
    for(let i = 0; i < target.length; i++){
      //avoid zero multiplication
      characterValue = parseInt(target.charAt(i),16);
      result *= characterValue == 0 ? (i+1) : characterValue;
    }
    return result;
  }
  
 //max value: (0xC5C1 + 0xC5C1 + 0xC5C1) = 0x25143
  uuidDecimal += ( multiplyString(s4_1) + multiplyString(s4_2) + multiplyString(s4_3));

  // split s12 in six parts and add the resulting numbers
  // max: 0xFF + 0x3FC +0xFF0 + 0x3FC0 + 0xFF00 + 0x3FC00 = 0x54FAB
  const cont = s12.length;
  for(let i = 0; i < cont; i+=2){
    // left shifting i times so we can have a position based pow of 2 for this part
    uuidDecimal += parseInt(s12.substring(i,i+2), 16)<<i;
  }

  //Max posible value = 0xEE20097FFE
  return uuidDecimal;
}

/**
 * Generate a URL friendly hash from a decimal integer value
 * @param {numer} value base10 integer number
 */
function generateHashFromDecimal(value){
  // randomized array of characters containing: [0-9],[a-z],[A-Z],[-_]
  let characters = ['_','J','a','H','Q','1','K','-','0','p','F','h','5','Z','e','W','T','v','X','l','V','9','x',
          'q','L','c','P','g','z','f','w','6','U','r','B','D','S','R','7','d','C','n','k','b','I','A','j','s','N',
          'o','t','G','M','O','i','2','8','Y','E','3','y','4','m','u']; 
  const base = characters.length;
  
  let result = "";

  while(value > 0){
    result += characters[value%base];
    value = Math.floor(value/base);
  }

  return result;
}
/**
 * Generate a random token that will allow URLs to be (logical) removed
 * @returns {string} uuid v4
 */
function generateRemoveToken() {
  return uuidv4();
}

/**
 * Create an instance of a shortened URL in the DB.
 * Parse the URL destructuring into base components (Protocol, Host, Path).
 * An Error will be thrown if the URL is not valid or saving fails.
 * @param {string} url
 * @param {string} hash
 * @returns {object}
 */
async function shorten(url) {

  if (!isValid(url)) {
    throw new Error(`Invalid URL`);
  }

  //Avoid duplications
  let previousURL = await getUrl({url:url});
  
  if(previousURL != null){
    return {
      url,
      shorten: `${SERVER}/${previousURL.hash}`,
      hash:previousURL.hash,
      removeUrl: `${SERVER}/${previousURL.hash}/remove/${previousURL.removeToken}`,
      created: false
    };
  }

  // Get URL components for metrics sake
  const urlComponents = parseUrl(url);
  const protocol = urlComponents.protocol || '';
  const domain = `${urlComponents.host || ''}${urlComponents.auth || ''}`;
  const path = `${urlComponents.path || ''}${urlComponents.hash || ''}`;

  // Generate a token that will alow an URL to be removed (logical)
  const removeToken = generateRemoveToken();
  //Generate the hash
  const hash = generateHash(url);

  // Create a new model instance
  const shortUrl = new UrlModel({
    url,
    protocol,
    domain,
    path,
    hash,
    isCustom: false,
    removeToken,
    active: true
  });

  const saved = await shortUrl.save();
  // TODO: Handle save errors

  return {
    url,
    shorten: `${SERVER}/${hash}`,
    hash,
    removeUrl: `${SERVER}/${hash}/remove/${removeToken}`,
    created: true
  };

}

/**
 * Deactivate the url that matches the hash and removeToken, 
 * it is only marked with active:false
 * @param {string} hash 
 * @param {string} removeToken 
 */
async function deactivateURL(hash, removeToken){
  try{
    //let result = await UrlModel.findOneandupdate({hash:hash, removeToken: removeToken},{$set: {active:false}}, {new:true, fields:{active:1}});
    let update = await UrlModel.update({hash:hash, removeToken: removeToken},{$set: {active:false}}, {multi:false, upsert:false});
    
    let result = {};
    if(update.ok){
      result.success = true;

      if(update.n){
        // the url with the hash and removeToken exist in the database
        result.message = 'URL succesfully deactivated.';
      } else {
        // no matching url
        result.message = 'There is no matching URL for the provided hash and removeToken.'
      }
    } else {
      throw new Error('A problem ocurred while trying to update the URL document on the DB.');
    }
  
    return result;
  }
  catch(e){
    return {success: false, message:e.message}
  }
}

/**
 * Validate URI
 * @param {any} url
 * @returns {boolean}
 */
function isValid(url) {
  return validUrl.isUri(url);
}

module.exports = {
  shorten,
  getUrl,
  generateHash,
  generateRemoveToken,
  isValid,
  convertUUIDToDecimal,
  deactivateURL
}
