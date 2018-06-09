/*!
 * Busi
 */
/*
* Observe class
*/
var Dep = function Dep () {
		this.subs = [];
	};
	Dep.prototype.addSub = function addSub (sub) {
    	this.subs.push(sub);
  	};
  	Dep.prototype.notify = function notify () {
  		this.subs.forEach(function(sub) {
          sub.update();
      });
  	};
Dep.target = null;

/*
* Observe class
*/
var Watcher = function Watcher (component, exp, callback) {
    this._component = component;
    this._exp = exp;
    this._callback = callback;
    this._value = this.get();
};
Watcher.prototype.update = function update () {
    this.run();
};
Watcher.prototype.run = function run () {
    var value = this._component.getData()[this._exp];
    var oldVal = this._value;
    if (value !== oldVal) {
        this._value = value;
        this._callback.call(this._component, value, oldVal);
    }
};
Watcher.prototype.get = function get () {
    Dep.target = this;  // 缓存自己
    var value = this._component.getData()[this._exp];  // 强制执行监听器里的get函数
    Dep.target = null;  // 释放自己
    return value;
};

var Compiler = function Compiler (el, component) {
		this._el = el;
		this._component = component;
		this.init();
	};
	Compiler.prototype.init = function init () {
    if (this._el) {
        this._fragment = this.nodeToFragment(this._el);
        this.compileElement(this._fragment);
        this._el.appendChild(this._fragment);
    } else {
        console.log('Dom元素不存在');
    }
};
Compiler.prototype.nodeToFragment = function nodeToFragment (el) {
    var fragment = document.createDocumentFragment();
    var child = el.firstChild;
    while (child) {
        // 将Dom元素移入fragment中
        fragment.appendChild(child);
        child = el.firstChild;
    }
    return fragment;
};
Compiler.prototype.compileElement = function compileElement (el) {
    var childNodes = el.childNodes;
    var self = this;
    Array.from(childNodes).forEach(function(node) {
        var reg = /\{\{(.*)\}\}/;
        var text = node.textContent;
        var attrs = node.attributes;

        self.isTextNode(node) && reg.test(text) && self.compileText(node, reg.exec(text)[1]);  // 判断是否是符合这种形式{{}}的指令
                
           	attrs && Array.from(attrs).forEach(function (attr) {
           		if (self.isCommand(attr.name.split(':')[0])) {
            		self.compileAttr(node, attr);
            	}
           	});
            	

        if (node.childNodes && node.childNodes.length) {
            self.compileElement(node);  // 继续递归遍历子节点
        }
    });
};
Compiler.prototype.compileText = function compileText (node, exp) {
    var self = this;
    var initText = this._component.getData()[exp];
    this.updateText(node, initText);  // 将初始化的数据初始化到视图中
    new Watcher(this._component, exp, function (value) { // 生成订阅器并绑定更新函数
        self.updateText(node, value);
    });
};
Compiler.prototype.compileAttr = function compileAttr (node, attr) {
    	var attrName = attr.name;
    	if (/^b-model(.*)/.test(attrName)) {
    		this.compileModel(node, attr);
    	} else if (/^b-bind(.*)/.test(attrName)) {
    		this.compileBind(node, attr);
    	} else if (/^b-if(.*)/.test(attrName)) {
    		this.compileIfAndElse(node, attr);
    	}
};
Compiler.prototype.updateText = function updateText (node, value) {
    node.textContent = typeof value == 'undefined' ? '' : value;
};
Compiler.prototype.updateModel = function updateModel (node, value) {
    	node.value = value;
};
Compiler.prototype.updateBind = function updateBind (node, option, value) {
    	switch (option) {
    		case 'class':
    			node.className = value;
    			break;
    		default:
    			console.log('for props');

    	}
};
Compiler.prototype.showNode = function showNode (node) {
    	if (node.style.display === 'none') {
    		node.style.display = '';
    	}
};
Compiler.prototype.hideNode = function hideNode (node) {
    	if (node.style.display === '') {
    		node.style.display = 'none';
    	}
};
Compiler.prototype.updateIfAndElse = function updateIfAndElse (node, value, nextNode) {
    	if (nextNode) {
	    	if (value) {
	    		this.showNode(node);
	    		this.hideNode(nextNode);
	    	} else {
	    		this.showNode(nextNode);
	    		this.hideNode(node);
	    	}
	} else {
	    	if (value) {
	    		this.showNode(node);
	    	} else {
	    		this.hideNode(node);
	    	}
	}
};
Compiler.prototype.isTextNode = function isTextNode (node) {
    return node.nodeType === 3;
};
Compiler.prototype.isCommand = function isCommand (attrName) {
    	var commands = ['b-model', 'b-bind', 'b-if', 'b-else', 'b-for'];
    	return commands.includes(attrName);
};
Compiler.prototype.compileModel = function compileModel (node, attr) {
    	var self = this;
    	var exp = attr.value;
    	var initModel = this._component.getData()[exp];
    this.updateModel(node, initModel);  // 将初始化的数据初始化到视图中
    node.oninput = function () {
        	self._component.getData()[exp] = node.value;
    };
    	new Watcher(this._component, exp, function (value) { // 生成订阅器并绑定更新函数
        self.updateModel(node, value);
    });
};
Compiler.prototype.compileBind = function compileBind (node, attr) {
    var self = this;
    	var attrName = attr.name;
    	var option = attrName.split(':')[1];
    	var exp = attr.value;
    	var initBind = this._component.getData()[exp];
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
};
Compiler.prototype.hasAttribute = function hasAttribute (attrs, attrName) {
    	var res = false;
    	Array.from(attrs).forEach(function (attr) {
    		if (attr.name === attrName) {
    			res = true;
    		}
    	});
    	return res;
};
Compiler.prototype.compileIfAndElse = function compileIfAndElse (node, attr) {
    	var self = this;
    	var exp = attr.value;
    	var initIf = this._component.getData()[exp];
    	var nextNode = node.nextElementSibling;
    	var nextAttrs;
    	if (nextNode) {
    		nextAttrs = nextNode.attributes;
    	}
    	if (nextAttrs && this.hasAttribute(nextAttrs, 'b-else')) {
    		this.updateIfAndElse(node, initIf, nextNode); 
    	} else {
    		this.updateIfAndElse(node, initIf);
    	}
    	
        
    	new Watcher(this._component, exp, function (value) {
        if (nextAttrs && self.hasAttribute(nextAttrs, 'b-else')) {
    			self.updateIfAndElse(node, value, nextNode); 
	    	} else {
	    		self.updateIfAndElse(node, value);
	    	}
    });
};

/*
* Observe class
*/
var Observer = function Observer(value) {
    this._value = value;
    //this._dep = new Dep();
    this.walk(this._value);
};
Observer.prototype.walk = function walk (obj) {
    Object.keys(obj).forEach(function(key) {
        defineReactive(obj, key, obj[key]);
    });
};
Observer.prototype.getValue = function getValue () {
    return this._value;
};

function observer(value) {
    if (!value || typeof value !== 'object') {
        return;
    }
    new Observer(value);
}

function defineReactive(obj, key, value) {
    observer(value);
    var dep = new Dep();
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function () {
            if (Dep.target) {
                dep.addSub(Dep.target); // 在这里添加一个订阅者
            }
            return value;
        },
        set: function (newVal) {
            if (value === newVal) {
                return;
            }
            value = newVal;
            dep.notify();
        }
    });

}

var Busi = function Busi (data, el, exp) {
    this._data = data;
    var self = this;
    Object.keys(data).forEach(function(key) {
        self.proxy(key);
    });
    this._observer = new Observer(data);
    new Compiler(el, this);

};
Busi.prototype.getData = function getData () {
    return this._data;
}; 
Busi.prototype.proxy = function proxy (key) {
    var self = this;
    Object.defineProperty(this, key, {
        enumerable: false,
        configurable: true,
        get: function proxyGetter() {
            return self._data[key];
        },
        set: function proxySetter(newVal) {
            self._data[key] = newVal;
        }
    });

};

export default Busi;
