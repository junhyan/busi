import Compiler from './compiler';
import Observer from './observer';

export default class Busi {
    constructor (data, el, exp) {
        this._data = data;
        this._observer = new Observer(data);
        //el.innerHTML = this._data[exp];
        new Compiler(el, this);

    }
    getData () {
        return this._data;
    } 
}
