var should = require('should');
var logic = require('../src/logic');
var signal = require('../src/signal');

should.Assertion.add('passTruthTest', function(inputs, outputs) {
	this.params = { operator: 'should pass truth table check' };

	var result = tester(this.obj, inputs, outputs);
	result.should.eql(outputs);

	function tester(component, inputs, outputs) {
		var results = [];
		for(var i = 0; i < inputs.length; i++) {
			var input = inputs[i];
			var expected = outputs[i];

			//send power
			component.inputs.in();

			//setup output signals
			for(var k in expected) {
				component.outputs[k] = signal();
			}

			//send the inputs
			for(var k in input) {
				if(input[k] == 1) {
					component.inputs[k]();
				}
			}

			//update internal state to get outputs
			component.update();

			var result = { };
			for(var k in expected) {
				result[k] = component.outputs[k].read();
			}

			results.push(result);
		}

		return results;
	}


}, false);

describe('Logic and components', function() {
	describe('Logic truth table checks', function() {
		it('relay with default off', function() {
			logic.relay().should.passTruthTest([
				{ toggle: 0 },
				{ toggle: 1 }
			], [
				{ out: 0 },
				{ out: 1 }
			]);
		});

		it('relay with default on', function() {
			logic.relay(true).should.passTruthTest([
				{ toggle: 0 },
				{ toggle: 1 }
			], [
				{ out: 1 },
				{ out: 0 }
			]);
		});

		it('NOR gate', function() {
			logic.NOR().should.passTruthTest([
				{ a: 0, b: 0 },
				{ a: 0, b: 1 },
				{ a: 1, b: 0 },
				{ a: 1, b: 1 }
			], [
				{ out: 1 },
				{ out: 0 },
				{ out: 0 },
				{ out: 0 }
			]);
		});

		it('AND gate', function() {
			logic.AND().should.passTruthTest([
				{ a: 0, b: 0 },
				{ a: 0, b: 1 },
				{ a: 1, b: 0 },
				{ a: 1, b: 1 }
			], [
				{ out: 0 },
				{ out: 0 },
				{ out: 0 },
				{ out: 1 }
			]);
		});

		it('NAND gate', function() {
			logic.NAND().should.passTruthTest([
				{ a: 0, b: 0 },
				{ a: 0, b: 1 },
				{ a: 1, b: 0 },
				{ a: 1, b: 1 }
			], [
				{ out: 1 },
				{ out: 1 },
				{ out: 1 },
				{ out: 0 }
			]);
		});

		it('decoder', function() {
			logic.decoder().should.passTruthTest([
				{ a: 0, b: 0 },
				{ a: 0, b: 1 },
				{ a: 1, b: 0 },
				{ a: 1, b: 1 }
			], [
				{ i: 1, j: 0, k: 0, l: 0 },
				{ i: 0, j: 1, k: 0, l: 0 },
				{ i: 0, j: 0, k: 1, l: 0 },
				{ i: 0, j: 0, k: 0, l: 1 }
			]);
		});
	});

	describe('Component piping helper', function() {
		it('should take inputs when piping from first component', function() {
			var a = logic.relay();
			var c = logic.component.pipe(a, logic.relay(), { out: 'in' });

			c.inputs.in();
			a.inputs.in.read().should.eql(1);
		});

		it('should pipe output into the expected input signal', function() {
			var a = logic.relay();
			var b = logic.relay();
			var c = logic.component.pipe(a, b, { out: 'in' });

			c.inputs.in();
			c.inputs.toggle();

			//manually update child component `a` as updating
			//`c` would cause `b` to read the signals and thus fail
			a.update();

			b.inputs.in.read().should.eql(1);
		});

		it('should have correct output from piped component', function() {
			var b = logic.relay();
			var c = logic.component.pipe(logic.relay(), b, { out: 'in' });

			c.inputs.in();
			c.inputs.toggle();
			b.inputs.toggle();

			c.update();

			c.outputs.out.read().should.eql(1);
		});

		it('should take extra inputs from second to piped component', function() {
			var p = signal();

			var a = logic.relay(true);
			var b = logic.AND();
			var c = logic.component.pipe(a, b, { out: 'a' }, { in: p });

			//send power
			p();

			//this input comes from the AND gate, so calling it should work
			c.inputs.b();

			c.update();

			//this should be 1 because the relay signal goes to `a` and
			//we manually toggled the `b` input
			c.outputs.out.read().should.eql(1);
		});
	});
});
