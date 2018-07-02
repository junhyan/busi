export default class Component {
    constructor (cOptions) {
        this._name = cOptions.name;
        this._template = cOptions.template;
        this._props = cOptions.props;
    }
    getComponentName () {
        return this._name;
    }
    getComponentTemplate () {
        return this._template;
    }
}