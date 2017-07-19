
// Creates an array whose mutating methods
// have been overridden to notify of changes
function makeChangingArray(val, changed) {
	var arr = Object.create(val, {
		push: {value: (...args) => {
			val.push(...args);
			changed();
		}},
		pop: {value: (...args) => {
			val.pop(...args);
			changed();
		}},
		shift: {value: (...args) => {
			val.shift(...args);
			changed();
		}},
		unshift: {value: (...args) => {
			val.unshift(...args);
			changed();
		}},
	});
	return arr;
}

function makeChangingObject(state, onChange) {
	var deep = Object.create(null);
	return new Proxy(state, {
		get: (obj, key) => {
			if(key in deep) {
				return deep[key];
			}
			var val = Reflect.get(obj, key);
			if(val instanceof Array) {
				deep[key] = makeChangingArray(
					val,
					() => onChange(key, deep[key])
				);
				return deep[key];
			}
			return val;
		},
		set: (obj, key, val) => {
			if(state[key] !== val) {
				state[key] = val;
				onChange(key, val);
			}
		}
	})
}

// Provides an object which when has properties changed
// emits a `change:$key` event, as well as a `change` event
// after all changes have been set.
module.exports = function stateMap(initial, emit) {
	var state = Object.assign({}, initial);
	var immediate;
	function send(key, val) {
		return setImmediate(() => emit(key, val));
	}
	function onChange(key, val) {
		// Try to limit the amount of `change` events which are triggered
		// if multiple values are updated at the same time
		clearImmediate(immediate);
		// Per key
		send(`change:${key}`, val);
		// General
		immediate = send(`change`, proxy)
	}
	var proxy = makeChangingObject(state, onChange);
	return proxy;
};