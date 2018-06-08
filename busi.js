import Compiler from './compiler';
import Observer from './observer';

export default class Busi {
    constructor (data, el, exp) {
        this._data = data;
        let self = this;
        Object.keys(data).forEach(function(key) {
            self.proxy(key);
        });
        this._observer = new Observer(data);
        new Compiler(el, this);

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
