/*!
 * Busi
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Busi = factory());
}(this, (function () { 'use strict';

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
      [].slice.call(childNodes).forEach(function(node) {
          var reg = /\{\{(.*)\}\}/;
          var text = node.textContent;

          if (self.isTextNode(node) && reg.test(text)) {  // 判断是否是符合这种形式{{}}的指令
              self.compileText(node, reg.exec(text)[1]);
          }

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
  Compiler.prototype.updateText = function updateText (node, value) {
      node.textContent = typeof value == 'undefined' ? '' : value;
  };
  Compiler.prototype.isTextNode = function isTextNode (node) {
      return node.nodeType == 3;
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
      this._observer = new Observer(data);
      //el.innerHTML = this._data[exp];
      new Compiler(el, this);

  };
  Busi.prototype.getData = function getData () {
      return this._data;
  };

  return Busi;

})));
