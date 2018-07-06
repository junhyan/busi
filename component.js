import Compiler from './compiler';
import Observer from './observer';
export const components = [];
export class Component {
    constructor (compOptions) {
        this._id = compOptions.bId;
        this._name = compOptions.bName;
        this._template = compOptions.template;
        this._el = compOptions.el || this.parseTemplate(this._template);
        this._props = compOptions.props;
        this._data = compOptions.data;
        this.init(compOptions);
    }
    init (compOptions) {
        let self = this;
        Object.keys(this._data).forEach(function(key) {
            self.proxy(key);
        });
        this.beforeCreate(compOptions);
        this._observer = new Observer(this._data);
        this.create(compOptions);
        // TODO 写一个待优化的遍历，之后与compiler合并 or 不合并
        new Compiler(this);
        this.beforeMount (compOptions);
        this.mountComponents(this._el);
        this.afterMount(compOptions);
    }
    beforeCreate (compOptions) {
        if (compOptions.beforeCreate) {
            compOptions.beforeCreate();
        }
    }
    create (compOptions) {
        if (compOptions.create) {
            compOptions.create();
        }
    }
    beforeMount (compOptions) {

    }
    afterMount (compOptions) {

    }

    getComponentId () {
        return this._id;
    }
    getComponentName () {
        return this._name;
    }
    getComponentEl () {
        return this._el;
    }
    getComponentTemplate () {
        return this._template;
    }
    parseTemplate(template) {

        　　 var objE = document.createElement("div");
        
        　　 objE.innerHTML = template;
        
        　　 return objE;
        
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
    mountComponents(el) {
        if (el) {
            let children = el.children;
            for (let i = 0; i<children.length; i++){
                this.mountComponents(children[i]);
                if (!('align' in children[i])){  //TODO 需要更好的判断不是标准标签的方法
                    let compTag = children[i].tagName.toLowerCase() 
                    let currentCompObj = this.getComponent(compTag)
                    if (currentCompObj) {
                        let currentComp = Component.extend(currentCompObj);
                        this.getElParent(children[i]).replaceChild(currentComp.getComponentEl(), children[i]);
                    } else {
                        //console.error(compTag + ' component isn\'t exist.' );
                    }
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
    render (template) {
    }
}
