export function showNode (node) {
	if (node.style.display === 'none') {
		node.style.display = '';
	}
}
export function hideNode (node) {
	if (node.style.display === '') {
		node.style.display = 'none';
	}
}

export function isTextNode (node) {
    return node.nodeType === 3;
}

export function hasAttribute (attrs, attrName) {
	let res = false;
	Array.from(attrs).forEach(function (attr) {
		if (attr.name === attrName) {
			res = true;
		}
	});
	return res;
}

export function classExtend (subClass, superClass) {
	
}
