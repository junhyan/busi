
import {Component,components} from './component';
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
Busi.component = function(component) {
    components.push(Component.extend(component));
}

