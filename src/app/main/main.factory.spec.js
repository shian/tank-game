'use strict';

describe('Service: main.factory', function () {

  // load the service's module
  beforeEach(module('stankApp'));

  // instantiate service
  var main.factory;
  beforeEach(inject(function (_main.factory_) {
    main.factory = _main.factory_;
  }));

  it('should do something', function () {
    expect(!!main.factory).toBe(true);
  });

});
