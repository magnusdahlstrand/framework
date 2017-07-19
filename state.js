function makeChangingArray(val, onChange) {
	var arr = Object.create(val, {
		push: {value: (...args) => {
			val.push(...args);
			onChange(arr);
		}},
		pop: {value: (...args) => {
			val.pop(...args);
			onChange(arr);
		}},
		shift: {value: (...args) => {
			val.shift(...args);
			onChange(arr);
		}},
		unshift: {value: (...args) => {
			val.unshift(...args);
			onChange(arr);
		}},
	});
	return arr;
}

// Provides an object which when has properties changed
// emits a `change:$key` event, as well as a `change` event
// after all changes have been set.
module.exports = function stateMap(initial, emit) {
	var state = Object.assign({}, initial);
	var immediate;
	function onChange(key, val) {
		// Try to limit the amount of `change` events which are triggered
		// if multiple values are updated at the same time
		clearImmediate(immediate);
		// Per key
		setImmediate(() =>
			emit(`change:${key}`, val))
		// General
		immediate = setImmediate(() =>
			emit(`change`, proxy))
	}
	var deep = Object.create(null);
	var proxy = new Proxy(state, {
		get: (obj, key) => {
			if(key in deep) {
				return deep[key];
			}
			var val = Reflect.get(obj, key);
			if(val instanceof Array) {
				deep[key] = makeChangingArray(val, (arr) => onChange(key, arr));
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
	return proxy;
};