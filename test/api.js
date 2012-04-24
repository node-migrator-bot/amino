var assert = require('assert');

function inArray(val, arr) {
  var i = arr.length;
  while (i--) {
    if (arr[i] === val) {
      return true;
    }
  }
  return false;
}

describe('agent', function() {
  var agent = require('../').init();
  agent.on('error', function(err) {
    throw err;
  });
  afterEach(function() {
    if (agent) {
      agent.reset();
    }
  });

  describe('publish/subscribe', function() {
    it('should only receive from the subscribed event', function(done) {
      var left = 2;
      var letters = ['A', 'B'];
      agent.on('subscribe', function(channel, count) {
        if (channel === 'alphabet') {
          agent.publish('nonsense', 'aefae');
          agent.publish('alphabet', 'A');
          agent.publish('nonsense', '23523');
          agent.publish('nonsense', 'awfad');
          agent.publish('alphabet', 'B');
        }
      });
      agent.subscribe('alphabet', function(letter) {
        if (inArray(letter, letters)) {
          if (!--left) {
            done();
          }
        }
        else {
          assert.fail(letter, letters, 'Letter not in list', 'in');
        }
      });
    });

    it('can handle objects', function(done) {
      agent.on('subscribe', function(channel, count) {
        if (channel === 'objects') {
          agent.publish('objects', {jorge: 'Ben'});
        }
      });
      agent.subscribe('objects', function(data) {
        assert.strictEqual(data.jorge, 'Ben', 'object properties can be accessed on sub');
        done();
      });
    });
  });

  describe('queue/process', function() {
    it('should only receive from the subscribed queue', function(done) {
      var left = 4;
      var beatles = ['Ringo', 'John', 'Paul', 'George'];
      agent.queue('u2', 'Bono');
      agent.queue('jimi', 'Hendrix');
      agent.queue('mamas', 'Cass');
      agent.queue('beatles', 'John');
      agent.queue('beatles', 'George');
      agent.queue('cream', 'Eric');
      agent.queue('beatles', 'Paul');

      agent.process('beatles', function(data, next) {
        if (inArray(data, beatles)) {
          if (!--left) {
            done();
          }
        }
        else {
          assert.fail(data, beatles, 'Name not in list', 'in');
        }
        next();
      });

      agent.queue('beatles', 'Ringo');
    });

    it('should be able to handle objects', function(done) {
      agent.queue('jazz', {name: 'Bill Evans'});

      agent.process('jazz', function(data, next) {
        assert.strictEqual(data.name, 'Bill Evans', 'Object property can be accessed');
        done();
      });
    });
  });

  describe('request/respond', function() {
    describe('GET', function() {
      before(function(done) {
        agent.respond('math.edu', function(router) {
          router.get('/square/:input', function(input) {
            var data = Math.pow(input, 2);
            this.res.writeHead(200, {'Content-Type': 'application/json'});
            this.res.end(JSON.stringify(data));
          });

          router.get('/meaning-of-life', function() {
            var data = "Can't calculate!";
            this.res.writeHead(500, {'Content-Type': 'application/json'});
            this.res.end(JSON.stringify(data));
          });
        }, function(host, port) {
          done();
        });
      });
      it('returns correct answer', function(done) {
        var input = Math.round(100 * Math.random());
        var url = 'agent://math.edu/square/' + input;

        agent.request(url, function(err, res, data) {
          assert.strictEqual(data, input * input, 'Square correctly returned');
          done(err);
        });
      });

      it('returns 404', function(done) {
        var input = 100 * Math.random();
        var url = 'agent://math.edu/round?input=' + input;

        agent.request(url, function(err, res, data) {
          assert.strictEqual(data, 'Page not found', 'res.data is error message');
          assert.strictEqual(res.statusCode, 404, 'res.code is 404');
          assert.ifError(err);
          done();
        });
      });

      it('returns 500', function(done) {
        var url = 'agent://math.edu/meaning-of-life';

        agent.request(url, function(err, res, data) {
          assert.strictEqual(data, "Can't calculate!", 'res.data is error message');
          assert.strictEqual(res.statusCode, 500, 'res.code is 500');
          assert.ifError(err);
          done();
        });
      });

      it('can transparently serialize/unserialize JSON');
    });
  });
});
