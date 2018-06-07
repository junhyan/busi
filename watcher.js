/*
* Observe class
*/
import Dep from './dep'
export default class Watcher {
    constructor (component, exp, callback) {
        this._component = component;
        this._exp = exp;
        this._callback = callback;
        this._value = this.get();
    }
    update () {
        this.run();
    }
    run () {
        var value = this._component.getData()[this._exp];
        var oldVal = this._value;
        if (value !== oldVal) {
            this._value = value;
            this._callback.call(this._component, value, oldVal);
        }
    }
    get () {
        Dep.target = this;  // 缓存自己
        var value = this._component.getData()[this._exp]  // 强制执行监听器里的get函数
        Dep.target = null;  // 释放自己
        return value;
    }
}
