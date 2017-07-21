var morph = require('morphdom');

function ensureChildNodes(root) {
	if(root && root.childNodes && root.childNodes.length) {
		return Promise.resolve(root);
	}
	return Promise.reject();
}

function firstChild(root) {
	return ensureChildNodes(root)
	.then(() => Promise.resolve(root.childNodes[0]));
}

function component($template, events=null) {
	// console.log('component', $template);
	if(!document) {
		return $template;
	}
	return $template
	.then(firstChild)
	.then(el => {
		if(events) {
			// TODO: We should unbind
			on(el, events);
		}
		return Promise.resolve(el);
	})
	.catch(() => {
		// no child nodes
	})
}

function defrag(fragment) {
	if(fragment instanceof DocumentFragment) {
		return fragment.childNodes[0];
	}
	return fragment;
}

// Rendering
function render(rootEl, $ui, state) {
	$ui(state).then(content => {
		morph(rootEl, defrag(content))
	})
}

module.exports = {
	component,
	render
};