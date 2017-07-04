
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
	var proxy = new Proxy(state, {
		get: Reflect.get,
		set: (obj, key, val) => {
			if(state[key] !== val) {
				state[key] = val;
				onChange(key, val);
			}
		}
	})
	return proxy;
};