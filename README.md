agent
=====

Clustered application creation toolkit

**agent** provides a simple API for communicating between nodes in a cluster:

- **publish/subcribe** - aka "events"
- **queue/process** - aka "job queue"
- **request/respond** - aka "REST"

Mix and match these patterns to create your own distributed application!

publish/subscribe
-----------------

**publisher.js**

```javascript
// Tell other nodes my name when I start.
var agent = require('agent')
  .use(require('agent-pubsub-redis'));

agent.publish('myname', 'agent99');
```

**subscriber.js**

```javascript
// Greet other nodes as they come up.
var agent = require('agent')
  .use(require('agent-pubsub-redis'));

agent.subscribe('myname', function(name) {
  console.log('hello, ' + name + '!');
});
```

queue/process
-------------

**order-sprocket.js**

```javascript
// Add sprocket request to a queue. These things take time.
var agent = require('agent')
  .use(require('agent-queue-amqp'));

var order = {
  type: 'sprocket-b',
  spokes: 5
};
agent.queue('orders', order);
console.log('Your order is processing!');
```

**make-sprockets.js**

```javascript
// Fulfill sprocket requests.
var agent = require('agent')
  .use(require('agent-queue-amqp'));

agent.process('orders', function(order, next) {
  makeSprocket(order, function(err, sprocket) {
    if (err) {
      next(err);
    }
    else {
      console.log('Created sprocket with id ' + sprocket.id);
      next();
    }
  });
});
```

request/respond
---------------

**serve-sprocket.js**

```javascript
// Create a sprocket service.
var agent = require('agent')
  .use(require('agent-req-http'))
  .use(require('agent-pubsub-redis'));

// "sprockets" will be our virtual host (for requests to agent://sprockets/...)
agent.respond('sprockets', function(router) {
  // router is a director router.
  // @see https://github.com/flatiron/director
  router.on('/:sprocketId', function(sprocketId) {
    // this.req and this.res are http.ServerRequest and http.serverResponse
    // respectively.
    // We also have convenience methods:
    //   - this.res.json(obj, statusCode, leaveOpen = false)
    //   - this.res.text(text, statusCode, leaveOpen = false)
    //   - this.res.html(html)
    // ...for setting the content-type and ending with that data.
    var self = this;
    db.sprockets.find({id: sprocketId}, function(err, sprocket) {
      self.res.json(sprocket);
    });
  });
});
```

**get-sprocket.js**

```javascript
// Request a sprocket from the sprocket service.
// Note that req-http middleware requires pubsub.
var agent = require('agent')
  .use(require('agent-req-http'))
  .use(require('agent-pubsub-redis'));

// Agent.request() is the same as github.com/mikeal/request, except
// it can handle the agent:// protocol, which uses virtual hosts defined
// with agent.respond(). json option defaults to true.
// @see https://github.com/mikeal/request
agent.request('agent://sprockets/af920c', function (error, response, body) {
  var sprocket = body;
  console.log(sprocket);
});
// Also usable with vanilla HTTP.
agent.request('http://icanhazip.com/', function (error, response, body) {
  console.log('my ip is: ' + body);
});
```