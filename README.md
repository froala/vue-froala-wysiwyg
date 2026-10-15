# Vue JS Froala WYSIWYG Editor

[![npm](https://img.shields.io/npm/v/vue-froala-wysiwyg.svg)](https://www.npmjs.com/package/vue-froala-wysiwyg)
[![npm](https://img.shields.io/npm/dm/vue-froala-wysiwyg.svg)](https://www.npmjs.com/package/vue-froala-wysiwyg)
[![npm](https://img.shields.io/npm/l/vue-froala-wysiwyg.svg)](https://www.npmjs.com/package/vue-froala-wysiwyg)

>vue-froala-wysiwyg provides Vue 3 bindings to the Froala WYSIWYG editor.

## Table of contents
1. [Installation](#installation)
2. [Update editor version](#update-editor-version)
3. [Integration](#integration)
4. [Usage](#usage)
5. [Manual Instantiation](#manual-instantiation)
6. [Displaying HTML](#displaying-html)
7. [Nuxt and server-side rendering](#nuxt-and-server-side-rendering)
8. [License](#license)
9. [Development environment setup](#development-environment-setup)

## Installation

Install `vue-froala-wysiwyg` from `npm`

```bash
npm install vue-froala-wysiwyg
```

This also installs the matching version of `froala-editor`, which `vue-froala-wysiwyg` depends on. The wrapper needs Vue 3.2 or later.

## Update editor version

`vue-froala-wysiwyg` pins the exact `froala-editor` version it was built and tested against, so update the wrapper to get a newer editor:

```bash
npm install vue-froala-wysiwyg@latest
```

## Integration

#### 1. Register the plugin in your entry file (`src/main.js`, or `src/main.ts` in a TypeScript project).

```javascript
// Import all Froala Editor plugins.
import 'froala-editor/js/plugins.pkgd.min.js';

// Import third-party plugins if you need them.
// import 'froala-editor/js/third_party/embedly.min';
// import 'froala-editor/js/third_party/font_awesome.min';
// import 'froala-editor/js/third_party/spell_checker.min';
// import 'froala-editor/js/third_party/image_tui.min';

// Import Froala Editor css files.
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.min.css';

import App from './App.vue'
import { createApp } from 'vue'
import VueFroala from 'vue-froala-wysiwyg';

const app = createApp(App);

app.use(VueFroala);
app.mount('#app');
```

This registers two components, `froala` (the editor) and `froalaView` (for [displaying HTML](#displaying-html)).

#### 2. Use the editor in a component, for example `src/App.vue`.

```vue
<template>
  <froala id="edit" :tag="'textarea'" :config="config" v-model:value="model"></froala>
</template>

<script setup>
import { ref } from 'vue';

const config = {
  events: {
    initialized: function () {
      console.log('initialized');
    }
  }
};

const model = ref('Edit Your Content Here!');
</script>
```

#### Vite 8 (the `npm create vue` default)

In a Vite 8 project whose `package.json` has `"type": "module"`, the default import above doesn't return the plugin. `app.use()` warns that "a plugin must either be a function or an object with an install function", `<froala>` isn't registered and the page renders blank. Until this is fixed in the package, import it like this instead:

```javascript
import * as VueFroalaModule from 'vue-froala-wysiwyg';
const VueFroala = VueFroalaModule.default?.default ?? VueFroalaModule.default;
```

#### TypeScript

The package doesn't ship type declarations yet, so a TypeScript build (`vue-tsc`) stops with `TS7016: Could not find a declaration file for module 'vue-froala-wysiwyg'`. Add a declaration file, for example `src/vue-froala-wysiwyg.d.ts`:

```typescript
declare module 'vue-froala-wysiwyg';
```

The examples in this README use plain JavaScript in `<script setup>`. In a TypeScript project, use `<script setup lang="ts">` instead, otherwise `vue-tsc` can't read the component (`TS7016: Could not find a declaration file for module './App.vue'`). With TypeScript, also type `this` in event callbacks:

```typescript
import FroalaEditor from 'froala-editor';

const config = {
  events: {
    focus: function (this: FroalaEditor) {
      console.log(this.selection.get());
    }
  }
};
```

and the controls in [Manual Instantiation](#manual-instantiation), for example `let initControls: any = null;` and `function initialize(controls: any)`.

## Usage

### Initialize

```vue
<!-- If model is initialized, 'Init text' text child will be overwritten. -->
<froala :tag="'textarea'" :config="config" v-model:value="model">Init text</froala>
```

**:tag** attr is used to tell on which tag the editor is initialized (default: `div`).

There are special tags: **a**, **button**, **img**, **input**. See [Special tags](#special-tags).

### Options

You can pass editor options as component attribute (optional).

`:config="config"`

You can pass any existing Froala option. Consult the [Froala documentation](https://froala.com/wysiwyg-editor/docs/options/) to view the list of all the available options:

```javascript
const config = {
  placeholderText: 'Edit Your Content Here!',
  charCounterCount: false
};
```

Additional option is used:
* **immediateVueModelUpdate**: (default: false) This option updates the Vue model as soon as a key is released in the editor. Note that it may affect performance.

`config` is read once, when the editor is created. To apply new options, re-create the editor, for example by changing its `key`.

### Events and Methods

Events can be passed in with the options, with a key events and object where the key is the event name and the value is the callback function. Inside the callback, `this` is the editor instance, so use a regular `function` rather than an arrow function:

```javascript
const config = {
  placeholderText: 'Edit Me',
  events: {
    focus: function () {
      console.log(this.selection.get());
    }
  }
};
```

Using the editor instance you can call editor methods as described in the [method docs](https://froala.com/wysiwyg-editor/docs/methods/).

Froala events are described in the [events docs](https://froala.com/wysiwyg-editor/docs/events/).

### Model

The WYSIWYG HTML editor content model. Two way binding is supported through the `value` prop:

`v-model:value="model"`

Use `v-model:value`, not plain `v-model`: the editor doesn't read or update `modelValue`.

Use the content in other places:

```vue
<input v-model="model"/>
```

### Special tags

You can also use the editor on **img**, **button**, **input** and **a** tags. Pass the tag name as a string:

```vue
<froala :tag="'img'" v-model:value="imgModel"></froala>
```

The model must be an object containing the attributes for your special tags. Example:

```javascript
import imageUrl from './image.jpg';

const imgModel = ref({
  src: imageUrl
});
```

The model will change as the attributes change during usage.

* The model can contain a special attribute named **innerHTML** which inserts innerHTML in the element: If you are using 'button' tag, you can specify the button text like this:

```javascript
const buttonModel = ref({
  innerHTML: 'Click Me'
});
```

As the button text is modified by the editor, the **innerHTML** attribute of the button's model will be modified too.

#### Specific option for special tags

* **vueIgnoreAttrs**: (default: null) This option is an array of attributes that you want to ignore when the editor updates the model:

```javascript
const config = {
  vueIgnoreAttrs: ['class', 'id']
};
```

### Custom Buttons

You can define custom buttons before the editor is created, for example at the top of the component that uses them:

```vue
<template>
  <froala :tag="'textarea'" :config="config" v-model:value="model"></froala>
</template>

<script setup>
import { ref } from 'vue';
import FroalaEditor from 'froala-editor';

FroalaEditor.DefineIcon('alert', {NAME: 'info', SVG_KEY: 'help'});
FroalaEditor.RegisterCommand('alert', {
  title: 'Hello',
  focus: false,
  undo: false,
  refreshAfterCallback: false,
  callback: function () {
    alert('Hello!');
  }
});

FroalaEditor.DefineIcon('clear', {NAME: 'remove', SVG_KEY: 'remove'});
FroalaEditor.RegisterCommand('clear', {
  title: 'Clear HTML',
  focus: false,
  undo: true,
  refreshAfterCallback: true,
  callback: function () {
    this.html.set('');
    this.events.focus();
  }
});

FroalaEditor.DefineIcon('insert', {NAME: 'plus', SVG_KEY: 'add'});
FroalaEditor.RegisterCommand('insert', {
  title: 'Insert HTML',
  focus: true,
  undo: true,
  refreshAfterCallback: true,
  callback: function () {
    this.html.insert('My New HTML');
  }
});

const config = {
  toolbarButtons: [['undo', 'redo', 'bold'], ['alert', 'clear', 'insert']]
};

const model = ref('');
</script>
```

## Manual Instantiation

Gets the functionality to operate on the editor: create, destroy and get editor instance. Use it if you want to manually initialize the editor.

`:onManualControllerReady="initialize"`

```vue
<template>
  <froala :onManualControllerReady="initialize">Manual</froala>
  <button @click="initControls.initialize()">Initialize</button>
  <button @click="deleteAll">Delete all</button>
</template>

<script setup>
let initControls = null;

function initialize(controls) {
  initControls = controls;
}

function deleteAll() {
  const editor = initControls.getEditor();
  editor.html.set('');
  editor.undo.reset();
  editor.undo.saveStep();
}
</script>
```

The object received by the function will contain the following methods:

- **initialize**: Call this method to initialize the Froala Editor
- **destroy**: Call this method to destroy the Froala Editor
- **getEditor**: Call this method to retrieve the editor that was created. There is no editor instance to return until `initialize` has been called

## Displaying HTML

To display content created with the froala editor use the `froalaView` component.

```vue
<froala v-model:value="content"></froala>

<froalaView :value="content"></froalaView>
```

## Nuxt and server-side rendering

The editor needs a browser, so register it in the browser only and render it on the client.

In Nuxt, register the plugin in a client-only plugin, `app/plugins/froala.client.ts`:

```typescript
// Import all Froala Editor plugins.
import 'froala-editor/js/plugins.pkgd.min.js';

// Import Froala Editor css files.
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.min.css';

import * as VueFroalaModule from 'vue-froala-wysiwyg';
const VueFroala = VueFroalaModule.default?.default ?? VueFroalaModule.default;

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueFroala);
});
```

The import uses the same form as the [Vite 8 note](#vite-8-the-npm-create-vue-default), which works whichever way the package resolves.

Then wrap the components in `<ClientOnly>`. Both `froala` and `froalaView` are only registered in the browser, so leaving either outside `<ClientOnly>` causes a hydration mismatch:

```vue
<template>
  <ClientOnly>
    <froala :tag="'textarea'" :config="config" v-model:value="model"></froala>
    <froalaView :value="model"></froalaView>
    <template #fallback>
      <p>Loading editor…</p>
    </template>
  </ClientOnly>
</template>

<script setup>
const config = {
  placeholderText: 'Edit Your Content Here!'
};

const model = ref('<p>Hello from Nuxt</p>');
</script>
```

Register custom buttons, icons and languages in the same client-only plugin, so they only run in the browser. In a TypeScript project, add the declaration file from [TypeScript](#typescript) too.

## License

The `vue-froala-wysiwyg` project is under MIT license. However, in order to use Froala WYSIWYG HTML Editor plugin you should purchase a license for it.

Froala Editor has [3 different licenses](https://froala.com/wysiwyg-editor/pricing/) for commercial use.
For details please see [License Agreement](https://froala.com/wysiwyg-editor/terms/).

## Development environment setup

If you want to contribute to vue-froala-wysiwyg, you will first need to install the required tools to get the project going.

#### Prerequisites

* [Node Package Manager](https://www.npmjs.com/) (NPM)
* [Git](https://git-scm.com/)

#### Install dependencies

    $ npm install

#### Build

    $ npm run build

#### Run Demo

    $ npm run dev

The demo is served at http://localhost:8080.
