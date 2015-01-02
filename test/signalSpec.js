require('should');
var signal = require('../src/signal');

describe('Signals', function() {
	it('should set a piped signal', function() {
		var s = signal();
		var piped = signal();

		s.pipe(piped);

		s();

		piped.read().should.eql(1);
	});

	it('should set forked signal', function() {
		var s = signal();
		var fork = s.fork();

		s();

		fork.read().should.eql(1);
	});
});
