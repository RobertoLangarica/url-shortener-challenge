# URL Shortener Challenge

## Changes implemented in this Fork

#### * Change the uuid implementation for a shortening algorithm:
    - The main idea for the change was to use the previously existing uuid and transform that uuid into a single decimal. The decimal value was then converted to a string using a pre-existing character base (for url friendlyness).

    - For the shortening there is also a validation of preexisting shortened url's to avoid the further shortening of already shortened url's.

#### * Error management
    - The error management is enhaced or at least more controlled and the messages are more descriptives.

#### * Visits registry
    - Every time a shortened url is visited a "visit registry" is created in the DB. The resulting visits could be seen in the test script or consuming the endpoint: GET: [SERVER]/:hash/visits

#### * URL deletion
    - Using the pre-existing removeToken a logic deletion was implemented. The deleted urls are marked as removed and can't be further consumed. If there is a call to shortened a previous deleted url then the existing record is marked as active.

#### * Testing
    - Some auto testing was implemented using [MochaJs](https://mochajs.org/). Try it by runnint the test script `npm test`.


