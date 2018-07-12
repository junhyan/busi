import Watcher from './watcher';
import {components} from './global';
import {
	showNode,
	hideNode,
	isTextNode,
	hasAttribute
} from './utils/util'

export default class Compiler {
	constructor (component) {
		this._component = component;
		this._el = component.getComponentEl();
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
        let fragment = document.createDocumentFragment(); // avoid reflow
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
            isTextNode(node) && reg.test(text) && self.compileText(node, reg.exec(text)[1]);  // 判断是否是符合这种形式{{}}的指令
            if (node.tagName) {
				let attrs = node.attributes;
				attrs && Array.from(attrs).forEach(function (attr) {
					if (self.isCommand(attr.name.split(':')[0])) {
						self.compileAttr(node, attr);
					}
				});
				
				let compTag = node.tagName.toLowerCase() 
				let currentCompObj = self.getComponent(compTag)
				if (currentCompObj) {
					let currentComp = self._component.extendComp(currentCompObj);
					self.getElParent(node).replaceChild(currentComp.getComponentEl(), node);
				}
			}
            if (node.childNodes && node.childNodes.length) {
                self.compileElement(node);  // 继续递归遍历子节点
            }
        });
	}
	getComponent (name) {
        name = name.toLowerCase();
        for (let i = 0; i < components.length; i++ ) {
            if (components[i].bName === name) {
                return components[i];
            }
        }
        return null;

    }
    getElParent (el) {
        return el.parentNode;
    }
    // mountComponents(el) {
    //     if (el) {
    //         let children = el.children;
    //         for (let i = 0; i<children.length; i++){
    //             this.mountComponents(children[i]);
    //             if (!('align' in children[i])){  //TODO 需要更好的判断不是标准标签的方法
    //                 let compTag = children[i].tagName.toLowerCase() 
    //                 let currentCompObj = this.getComponent(compTag)
    //                 if (currentCompObj) {
    //                     let currentComp = this._component.extendComp(currentCompObj);
    //                     this.getElParent(children[i]).replaceChild(currentComp.getComponentEl(), children[i]);
    //                 } else {
    //                     //console.error(compTag + ' component isn\'t exist.' );
    //                 }
    //             }
                
    //         }
    //     } else {
    //         return;
    //     }
    // }
    compileText (node, exp) {
        let self = this;
        let initText = this._component.getData()[exp] || this._component.getProps()[exp];
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
    		this.ifFor = true;
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
				let subComp = this.getComponent(node.tagName);
				if (subComp) {
					subComp.props[option] = value;
				}
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
    	let initModel = this._component.getData()[exp] || this._component.getProps()[exp];
        this.updateModel(node, initModel);  // 将初始化的数据初始化到视图中
        node.oninput = function () {
        	self._component.getData()[exp] = node.value;
        }
        node.removeAttribute(attr.name);

    	new Watcher(this._component, exp, function (value) { // 生成订阅器并绑定更新函数
            self.updateModel(node, value);
        });
    }
    compileBind(node, attr) {
        let self = this;
    	let attrName = attr.name;
    	let option = attrName.split(':')[1];
    	let exp = attr.value;
    	let initBind = this._component.getData()[exp] || this._component.getProps()[exp];
    	this.updateBind(node, option, initBind);
        node.removeAttribute(attr.name);

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
    	let initIf = this._component.getData()[exp] || this._component.getProps()[exp];
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
    		item = options[0].split(',')[0].replace('(', '').trim();
    		index = options[0].split(',')[1].replace(')', '').trim();
    	} else {
    		item = options[0].replace('(', '').replace(')', '').trim();
    	}
    	
    	let initList = this._component.getData()[exp] || this._component.getProps()[exp];
        this.updateFor(node, initList, item, index);  // 将初始化的数据初始化到视图中
    	new Watcher(this._component, exp, function (list) { // 生成订阅器并绑定更新函数
            self.updateFor(node, list, item, index);
        });
    }
    updateFor (node, list, item, index) {
    	let templateNode = document.createDocumentFragment();
    	templateNode = node.cloneNode(true);
    	let children = templateNode.children;
    	let self = this;
    	let fragments = [];
    	for(let i = 0; i < list.length; i++) {
    		let fragment = document.createDocumentFragment();
    		Array.from(children).forEach(function (cNode) {
    			fragment.appendChild(cNode.cloneNode(true));
    		});
	    	fragments[i] = fragment;
    	}
    	Array.from(node.children).forEach(function (cNode) {
			node.removeChild(cNode);
		});
    	
    	for(let i = 0; i < list.length; i++) {
    		function compileForElement(itemNode) {
	    		let childNodes = itemNode.childNodes;
		        Array.from(childNodes).forEach(function(cNode) {
		            let reg  = new RegExp('{{' + item + '.*}}');
		            let text = cNode.textContent;
		            let attrs = cNode.attributes;

		            isTextNode(cNode) && reg.test(text) && self.updateText(cNode, 
		            	list[i][text.split('.')[1].replace('}}', '').trim()]);
		            attrs && Array.from(attrs).forEach(function (attr) {
		            	let attrName = attr.name;
		            	let attrValue = attr.value;
		           		if (self.isCommand(attrName.split(':')[0])) {
					    	if (/^b-bind(.*)/.test(attrName)) {
					    		let option = attrName.split(':')[1];
					    		self.updateBind(cNode, option, list[i][attrValue]);
        						cNode.removeAttribute(attrName);
					    	} else if (/^b-if(.*)/.test(attrName)) {
					    		let nextNode = cNode.nextElementSibling;
						    	let nextAttrs;
						    	if (nextNode) {
						    		nextAttrs = nextNode.attributes;
						    	}
						    	if (nextAttrs && hasAttribute(nextAttrs, 'b-else')) {
						    		self.updateIfAndElse(cNode, list[i][attrValue], nextNode); 
						    	} else {
						    		self.updateIfAndElse(cNode, list[i][attrValue]);
						    	}
						    	cNode.removeAttribute(attrName);
					    	} else if (/^b-for(.*)/.test(attrName)) {
					    		let options = attrValue.split(' in ');
						    	let exp = options[1].trim(),
						    		item,
						    		index;
						    	if (/.+,.+/.test(options[0])) {
						    		item = options[0].split(',')[0].replace('(', '').trim();
						    		index = options[0].split(',')[1].replace(')', '').trim();
						    	} else {
						    		item = options[0].replace('(', '').replace(')', '').trim();
						    	}
						        self.updateFor(cNode, list[i][exp], item, index);
						        cNode.removeAttribute(attrName);
					    	}
		            	}
		           	});
		            if (cNode.childNodes && cNode.childNodes.length) {
		                compileForElement(cNode);  // 继续递归遍历子节点
		            }
		        });
		    }
		    compileForElement(fragments[i]);

		    node.appendChild(fragments[i]);
		}
    	
    }
}