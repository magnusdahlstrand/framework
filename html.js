var whitespace = /[\t\n]+/g;
var fragmentPattern = /\[fragment:([0-9]+)\]/;


// Takes a list of Nodes, returns a fragment containing them
function makeFrag(items) {
	var frag = document.createDocumentFragment();
	frag.append(...items);
	return frag;
}


// Input string and out comes a
// DOM fragment with the string's nodes
var renderStringToFrag = (function() {
	// in node we just forward the input
	if(!document) {
		return str => str
	}
	var wrap = document.createElement('div');
	return (str) => {
		wrap.innerHTML = str;
		return makeFrag(wrap.children);
	}
}())


// Renders list of text, html strings
// and fragments into a fragment
function toTag(list) {
	return Promise.all(list)
	.then(list => {
		// console.log('toTag', list);
		// Concatenate sequential strings
		// Append nodes and strings to fragment
		// Replace all document fragments in the array
		// with placeholders
		var [str, fragments] = swapFragsForRefs(list);
		var root = renderStringToFrag(str);
		replaceRefsWithFrags(root, fragments);
		return Promise.resolve(root);
	})
}


// Returns a string produced from input
// strings & fragments, where fragments
// have been replaced with placeholders,
// as well as an array of fragments for
// future swap back.
function swapFragsForRefs(list) {
	var nodes = [];
	var str = list.reduce((str, val) => {
		if(typeof val === 'string') {
			return `${str}${val}`;
		}
		if(val instanceof Node) {
			let i = nodes.length;
			nodes.push(val);
			return `${str}[fragment:${i}]`;
		}
		return str;
	}, '');
	return [str, nodes];
}


// Replace fragment references in the
// input text node.
// Mutates the DOM tree passed in.
function replaceRefWithFrag(textNode, fragments) {
	// Split the text node into multiple nodes:
	// Text: foo [fragment:$ref] bar
	// becomes
	// Text: foo | Fragment | Text: bar
	var match = textNode.textContent.match(fragmentPattern);
	if(!match) {
		return;
	}
	var [whole, ref] = match;
	var fragmentTextNode = textNode.splitText(match.index);
	var remainingText = fragmentTextNode.splitText(whole.length);
	fragmentTextNode.replaceWith(fragments[ref]);
	// Recurse into remaining text node
	if(remainingText && remainingText.textContent) {
		return replaceRefWithFrag(remainingText, fragments);
	}
}


// Iterate over child nodes (text and element),
// recurse into elements, replace all [fragment:$ref]
// with the fragment from fragments
function replaceRefsWithFrags(root, fragments) {
	for(let el of root.childNodes) {
		if(el instanceof Text) {
			// replace fragment references with fragments
			replaceRefWithFrag(el, fragments);
		}
		else {
			// recurse
			replaceRefsWithFrags(el, fragments);
		}
	}
}


function refine(something) {
	if(something instanceof Promise) {
		return something;
	}
	if(something instanceof Array) {
		return Promise.all(something)
		.then(result => Promise.resolve(makeFrag(result)))
	}
	if(typeof something === 'function') {
		return something();
	}
	if(typeof something === 'undefined' ||
		typeof something === 'boolean') {
		return '';
	}
	if(typeof something === 'string') {
		something.replace(whitespace, '');
	}
	return something;
}


function html(strings, ...keys) {
	var output = [];
	for(let [i, string] of Object.entries(strings)) {
		output.push(string, refine(keys[i]));
	}
	return toTag(output);
}

module.exports = html;
