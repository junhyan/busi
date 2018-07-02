import Compiler from './compiler';
import Observer from './observer';
import Component from './component';
const components = [];
export default class Busi {
    constructor (instance) {
        this._data = instance.component.data;
        this.init(instance);

    }
    init (instance) {
        let self = this;
        Object.keys(this._data).forEach(function(key) {
            self.proxy(key);
        });
        this._observer = new Observer(this._data);
        // TODO 写一个待优化的遍历，之后与compiler合并
        this.setComponents(instance.el);
        new Compiler(instance.el, this);
    }
    parseTemplate(template) {

        　　 var objE = document.createElement("div");
        
        　　 objE.innerHTML = template;
        
        　　 return objE;
        
    }
    getComponent (name) {
        for (let i = 0; i < components.length; i++ ) {
            if (components[i].getComponentName() === name.toLowerCase()) {
                return components[i];
            }
        }
        return null;

    }
    getElParent (el) {
        return el.parentNode;
    }
    setComponents (el) {
        if (el) {
            let children = el.children;
            for (let i = 0; i<children.length; i++){
                this.setComponents(children[i]);
                let currentComp = this.getComponent(children[i].tagName)
                if (currentComp) {
                    this.getElParent(children[i]).replaceChild(this.parseTemplate(currentComp.getComponentTemplate()), children[i]);
                }
            }
        } else {
            return;
        }
    }
    getData () {
        return this._data;
    } 
    proxy (key) {
        let self = this;
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

    }
    dispatchEvent (component, name, event) {
      
    }
}
Busi.component = function(component) {
    components.push(new Component(component));
}

