
export default (Vue, Options = {}) => {

  var froalaEditorFunctionality = {

    props: ['tag', 'value', 'config', 'onManualControllerReady'],

    watch: {
      value: function () {
        this.model = this.value;
        this.updateValue();
      }
    },

    render: function (createElement) {
      return createElement(
        this.currentTag,
        [this.$slots.default]
      )
    },

    created: function () {
      this.currentTag = this.tag || this.currentTag;
      this.model = this.value;
    },

    // After first time render.
    mounted: function() {
      if (this.SPECIAL_TAGS.indexOf(this.currentTag) != -1) {

        this.hasSpecialTag = true;
      }

      if (this.onManualControllerReady) {
        this.generateManualController();
      } else {
        this.createEditor();
      }
    },

    beforeDestroy: function() {
      this.destroyEditor();
    },

    data: function () {

      return {

        // Tag on which the editor is initialized.
        currentTag: 'div',
        listeningEvents: [],

        // Jquery wrapped element.
        _$element: null,

        // Editor element.
        _$editor: null,

        // Current config.
        currentConfig: null,

        // Editor options config
        defaultConfig: {
          immediateVueModelUpdate: false,
          vueIgnoreAttrs: null
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
      updateValue: function() {
        if (JSON.stringify(this.oldModel) == JSON.stringify(this.model)) {
          return;
        }

        this.setContent();
      },

      createEditor: function() {

        if (this.editorInitialized) {
          return;
        }

        this.currentConfig = this.config || this.defaultConfig;

        this._$element = jQuery(this.$el);

        this.setContent(true);

        this.registerEvents();
        this._$editor = this._$element.froalaEditor(this.currentConfig).data('froala.editor').$el;
        this.initListeners();

        if(this._$element.find('.fr-counter').length>0){
          this._$element.find('.fr-counter')[0].innerText = this._$editor[0].innerText.length
        }

        this.editorInitialized = true;
      },

      setContent: function(firstTime) {

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

      setNormalTagContent: function(firstTime) {

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

      setSpecialTagContent: function() {

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

      destroyEditor: function() {

        if (this._$element) {

          this.listeningEvents && this._$element.off(this.listeningEvents.join(" "));
          this._$editor.off('keyup');
          this._$element.froalaEditor('destroy');
          this.listeningEvents.length = 0;
          this._$element = null;
          this.editorInitialized = false;
        }
      },

      getEditor: function() {

        if (this._$element) {
          return this._$element.froalaEditor.bind(this._$element);
        }
        return null;
      },

      generateManualController: function() {

        var self = this;
        var controls = {
          initialize: this.createEditor,
          destroy: this.destroyEditor,
          getEditor: this.getEditor,
        };

        this.onManualControllerReady(controls);
      },

      updateModel: function() {

        var modelContent = '';

        if (this.hasSpecialTag) {

          var attributeNodes = this._$element[0].attributes;
          var attrs = {};

          for (var i = 0; i < attributeNodes.length; i++ ) {

            var attrName = attributeNodes[i].name;
            if (this.currentConfig.vueIgnoreAttrs && this.currentConfig.vueIgnoreAttrs.indexOf(attrName) != -1) {
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

      initListeners: function() {
        var self = this;

        // bind contentChange and keyup event to froalaModel
        this.registerEvent(this._$element, 'froalaEditor.contentChanged',function () {
          self.updateModel();
        });
        if (this.currentConfig.immediateVueModelUpdate) {
          this.registerEvent(this._$editor, 'keyup', function () {
            self.updateModel();
          });
        }
      },

      // register event on jquery editor element
      registerEvent: function(element, eventName, callback) {

        if (!element || !eventName || !callback) {
          return;
        }

        this.listeningEvents.push(eventName);
        element.on(eventName, callback);
      },

      registerEvents: function() {

        var events = this.currentConfig.events;
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

  Vue.component('Froala', froalaEditorFunctionality);

  var froalaViewFunctionality = {

    props: ['tag', 'value'],

    watch: {
      value: function (newValue) {
        this._element.innerHTML = newValue;
      }
    },

    created: function () {
      this.currentTag = this.tag || this.currentTag;
    },

    render: function (createElement) {
      return createElement(
        this.currentTag,
        {
          class: 'fr-view'
        }
      )
    },

    // After first time render.
    mounted: function() {
      this._element = this.$el;

      if (this.value) {
         this._element.innerHTML = this.value
      }
    },

    data: function () {

      return {
        currentTag: 'div',
        _element: null,
      };
    }
  };

  Vue.component('FroalaView', froalaViewFunctionality);
}