class EventBus {
	constructor() {
		this._listeners = {};
		this.wildcards = new Set();
	}
	addRemote(remoteFn) {
		// We listen for all own events and forward
		// them to the remote callback function
		return this.onAll((eventName, data) => {
			remoteFn(eventName, data)
		})
	}
	has(eventName) {
		return this.getListeners(eventName).size;
	}
	getListeners(eventName) {
		if(this._listeners[eventName]) {
			return this._listeners[eventName];
		}
		return (this._listeners[eventName] = new Set());
	}
	// on(event, fn)
	// on({event: fn, ...})
	// on(document, {event: fn})
	// on(document, event, fn)
	on(...args) {
		let context, eventName, fn;
		if(args.length === 3) {
			[context, eventName, fn] = args;
		}
		else if(args.length === 2) {
			// context, map
			if(typeof args[1] === 'object') {
				[context, eventName] = args;
			}
			// name, fn
			else {
				[eventName, fn] = args;
				context = this;
			}
		}
		// event map
		else if(args.length) {
			eventName = args[0];
			context = this;
		}
		else {
			throw new Error(`on requires arguments`);
		}
		// Event map, possibly with context
		if(typeof eventName === 'object') {
			// eventName is map
			return this.onMap(context, eventName)
		}
		if(!fn) {
			throw new Error(`binding ${fn} listener to ${eventName}`)
		}
		// Wildcard
		if(eventName === '*') {
			return this.onAll(fn);
		}
		if(context === this) {
			let listeners = this.getListeners(eventName);
			listeners.add(fn);
			return listeners.delete.bind(listeners, fn);
		}
		if(!context) {
			throw new Error(`on is missing context`)
		}
		if(context.addEventListener) {
			context.addEventListener(eventName, fn);
			return context.removeEventListener.bind(context, eventName, fn);
		}
		console.info(context);
		throw new Error(`on unable to bind to unknown context type`)
	}
	onAll(fn) {
		this.wildcards.add(fn);
		return this.wildcards.delete.bind(this.wildcards, fn);
	}
	onMap(...args) {
		let context, eventMap;
		if(args.length === 2) {
			[context, eventMap] = args;
		}
		else if(args.length) {
			[eventMap] = args[0];
		}
		else {
			throw new Error(`onMap requires arguments`);
		}
		// Map is keyed by event name, with vals being handlers
		var unbinders = [];
		for(let [eventName, fn] of Object.entries(eventMap)) {
			// Keep track of all unbind functions
			unbinders.push(this.on(context, eventName, fn));
		}
		// Return the off function, which calls the stored offs
		return () => {
			if(unbinders) {
				unbinders.forEach(unbinder => unbinder())
			}
			// Ensure we don't call off multiple times
			unbinders = null;
		}
	}
	off(eventName, fn) {
		var listeners = this.getListeners(eventName);
		if(fn) {
			return listeners.delete(fn);
		}
		else {
			return listeners.clear();
		}
	}
	emit(eventName, data=null, originalEv=null) {
		for(let fn of this.getListeners(eventName)) {
			if(!fn) {
				console.log('no listener', eventName);
			}
			fn(data, originalEv);
		}
		for(let fn of this.wildcards) {
			fn(eventName, data, originalEv);
		}

	}
}
EventBus.prototype.trigger = EventBus.prototype.emit;

module.exports = EventBus;