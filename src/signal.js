/**
 * A signal between components
 *
 * The owning component of the signal instance should read it
 * once per tick, otherwise behavior may be unexpected.
 */
module.exports = function signal() {
	var s = 0;
	var pipes = [];

	var f = function() {
		s = 1;
		pipes.forEach(function(p) { p(); });
	};

	f.peek = function() {
		return s;
	};

	f.read = function() {
		var sv = s;
		s = 0;
		return sv;
	};

	f.pipe = function(s) {
		pipes.push(s);
	};

	f.fork = function() {
		var forked = signal();
		f.pipe(forked);
		return forked;
	};

	return f;
}

module.exports.join = function() {
	var signals = Array.prototype.slice.call(arguments);

	return function() {
		signals.forEach(function(s) { s(); });
	};
};
