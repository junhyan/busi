import Watcher from './watcher';
import {
	showNode,
	hideNode,
	isTextNode,
	hasAttribute
} from './utils/util'

export default class Compiler {
	constructor (el, component) {
		this._el = el;
		this._component = component;
		this.init();
	}
	init () {
        if (this._el) {
            this._fragment = this.nodeToFragment(this._el);
            this.compileElement(this._fragment);
            this._el.appendChild(this._fragment);
        } else {
            console.log('Dom元素不存在');
        }
    }
    nodeToFragment (el) {
        let fragment = document.createDocumentFragment();
        let child = el.firstChild;
        while (child) {
            // 将Dom元素移入fragment中
            fragment.appendChild(child);
            child = el.firstChild
        }
        return fragment;
    }
    compileElement (el) {
        let childNodes = el.childNodes;
        let self = this;
        Array.from(childNodes).forEach(function(node) {
            let reg = /\{\{(.*)\}\}/;
            let text = node.textContent;
            let attrs = node.attributes;

            isTextNode(node) && reg.test(text) && self.compileText(node, reg.exec(text)[1]);  // 判断是否是符合这种形式{{}}的指令
                
           	attrs && Array.from(attrs).forEach(function (attr) {
           		if (self.isCommand(attr.name.split(':')[0])) {
            		self.compileAttr(node, attr);
            	}
           	});
            	

            if (node.childNodes && node.childNodes.length) {
                self.compileElement(node);  // 继续递归遍历子节点
            }
        });
    }
    compileText (node, exp) {
        let self = this;
        let initText = this._component.getData()[exp];
        this.updateText(node, initText);  // 将初始化的数据初始化到视图中
        new Watcher(this._component, exp, function (value) { // 生成订阅器并绑定更新函数
            self.updateText(node, value);
        });
    }
    compileAttr (node, attr) {
    	let attrName = attr.name;
    	if (/^b-model(.*)/.test(attrName)) {
    		this.compileModel(node, attr);
    	} else if (/^b-bind(.*)/.test(attrName)) {
    		this.compileBind(node, attr);
    	} else if (/^b-if(.*)/.test(attrName)) {
    		this.compileIfAndElse(node, attr);
    	} else if (/^b-for(.*)/.test(attrName)) {
    		this.compileFor(node, attr);
    	}
    }
    updateText (node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    }
    updateModel (node, value) {
    	node.value = value;
    }
    updateBind (node, option, value) {
    	switch (option) {
    		case 'class':
    			node.className = value;
    			break;
    		default:
    			console.log('for props');

    	}
    }
    updateIfAndElse (node, value, nextNode) {
    	if (nextNode) {
	    	if (value) {
	    		showNode(node);
	    		hideNode(nextNode);
	    	} else {
	    		showNode(nextNode);
	    		hideNode(node);
	    	}
	    } else {
	    	if (value) {
	    		showNode(node);
	    	} else {
	    		hideNode(node);
	    	}
	    }
    }
    isCommand (attrName) {
    	let commands = ['b-model', 'b-bind', 'b-if', 'b-for'];
    	return commands.includes(attrName);
    }
    compileModel (node, attr) {
    	let self = this;
    	let exp = attr.value;
    	let initModel = this._component.getData()[exp];
        this.updateModel(node, initModel);  // 将初始化的数据初始化到视图中
        node.oninput = function () {
        	self._component.getData()[exp] = node.value;
        }
    	new Watcher(this._component, exp, function (value) { // 生成订阅器并绑定更新函数
            self.updateModel(node, value);
        });
    }
    compileBind(node, attr) {
        let self = this;
    	let attrName = attr.name;
    	let option = attrName.split(':')[1];
    	let exp = attr.value;
    	let initBind = this._component.getData()[exp];
    	this.updateBind(node, option, initBind);
    	// if (/^\<\%.*\%\>$/.test(value)) {
    	// 	let jsString = value.replace('<%', '').replace('%>','');
	    // 	if (option === 'class') {
	    // 		new Function(jsString)();
	    // 	}
    	// }
    	new Watcher(this._component, exp, function (value) {
            self.updateBind(node, option, value);
        });
    }
    compileIfAndElse (node, attr) {
    	let self = this;
    	let exp = attr.value;
    	let initIf = this._component.getData()[exp];
    	let nextNode = node.nextElementSibling;
    	let nextAttrs;
    	if (nextNode) {
    		nextAttrs = nextNode.attributes;
    	}
    	if (nextAttrs && hasAttribute(nextAttrs, 'b-else')) {
    		this.updateIfAndElse(node, initIf, nextNode); 
    	} else {
    		this.updateIfAndElse(node, initIf);
    	}
    	
        
    	new Watcher(this._component, exp, function (value) {
            if (nextAttrs && hasAttribute(nextAttrs, 'b-else')) {
    			self.updateIfAndElse(node, value, nextNode); 
	    	} else {
	    		self.updateIfAndElse(node, value);
	    	}
        });
    }
    compileFor (node, attr) {
    	let self = this;
    	//let forOption = attr.value;
    	//(item, index) in list
    	let options = attr.value.split(' in ');
    	let exp = options[1].trim(),
    		item,
    		index;
    	if (/.+,.+/.test(options[0])) {
    		item = options[0].split(',')[0].trim();
    		index = options[0].split(',')[1].trim();
    	} else {
    		item = options[0].trim();
    	}
    	let initList = this._component.getData()[exp];
        this.updateFor(node, initList, item, index);  // 将初始化的数据初始化到视图中
    	new Watcher(this._component, exp, function (list) { // 生成订阅器并绑定更新函数
            self.updateFor(node, list, item, index);
        });
    }
    updateFor (node, list, item, index) {
    	let children = node.children;
    	for(let i = 1; i<list.length; i++) {
    		Array.from(children).forEach(function (cNode) {
    			node.appendChild(cNode.cloneNode(true));
    		});
    	}
    }
}