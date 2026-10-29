import type { DefineComponent, Plugin } from 'vue';
import type FroalaEditor from 'froala-editor';
import type { FroalaOptions } from 'froala-editor';

/** Editor options, plus the options the Vue wrapper reads itself. */
export type FroalaVueConfig = Partial<FroalaOptions> & {
  /** Update the model on every keyup, not only on contentChanged. Default false. */
  immediateVueModelUpdate?: boolean;
  /** Attributes left out of the model of a special tag (img, button, input, a). */
  vueIgnoreAttrs?: string[] | null;
};

/** Passed to onManualControllerReady. */
export interface FroalaManualControls {
  initialize(): void;
  destroy(): void;
  getEditor(): FroalaEditor | null;
}

export interface FroalaProps {
  /** Element the editor is created on. Default 'div'. */
  tag?: string;
  /** HTML for most tags; an attribute object for img, button, input and a. Use v-model:value. */
  value?: string | Record<string, any> | null;
  config?: FroalaVueConfig;
  /** When set, the editor is not created until controls.initialize() is called. */
  onManualControllerReady?: (controls: FroalaManualControls) => void;
  'onUpdate:value'?: (value: any) => void;
}

export interface FroalaViewProps {
  tag?: string;
  value?: string | null;
}

export declare const Froala: DefineComponent<FroalaProps>;
export declare const FroalaView: DefineComponent<FroalaViewProps>;

/** app.use(VueFroala) registers Froala and FroalaView globally. */
declare const VueFroala: Plugin;
export default VueFroala;

declare module 'vue' {
  export interface GlobalComponents {
    Froala: typeof Froala;
    FroalaView: typeof FroalaView;
  }
}
