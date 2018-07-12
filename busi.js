
import {Component} from './component';
import {components} from './global';

var componentId = 0;
export default class Busi {
    constructor (instance) {
        //this._data = instance.component.data;
        //this.init(instance);
        this._componet = new Component();
        this._componet.init(instance.component);
    }
    getinnerComponent () {
        return this._componet;
    }
    dispatchEvent (component, name, event) {
      
    }
}
Busi.component = function(name, instance) {
    let component = instance || {};
    component.bName = name;
    component.bId = ++componentId;
    components.push(component);
}
Component.extend = function (compOptions) {
    let superClass = this;
    let subClass = function (compOptions) {
        //superClass.call(this);
        this.init(compOptions);
    }
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    return new subClass(compOptions);
}
