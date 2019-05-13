import FroalaEditor from 'froala-editor/js/froala_editor.pkgd.min';
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

        // Editor element.
        _editor: null,

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
        
        this.setContent(true);

        this.registerEvents();
        
        this._editor = new FroalaEditor('#'+this.$el.id,this.currentConfig)
        
        this.initListeners();
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
          
          self._editor.html.set(self.model || '');
          
          //This will reset the undo stack everytime the model changes externally. Can we fix this?
          
          self._editor.undo.saveStep();
          self._editor.undo.reset();
          
        }

        if (firstTime) {
          this.registerEvent(this.$el, 'initialized', function () {
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
              this.$el.setAttribute(attr, tags[attr]);
            }
          }

          if (tags.hasOwnProperty(this.INNER_HTML_ATTR)) {
            this.$el.innerHTML = tags[this.INNER_HTML_ATTR];
          }
        }
      },

      destroyEditor: function() {

        if (this.$el) {

          this._editor.destroy();
          this.listeningEvents.length = 0;
          this.$el = null;
          this.editorInitialized = false;
        }
      },

      getEditor: function() {
        if (this.$el) {
          return new FroalaEditor('#'+this.$el.id);
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

          var attributeNodes = this.$el[0].attributes;
          var attrs = {};

          for (var i = 0; i < attributeNodes.length; i++ ) {

            var attrName = attributeNodes[i].name;
            if (this.currentConfig.vueIgnoreAttrs && this.currentConfig.vueIgnoreAttrs.indexOf(attrName) != -1) {
              continue;
            }
            attrs[attrName] = attributeNodes[i].value;
          }

          if (this.$el[0].innerHTML) {
            attrs[this.INNER_HTML_ATTR] = this.$el[0].innerHTML;
          }

          modelContent = attrs;
        } else {

          var returnedHtml = this._editor.html.get();
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
        this.registerEvent(this.$el, 'contentChanged',function () {
          self.updateModel();
        });
        if (this.currentConfig.immediateVueModelUpdate) {
          this.registerEvent(this._editor, 'keyup', function () {
            self.updateModel();
          });
        }
      },

      // register event on editor element
      registerEvent: function(element, eventName, callback) {

        if (!element || !eventName || !callback) {
          return;
        }

        this.listeningEvents.push(eventName);
        
        if(!this.currentConfig.events){
          this.currentConfig.events = {};
        } 
        this.currentConfig.events[eventName] = callback;
        
      },

      registerEvents: function() {

        var events = this.currentConfig.events;
        if (!events) {
          return;
        }

        for (var event in events) {
          if (events.hasOwnProperty(event)) {
            this.registerEvent(this.$el, event, events[event]);
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