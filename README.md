# Vue JS Froala WYSIWYG Editor

[![npm](https://img.shields.io/npm/v/vue-froala-wysiwyg.svg)](https://www.npmjs.com/package/vue-froala-wysiwyg)
[![npm](https://img.shields.io/npm/dm/vue-froala-wysiwyg.svg)](https://www.npmjs.com/package/vue-froala-wysiwyg)
[![npm](https://img.shields.io/npm/l/vue-froala-wysiwyg.svg)](https://www.npmjs.com/package/vue-froala-wysiwyg)

> vue-froala-wysiwyg provides Vue 3 bindings to the Froala WYSIWYG editor.

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

Install `vue-froala-wysiwyg` from `npm`:

```bash
npm install vue-froala-wysiwyg
```

This also installs the matching version of `froala-editor`, which `vue-froala-wysiwyg` depends on. The wrapper needs Vue 3.2 or later.

## Update editor version

`vue-froala-wysiwyg` pins the exact `froala-editor` version it was built and tested against — an exact version, not a range. So `froala-editor` can't be updated on its own: it only changes when the wrapper does. Update the wrapper to get a newer editor:

```bash
npm install vue-froala-wysiwyg@latest
```

## Integration

#### 1. Register the plugin in your entry file (`src/main.js`, or `src/main.ts` in a TypeScript project).

```javascript
// Import all Froala Editor plugins.
import 'froala-editor/js/plugins.pkgd.min.js';

// Import third-party plugins if you need them, with their stylesheets.
// import 'froala-editor/js/third_party/embedly.min.js';
// import 'froala-editor/css/third_party/embedly.min.css';
// import 'froala-editor/js/third_party/font_awesome.min.js';
// import 'froala-editor/css/third_party/font_awesome.min.css';
// font_awesome also needs Font Awesome itself (npm install font-awesome@4.7.0):
// import 'font-awesome/css/font-awesome.min.css';
// spell_checker loads WebSpellChecker from its CDN and needs a WProofreader subscription.
// import 'froala-editor/js/third_party/spell_checker.min.js';
// import 'froala-editor/css/third_party/spell_checker.min.css';
// image_tui also needs TUI Image Editor, loaded on window.tui or passed as the tui option.
// import 'froala-editor/js/third_party/image_tui.min.js';
// import 'froala-editor/css/third_party/image_tui.min.css';

// Import Froala Editor css files.
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.min.css';

import App from './App.vue';
import { createApp } from 'vue';

// `es/index.js` is published as CommonJS, so the default export may arrive
// wrapped. This form works whichever way the bundler resolves the package.
import * as VueFroalaModule from 'vue-froala-wysiwyg';
const VueFroala = VueFroalaModule.default?.default ?? VueFroalaModule.default;

const app = createApp(App);

app.use(VueFroala);
app.mount('#app');
```

This registers two global components, `Froala` (the editor) and `FroalaView` (for [displaying HTML](#displaying-html)). Use them in templates as `<froala>` and `<froalaView>`, or `<froala-view>` in in-DOM templates.

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

In a Vite 8 project whose `package.json` has `"type": "module"`, a plain default import (`import VueFroala from 'vue-froala-wysiwyg'`) doesn't return the plugin — it returns the module namespace with the plugin one level deeper. In dev, `app.use()` warns `A plugin must either be a function or an object with an "install" function.`, `<froala>` isn't registered and the page renders blank. In a production build there is no warning at all, only the blank page. Until this is fixed in the package, import it like the entry file above does.

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

Type the controls in [Manual Instantiation](#manual-instantiation) too, for example `const initControls = shallowRef<any>(null);` and `function initialize(controls: any)`.

## Usage

### Initialize

```vue
<!-- If model is initialized, 'Init text' text child will be overwritten. -->
<froala :tag="'textarea'" :config="config" v-model:value="model">Init text</froala>
```

`tag` sets the element the editor is created on (default: `div`).

There are special tags: **a**, **button**, **img**, **input**. See [Special tags](#special-tags).

### Options

You can pass editor options as a component attribute (optional).

`:config="config"`

You can pass any existing Froala option. Consult the [Froala documentation](https://froala.com/wysiwyg-editor/docs/options/) to view the list of all the available options:

```javascript
const config = {
  key: 'YOUR_FROALA_LICENSE_KEY',
  placeholderText: 'Edit Your Content Here!',
  charCounterCount: false
};
```

`key` is your Froala license key. The wrapper adds one option of its own:
* **immediateVueModelUpdate**: (default: false) This option updates the Vue model as soon as a key is released in the editor. Note that it may affect performance.

`config` is read once, when the editor is created. To apply new options, re-create the component, for example by changing the Vue `:key` attribute on `<froala>` (not the `key` license option).

### Events and Methods

Pass events in the `events` option, keyed by event name, with the callback as the value. Inside the callback, `this` is the editor instance, so use a regular `function` rather than an arrow function:

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
import { ref } from 'vue';
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

Gives you control over when the editor is created and destroyed, and access to the editor instance. Use it if you want to initialize the editor manually.

`:onManualControllerReady="initialize"`

```vue
<template>
  <froala :onManualControllerReady="initialize">Manual</froala>
  <button @click="initControls.initialize()">Initialize</button>
  <button @click="deleteAll">Delete all</button>
</template>

<script setup>
import { shallowRef } from 'vue';

const initControls = shallowRef(null);

function initialize(controls) {
  initControls.value = controls;
}

function deleteAll() {
  const editor = initControls.value?.getEditor();
  if (!editor) return;
  editor.html.set('');
  editor.undo.reset();
  editor.undo.saveStep();
}
</script>
```

The object received by the function will contain the following methods:

- **initialize**: Call this method to initialize the Froala Editor
- **destroy**: Call this method to destroy the Froala Editor
- **getEditor**: Call this method to retrieve the editor that was created. Returns `null` until `initialize` has been called

## Displaying HTML

To display content created with the Froala Editor, use the `froalaView` component.

```vue
<froala v-model:value="content"></froala>

<froalaView :value="content"></froalaView>
```

## Nuxt and server-side rendering

The editor needs a browser, so register it in the browser only and render it on the client.

In Nuxt, register the plugin in a client-only plugin — `app/plugins/froala.client.ts` on Nuxt 4, or `plugins/froala.client.ts` on Nuxt 3:

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

The import uses the same form as the [entry file](#integration), which works whichever way the package resolves (see the [Vite 8 note](#vite-8-the-npm-create-vue-default)).

Then wrap the components in `<ClientOnly>`. Both `froala` and `froalaView` are only registered in the browser, so leaving either outside `<ClientOnly>` makes SSR fail to resolve it (`[Vue warn]: Failed to resolve component: froalaView`) and then produces a hydration mismatch:

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

<script setup lang="ts">
const config = {
  placeholderText: 'Edit Your Content Here!'
};

const model = ref('<p>Hello from Nuxt</p>');
</script>
```

Register custom buttons, icons and languages in the same client-only plugin, so they only run in the browser. Nuxt type-checks with the same `TS7016` error, so add the declaration from [TypeScript](#typescript) as `vue-froala-wysiwyg.d.ts` at the project root, where both Nuxt 3 and Nuxt 4 pick it up.

## License

The `vue-froala-wysiwyg` project is under MIT license. However, in order to use Froala WYSIWYG HTML Editor plugin you should purchase a license for it.

Froala Editor has [3 different licenses](https://froala.com/wysiwyg-editor/pricing/) for commercial use.
For details please see [License Agreement](https://froala.com/wysiwyg-editor/terms/).

## Development environment setup

If you want to contribute to vue-froala-wysiwyg, you will first need to install the required tools to get the project going.

#### Prerequisites

* [Node.js](https://nodejs.org/) — tested on 22.x and 24.x
* [Git](https://git-scm.com/)

The `build` script calls Yarn 1, which is installed locally as a dev dependency, so you don't need it globally.

#### Install dependencies

```bash
npm install --ignore-scripts
```

> Plain `npm install` fails: its `prepublish` script runs the webpack 4 build, which errors with `ERR_OSSL_EVP_UNSUPPORTED` on Node 17 and later.

#### Build

```bash
npx cross-env NODE_OPTIONS=--openssl-legacy-provider npm run build
```

#### Run Demo

```bash
npx cross-env NODE_OPTIONS=--openssl-legacy-provider npm run dev
```

`cross-env` is one of the project's dev dependencies, so these commands work the same in Bash, PowerShell and cmd.

The demo is served at http://localhost:8080.
