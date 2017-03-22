/*!
 * Vue-Froala.js v2.0.0
 * (c) 2017 David Baldwynn <polydaic@gmail.com>
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.install = factory());
}(this, (function () { 'use strict';

function __$styleInject(css, returnValue) {
  if (typeof document === 'undefined') {
    return returnValue;
  }
  css = css || '';
  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';
  if (style.styleSheet){
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
  head.appendChild(style);
  return returnValue;
}
var $ = require('jquery');

var vueFroala = (function (Vue) {
  var Options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


  var froalaEditorFunctionality = {

    props: ['value', 'config'],

    render: function render(createElement) {
      return createElement(this.tag);
    },

    // Before first time render.
    beforeCreate: function beforeCreate() {
      console.log('before create');
    },

    created: function created() {
      console.log('created');
      this.model = this.value;
    },

    // After first time render.
    mounted: function mounted() {
      console.log('mounted');
      if (this.SPECIAL_TAGS.indexOf(this.tag) != -1) {

        this.hasSpecialTag = true;
      }

      if (this.onManualControllerReady) {
        this.generateManualController();
      } else {
        this.createEditor();
      }
    },

    beforeDestroy: function beforeDestroy() {
      this.destroyEditor();
    },

    updated: function updated() {

      if (JSON.stringify(this.oldModel) == JSON.stringify(this.model)) {
        return;
      }

      this.setContent();
    },

    data: function data() {

      return {

        // Tag on which the editor is initialized.
        tag: 'div',
        listeningEvents: [],

        // Jquery wrapped element.
        _$element: null,

        // Editor element.
        _$editor: null,

        // Editor options config
        defaultConfig: {
          immediateReactModelUpdate: false,
          reactIgnoreAttrs: null
        },

        editorInitialized: false,

        SPECIAL_TAGS: ['img', 'button', 'input', 'a'],
        INNER_HTML_ATTR: 'innerHTML',
        hasSpecialTag: false,

        model: null,
        oldModel: null
      };
    },
    methods: {
      createEditor: function createEditor() {

        console.log(this.config);
        if (this.editorInitialized) {
          return;
        }

        this.config = this.config || this.defaultConfig;

        this._$element = $(this.$el);

        this.setContent(true);

        this.registerEvents();
        this._$editor = this._$element.froalaEditor(this.config).data('froala.editor').$el;
        this.initListeners();

        this.editorInitialized = true;
      },

      setContent: function setContent(firstTime) {

        if (!this.editorInitialized && !firstTime) {
          return;
        }

        if (this.model || this.model == '') {

          this.oldModel = this.model;

          if (this.hasSpecialTag) {
            this.setSpecialTagContent();
          } else {
            this.setNormalTagContent(firstTime);
          }
        }
      },

      setNormalTagContent: function setNormalTagContent(firstTime) {

        var self = this;

        function htmlSet() {

          self._$element.froalaEditor('html.set', self.model || '', true);
          //This will reset the undo stack everytime the model changes externally. Can we fix this?
          self._$element.froalaEditor('undo.reset');
          self._$element.froalaEditor('undo.saveStep');
        }

        if (firstTime) {
          this.registerEvent(this._$element, 'froalaEditor.initialized', function () {
            htmlSet();
          });
        } else {
          htmlSet();
        }
      },

      setSpecialTagContent: function setSpecialTagContent() {

        var tags = this.model;

        // add tags on element
        if (tags) {

          for (var attr in tags) {
            if (tags.hasOwnProperty(attr) && attr != this.INNER_HTML_ATTR) {
              this._$element.attr(attr, tags[attr]);
            }
          }

          if (tags.hasOwnProperty(this.INNER_HTML_ATTR)) {
            this._$element[0].innerHTML = tags[this.INNER_HTML_ATTR];
          }
        }
      },

      destroyEditor: function destroyEditor() {

        if (this._$element) {

          this.listeningEvents && this._$element.off(this.listeningEvents.join(" "));
          this._$editor.off('keyup');
          this._$element.froalaEditor('destroy');
          this.listeningEvents.length = 0;
          this._$element = null;
          this.editorInitialized = false;
        }
      },

      getEditor: function getEditor() {

        if (this._$element) {
          return this._$element.froalaEditor.bind(this._$element);
        }
        return null;
      },

      generateManualController: function generateManualController() {

        var self = this;
        var controls = {
          initialize: this.createEditor,
          destroy: this.destroyEditor,
          getEditor: this.getEditor
        };

        this.onManualControllerReady(controls);
      },

      updateModel: function updateModel() {

        if (!this.onModelChange) {
          return;
        }

        var modelContent = '';

        if (this.hasSpecialTag) {

          var attributeNodes = this._$element[0].attributes;
          var attrs = {};

          for (var i = 0; i < attributeNodes.length; i++) {

            var attrName = attributeNodes[i].name;
            if (this.config.reactIgnoreAttrs && this.config.reactIgnoreAttrs.indexOf(attrName) != -1) {
              continue;
            }
            attrs[attrName] = attributeNodes[i].value;
          }

          if (this._$element[0].innerHTML) {
            attrs[this.INNER_HTML_ATTR] = this._$element[0].innerHTML;
          }

          modelContent = attrs;
        } else {

          var returnedHtml = this._$element.froalaEditor('html.get');
          if (typeof returnedHtml === 'string') {
            modelContent = returnedHtml;
          }
        }

        this.oldModel = modelContent;
        this.$emit('input', modelContent);
      },

      initListeners: function initListeners() {
        var self = this;

        // bind contentChange and keyup event to froalaModel
        this.registerEvent(this._$element, 'froalaEditor.contentChanged', function () {
          self.updateModel();
        });
        if (this.config.immediateReactModelUpdate) {
          this.registerEvent(this._$editor, 'keyup', function () {
            self.updateModel();
          });
        }
      },

      // register event on jquery editor element
      registerEvent: function registerEvent(element, eventName, callback) {

        if (!element || !eventName || !callback) {
          return;
        }

        this.listeningEvents.push(eventName);
        element.on(eventName, callback);
      },

      registerEvents: function registerEvents() {

        var events = this.config.events;
        if (!events) {
          return;
        }

        for (var event in events) {
          if (events.hasOwnProperty(event)) {
            this.registerEvent(this._$element, event, events[event]);
          }
        }
      }
    }
  };

  Vue.component('froala', froalaEditorFunctionality);
});

return vueFroala;

})));
