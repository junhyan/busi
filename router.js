/*
* Observe class
*/
export default class Router {
    constructor (router) {
        this._router = router;
        if (location.hash.replace('#', '') === 'list') {
            new Compiler(this._el, this);
        }
    }
    getRouter () {
        return this._router;
    }
}
