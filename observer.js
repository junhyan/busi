/*
* Observe class
*/
import Dep from './dep'
export default class Observer {
    constructor(value) {
        this._value = value;
        //this._dep = new Dep();
        this.walk(this._value);
    }
    walk (obj) {
        Object.keys(obj).forEach(function(key) {
            defineReactive(obj, key, obj[key]);
        });
    }
    getValue () {
        return this._value;
    }
}

export function observer(value) {
    if (!value || typeof value !== 'object') {
        return;
    }
    new Observer(value)
}

export function defineReactive(obj, key, value) {
    observer(value);
    const dep = new Dep();
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
