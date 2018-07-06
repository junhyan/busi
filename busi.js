
import {Component,components} from './component';
var componentId = 0;
export default class Busi {
    constructor (instance) {
        //this._data = instance.component.data;
        //this.init(instance);
        this._componet = new Component(instance.component);
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

