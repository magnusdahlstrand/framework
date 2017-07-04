var assert = require('assert');
var EventBus = require('./events');
var StateMap = require('./state');

// When the statemap is mutated, frame runs and
// the app is re-drawn.

function makeApp(initial={}) {
	var app;
	var rootEl;
	var routes = [];
	var bus = new EventBus();
	var emit = bus.emit.bind(bus);
	var state = new StateMap(initial, emit);
	var onChangeState;

	return (app = {
		state,
		routes,
		update,
		on,
		emit,
		mount: (el) => {
			rootEl = el;
			// console.log('mount', rootEl, app);
			on('change', () => {
				frame(app);
			})
			frame(app);
			emit('load');
		},
		route: (tester, route) => {
			routes.push([tester, route]);
		}
	})

	function on(evName, fn) {
		return bus.on(evName, () => fn(state, update))
	}

	function update(newState) {
		for([key, updatedVal] of Object.entries(newState)) {
			state[key] = updatedVal;
		}
	}

	function findRoute() {
		for(let [test, route] of routes) {
			if(test(state)) {
				return route;
			}
		}
	}

	function frame() {
		var route = findRoute();
		assert(route, 'found no route for state');
		// run the route with the current data (state)
		// and an emitter function for the state to
		// emit events on.
		route(state, emit)
		// .then(toHtmlStream)
		// .then(appendNodes)
		.then(result => {
			// TODO: Update the dom tree more graciously
			rootEl.innerHTML = result;
		});
	}
}

module.exports = makeApp;