var signal = require('./signal');

function defaultSignals(a, defaults) {
	var obj = { };

	for(var k in a) {
		obj[k] = a[k];
	}

	for(var k in defaults) {
		if(obj[k] === undefined) {
			var s = signal();
			s.pipe(defaults[k]);
			obj[k] = s;
		}
	}

	return obj;
}


var component = {
	pipe: function(a, b, io, other) {
		for(var k in io) {
			a.outputs[k].pipe(b.inputs[io[k]]);
		}

		for(var k in other) {
			other[k].pipe(a.inputs[k]);
			other[k].pipe(b.inputs[k]);
		}

		var inputs = defaultSignals(a.inputs, b.inputs);
		var outputs = defaultSignals(b.outputs, a.outputs);

		return {
			inputs: inputs,
			outputs: outputs,

			update: function() {
				a.update();
				b.update();
			}
		};
	}
};


function relay(defaultOn) {
	return {
		inputs: {
			in: signal(),
			toggle: signal()
		},
		outputs: {
			out: signal()
		},
		update: function() {
			var power = this.inputs.in.read();
			var toggled = this.inputs.toggle.read();

			if(power && defaultOn && !toggled) {
				this.outputs.out();
			}
			else if(power && toggled && !defaultOn) {
				this.outputs.out();
			}
		}
	}
}

function NORGate() {
	var p = signal();

	var b = relay(true);
	var a = component.pipe(
		component.pipe(relay(true), relay(), { out: 'toggle' }, { in: p }),
		b, { out: 'in' }
	);

	return {
		inputs: {
			in: p,
			a: a.inputs.toggle,
			b: b.inputs.toggle
		},

		outputs: {
			out: signal()
		},

		update: function() {
			a.update();

			if(a.outputs.out.read()) {
				this.outputs.out();
			}
		}
	};
}

function decoder() {
	var p = signal();

	var i = NORGate();
	p.pipe(i.inputs.in);

	var j = component.pipe(relay(true), ANDGate(), { out: 'a' }, { in: p });

	var k = component.pipe(relay(true), ANDGate(), { out: 'b' }, { in: p });

	var l = ANDGate();
	p.pipe(l.inputs.in);

	return {
		inputs: {
			in: p,
			a: signal.join(i.inputs.a, j.inputs.toggle, k.inputs.a, l.inputs.a),
			b: signal.join(i.inputs.b, j.inputs.b, k.inputs.toggle, l.inputs.b)
		},
		outputs: {
			i: signal(),
			j: signal(),
			k: signal(),
			l: signal()
		},

		update: function() {
			i.update();
			j.update();
			k.update();
			l.update();

			if(i.outputs.out.read()) {
				this.outputs.i();
			}
			if(j.outputs.out.read()) {
				this.outputs.j();
			}
			if(k.outputs.out.read()) {
				this.outputs.k();
			}
			if(l.outputs.out.read()) {
				this.outputs.l();
			}
		}
	};
}

function ANDGate() {
	var in1 = relay();
	var in2 = relay();

	in1.outputs.out = in2.inputs.in;
	in2.outputs.out = signal();

	return {
		inputs: {
			in: in1.inputs.in,
			a: in1.inputs.toggle,
			b: in2.inputs.toggle
		},

		outputs: {
			out: signal()
		},

		update: function() {
			in1.update();
			in2.update();

			if(in2.outputs.out.read()) {
				this.outputs.out();
			}
		}
	};
}

function NANDGate() {
	var and = ANDGate();
	var not = relay(true);

	and.outputs.out = not.inputs.toggle;
	not.outputs.out = signal();

	return {
		inputs: {
			in: signal.join(and.inputs.in, not.inputs.in),
			a: and.inputs.a,
			b: and.inputs.b
		},

		outputs: { out: null },

		update: function() {
			and.update();
			not.update();

			if(not.outputs.out.read()) {
				this.outputs.out();
			}
		}
	};
}


module.exports = {
	relay: relay,
	component: component,
	decoder: decoder,
	NOR: NORGate,
	AND: ANDGate,
	NAND: NANDGate
};
