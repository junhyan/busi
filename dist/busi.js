/*!
 * Busi
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Busi = factory());
}(this, (function () { 'use strict';

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

  function showNode (node) {
  	if (node.style.display === 'none') {
  		node.style.display = '';
  	}
  }
  function hideNode (node) {
  	if (node.style.display === '') {
  		node.style.display = 'none';
  	}
  }

  function isTextNode (node) {
      return node.nodeType === 3;
  }

  function hasAttribute (attrs, attrName) {
  	var res = false;
  	Array.from(attrs).forEach(function (attr) {
  		if (attr.name === attrName) {
  			res = true;
  		}
  	});
  	return res;
  }

  var Compiler = function Compiler (component) {
  		this._component = component;
  		this._el = component.getComponentEl();
  		this.init();
  		this.isFor = false;
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
      	} else if (/^b-for(.*)/.test(attrName)) {
      		this.compileFor(node, attr);
      		this.ifFor = true;
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
  Compiler.prototype.updateIfAndElse = function updateIfAndElse (node, value, nextNode) {
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
  };
  Compiler.prototype.isCommand = function isCommand (attrName) {
      	var commands = ['b-model', 'b-bind', 'b-if', 'b-for'];
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
      node.removeAttribute(attr.name);

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
  };
  Compiler.prototype.compileFor = function compileFor (node, attr) {
      	var self = this;
      	//let forOption = attr.value;
      	//(item, index) in list
      	var options = attr.value.split(' in ');
      	var exp = options[1].trim(),
      		item,
      		index;
      	if (/.+,.+/.test(options[0])) {
      		item = options[0].split(',')[0].replace('(', '').trim();
      		index = options[0].split(',')[1].replace(')', '').trim();
      	} else {
      		item = options[0].replace('(', '').replace(')', '').trim();
      	}
      	
      	var initList = this._component.getData()[exp];
      this.updateFor(node, initList, item, index);  // 将初始化的数据初始化到视图中
      	new Watcher(this._component, exp, function (list) { // 生成订阅器并绑定更新函数
          self.updateFor(node, list, item, index);
      });
  };
  Compiler.prototype.updateFor = function updateFor (node, list, item, index) {
      	var templateNode = document.createDocumentFragment();
      	templateNode = node.cloneNode(true);
      	var children = templateNode.children;
      	var self = this;
      	var fragments = [];
      	var loop = function ( i ) {
      		var fragment = document.createDocumentFragment();
      		Array.from(children).forEach(function (cNode) {
      			fragment.appendChild(cNode.cloneNode(true));
      		});
  	    	fragments[i] = fragment;
      	};

      	for(var i = 0; i < list.length; i++) loop( i );
      	Array.from(node.children).forEach(function (cNode) {
  			node.removeChild(cNode);
  		});
      	
      	var loop$1 = function ( i ) {
      		function compileForElement(itemNode) {
  	    		var childNodes = itemNode.childNodes;
  		    Array.from(childNodes).forEach(function(cNode) {
  		        var reg  = new RegExp('{{' + item + '.*}}');
  		        var text = cNode.textContent;
  		        var attrs = cNode.attributes;

  		        isTextNode(cNode) && reg.test(text) && self.updateText(cNode, 
  		            	list[i][text.split('.')[1].replace('}}', '').trim()]);
  		        attrs && Array.from(attrs).forEach(function (attr) {
  		            	var attrName = attr.name;
  		            	var attrValue = attr.value;
  		           		if (self.isCommand(attrName.split(':')[0])) {
  					    	if (/^b-bind(.*)/.test(attrName)) {
  					    		var option = attrName.split(':')[1];
  					    		self.updateBind(cNode, option, list[i][attrValue]);
          						cNode.removeAttribute(attrName);
  					    	} else if (/^b-if(.*)/.test(attrName)) {
  					    		var nextNode = cNode.nextElementSibling;
  						    	var nextAttrs;
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
  					    		var options = attrValue.split(' in ');
  						    	var exp = options[1].trim(),
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
  		};

      	for(var i$1 = 0; i$1 < list.length; i$1++) loop$1( i$1 );
      	
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
      if (!value || typeof value !== 'object' || value instanceof Array) {
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

  var components = [];
  var Component = function Component (compOptions) {
      this._id = compOptions.bId;
      this._name = compOptions.bName;
      this._template = compOptions.template;
      this._el = compOptions.el || this.parseTemplate(this._template);
      this._props = compOptions.props;
      this._data = compOptions.data;
      this.init(compOptions);
  };
  Component.prototype.init = function init (compOptions) {
      var self = this;
      Object.keys(this._data).forEach(function(key) {
          self.proxy(key);
      });
      this._observer = new Observer(this._data);
      // TODO 写一个待优化的遍历，之后与compiler合并
      new Compiler(this);
      this.parseComponents(this._el);
          
  };
  Component.prototype.getComponentId = function getComponentId () {
      return this._id;
  };
  Component.prototype.getComponentName = function getComponentName () {
      return this._name;
  };
  Component.prototype.getComponentEl = function getComponentEl () {
      return this._el;
  };
  Component.prototype.getComponentTemplate = function getComponentTemplate () {
      return this._template;
  };
  Component.prototype.parseTemplate = function parseTemplate (template) {

          　　 var objE = document.createElement("div");
          
          　　 objE.innerHTML = template;
          
          　　 return objE;
          
  };
  Component.prototype.getComponent = function getComponent (name) {
      name = name.toLowerCase();
      for (var i = 0; i < components.length; i++ ) {
          if (components[i].bName === name) {
              return components[i];
          }
      }
      return null;

  };
  Component.prototype.getElParent = function getElParent (el) {
      return el.parentNode;
  };
  Component.prototype.parseComponents = function parseComponents (el) {
          var this$1 = this;

      if (el) {
          var children = el.children;
          for (var i = 0; i<children.length; i++){
              this$1.parseComponents(children[i]);
              if (!('align' in children[i])){  //TODO 需要更好的判断不是标准标签的方法
                  var compTag = children[i].tagName.toLowerCase(); 
                  var currentCompObj = this$1.getComponent(compTag);
                  if (currentCompObj) {
                      var currentComp = Component.extend(currentCompObj);
                      this$1.getElParent(children[i]).replaceChild(currentComp.getComponentEl(), children[i]);
                  }
              }
                  
          }
      } else {
          return;
      }
  };
  Component.prototype.getData = function getData () {
      return this._data;
  }; 
  Component.prototype.proxy = function proxy (key) {
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
  Component.prototype.render = function render (template) {
  };

  Component.extend = function (compOptions) {
      var superClass = this;
      var subClass = function (compOptions) {
          superClass.call(this, compOptions);
      };
      subClass.prototype = Object.create(superClass.prototype);
      subClass.prototype.constructor = subClass;
      // subClass.prototype.init = function () {
      //     console.log('222')
      // };
      return new subClass(compOptions);
  };
  // let a = Component.extend({
  //     name: 'aaa',
  //     template: '<ul><li>listitem1</li><li>{{name}}</li></ul><div>hahahhah</div>',
  //     props: {
  //         //test
  //     },
  //     data: {
  //         cdata: 'aa'
  //     },
  //     init: function () {
  //         console.log('init');
  //     },
  //     ready: function () {
  //         console.log('ready');        
  //     },
  //     methods: {
  //         getName:function () {
  //             console.log('getName');
  //         }
  //     }
  // });
  // console.log(a.getComponentName());

  var componentId = 0;
  var Busi = function Busi (instance) {
      //this._data = instance.component.data;
      //this.init(instance);
      this._componet = new Component(instance.component);
  };
  Busi.prototype.getinnerComponent = function getinnerComponent () {
      return this._componet;
  };
  Busi.prototype.dispatchEvent = function dispatchEvent (component, name, event) {
        
  };
  Busi.component = function(name, instance) {
      var component = instance || {};
      component.bName = name;
      component.bId = ++componentId;
      components.push(component);
  };

  return Busi;

})));
