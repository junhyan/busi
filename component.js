import Compiler from './compiler';
import Observer from './observer';
export const components = [];
export class Component {
    constructor (compOptions) {
        this._name = compOptions.name;
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
        this._observer = new Observer(this._data);
        // TODO 写一个待优化的遍历，之后与compiler合并
        new Compiler(this);
        this.parseComponents(this._el);
        
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
    parseComponents(el) {
        if (el) {
            let children = el.children;
            for (let i = 0; i<children.length; i++){
                this.parseComponents(children[i]);
                let currentComp = this.getComponent(children[i].tagName)
                if (currentComp) {
                    this.getElParent(children[i]).replaceChild(currentComp._el, children[i]);

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

Component.extend = function (compOptions) {
    let superClass = this;
    let subClass = function (compOptions) {
        superClass.call(this, compOptions);
    }
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    // subClass.prototype.init = function () {
    //     console.log('222')
    // };
    return new subClass(compOptions);
}
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