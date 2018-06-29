import Compiler from './compiler';
import Observer from './observer';

export default class Busi {
    constructor (instance) {
        this._data = instance.component.data;
        let self = this;
        Object.keys(this._data).forEach(function(key) {
            self.proxy(key);
        });
        this._observer = new Observer(this._data);
        new Compiler(instance.el, this);

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
}
