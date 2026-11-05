import {Froala, FroalaView} from './vue-froala'

export { Froala, FroalaView };

export default {
    install: (app, options) => {
        app.component('Froala', Froala);
        app.component('FroalaView', FroalaView);
    }
}