import Compiler from './compiler';
import Observer from './observer';
export class Component {
    init (compOptions) {
        this._id = compOptions.bId;
        this._name = compOptions.bName;
        this._template = compOptions.template;
        this._el = compOptions.el || this.parseTemplate(this._template);
        this._props = compOptions.props || {};
        this._data = compOptions.data;
        // let self = this;
        // Object.keys(this._data).forEach(function(key) {
        //     self.proxy(key);
        // });
        this.beforeCreate(compOptions);
        this._observer = new Observer(this._data);
        this.create(compOptions);
        // TODO 写一个待优化的遍历，之后与compiler合并 or 不合并
        new Compiler(this).init();
        this.beforeMount (compOptions);
       // this.mountComponents(this._el);
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
    extendComp (compObj) {
        return Component.extend(compObj);
    }
    getData () {
        return this._data;
    }
    getProps () {
        return this._props;
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
