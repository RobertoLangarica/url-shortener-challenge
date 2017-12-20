var axios = require('axios');

let hashForTest;
let removeTokenForTest;

describe('SHORTENING:', function(){

    describe('#Shortening an invalid url',function(){
        it('Should return a status 400 for bad request', function(done){
            let body = {url: 'com'};
            axios.post('http://localhost:3000/',body)
            .then(response=>{
                done(new Error(`It shouldn't be possible to shorten an invalid url`));
            })
            .catch(e=>{
                if(e.response && e.response.status == 400){
                    done();
                } else{
                    done(e);
                }
            });
        });
    });

    describe('#Shortening a valid url',function(){
        it('Should save the shortened url and return the result', function(done){
            let body = {url: 'https://www.villavanilla.com'};
            axios.post('http://localhost:3000/',body)
            .then(response=>{
                // for future tests
                hashForTest = response.data.hash;
                const splitted = response.data.removeUrl.split('/');
                removeTokenForTest = splitted[splitted.length-1];
                done();
            })
            .catch(e=>{
                done(e);
            });
        });
    });

    describe('#Shortening an existing url',function(){
        it('Should succeed but returning a creting:false for the shortened url', function(done){
            let body = {url: 'https://www.villavanilla.com'};
            axios.post('http://localhost:3000/',body)
            .then(response=>{
                if(response.data.created !== undefined && !response.data.created){
                    done();
                } else {
                    done(new Error('There should be no document creation after duplicating a url.'));
                }
            })
            .catch(e=>{
                done(e);
            });
        });
    });
});


describe('CONSUMPTION:', function(){
    describe('#Unhandled route',function(){
        it('Should receive a 404', function(done){
            axios.get('http://localhost:3000/no_route/')
            .then(response=>{
                done(new Error('The route provided is being handled.'));
            })
            .catch(e=>{
                if(e.response && e.response.status == 404){
                    done();
                } else{
                    done(e);
                }
            });
        });
    });

    describe('#Navigate to a shortened URL',function(){
        it('Should be redirected to the complete URL',function(done){
            // var hashForTest = '-1wYvl';
            axios.get(`http://localhost:3000/${hashForTest}`)
            .then(response=>{
                done();
            })
            .catch(e=>{
                done(e);
            });
        });
    });

    describe('#Navigate to an inexistent shortened URL',function(){
        it('Should receive a 404',function(done){
            axios.get(`http://localhost:3000/${hashForTest}NotValid`)
            .then(response=>{
                done(new Error(`Shouldn't be possible to navigate to an inexistent shortened url`));
            })
            .catch(e=>{
                if(e.response && e.response.status == 404){
                    done();
                } else{
                    done(e);
                }
            });
        });
    });
});

describe('DELETION:', function(){

    describe('#Without a removeToken', function(done){
        it('Should receive a 404',function(done){
            axios.delete(`http://localhost:3000/${hashForTest}/remove/`)
            .then(response=>{
                done(new Error(`Shouldn't be successfull to delete without remove token.`));
            })
            .catch(e=>{
                if(e.response && e.response.status == 404){
                    done();
                } else{
                    done(e);
                }
            });
        });
    });

    describe('#With an incorrect removeToken', function(done){
        it('Should succeed but it indicate a remove:false',function(done){
            axios.delete(`http://localhost:3000/${hashForTest}/remove/${removeTokenForTest}NoValid`)
            .then(response=>{
                if(response.data.removed !== undefined && !response.data.removed){
                    done();
                } else {
                    done(new Error(`The "removed" value from the response is not what was expected.`));
                }
            })
            .catch(e=>{
                done(e);
            });
        });
    });

    describe('#With an incorrect hash', function(done){
        it('Should succeed but it indicate a remove:false',function(done){
            axios.delete(`http://localhost:3000/${hashForTest}NoValid/remove/${removeTokenForTest}`)
            .then(response=>{
                if(response.data.removed !== undefined && !response.data.removed){
                    done();
                } else {
                    done(new Error(`The "removed" value from the response is not what was expected.`));
                }
            })
            .catch(e=>{
                done(e);
            });
        });
    });


    describe('#Correct hash and removeToken', function(done){
        it(`Should succeed and indicate a remove:true`,function(done){
            axios.delete(`http://localhost:3000/${hashForTest}/remove/${removeTokenForTest}`)
            .then(response=>{
                if(response.data.removed !== undefined && response.data.removed){
                    done();
                } else {
                    done(new Error(`The "removed" value from the response is not what was expected.`));
                }
            })
            .catch(e=>{
                done(e);
            });
        });
    });

    describe('#Navigate to a shortened URL after deletion',function(){
        it('Should receive a 404',function(done){
            axios.get(`http://localhost:3000/${hashForTest}`)
            .then(response=>{
                done(new Error(`Shouldn't be possible to navigate to an eliminated shortened url`));
            })
            .catch(e=>{
                if(e.response && e.response.status == 404){
                    done();
                } else{
                    done(e);
                }
            });
        });
    });

    describe('#Shortening a previously deleted url',function(){
        it('Should succeed but returning a creting:false since the url was only logically removed', function(done){
            let body = {url: 'https://www.villavanilla.com'};
            axios.post('http://localhost:3000/',body)
            .then(response=>{
                if(response.data.created !== undefined && !response.data.created){
                    done();
                } else {
                    done(new Error('There should be no document creation after duplicating a url.'));
                }
            })
            .catch(e=>{
                done(e);
            });
        });
    });
});

describe('VISITS:', function(){
    describe('#Consuming the visits from a shortened url',function(){
        it('Should receive a visitsCount and an array of visits', function(done){
            axios.get(`http://localhost:3000/${hashForTest}/visits`)
            .then(response=>{
                if(response.data.visits && response.data.visitsCount){
                    done();
                } else {
                    done(new Error(`The data expected wasn't received.`));
                }
            })
            .catch(e=>{
                done(e);
            });
        });
    });
});