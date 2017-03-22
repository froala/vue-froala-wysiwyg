Vue-Froala
========

Vue wrapper module for the Froala editor.

* Supports both Vue 1.0 and Vue 2.0

## Requirements

- Vue: ^1.0.0 or ^2.0.0 

## Install

From npm:

``` sh

$ npm install vue-froala --save

```

## Usage

See `/demo` folder for a usage example.

## Development

Run `node build.js` to convert your ES6 to an ES5 compatible build file

## Default Options
```
{
    toolbarButtons: ['bold', 'italic', 'underline', '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'insertTable', '|', 'insertLink', 'insertImage', 'insertVideo', 'insertFile', '|', 'undo', 'redo', 'clearFormatting', 'fullscreen', '|', 'html'],
    toolbarButtonsMD: ['bold', 'italic', 'underline', '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'insertTable', '|', 'insertLink', '|', 'undo', 'redo', 'clearFormatting', '|', 'html'],
    toolbarButtonsSM: ['bold', 'italic', 'underline', '|', 'insertLink', '|', 'undo', 'redo', 'clearFormatting'],
    toolbarButtonsXS: ['bold', 'italic', 'underline', '|', 'insertLink', '|', 'undo', 'redo', 'clearFormatting'],
    paragraphFormat: {
        n:  'Normal',
        h2: 'Heading 2',
        h3: 'Heading 3',
        h4: 'Heading 4',
        blockquote: 'Quote',
        pre: 'Code'
    },
    codeMirror: true,
    height: 400,
    theme: 'gray'
}
```