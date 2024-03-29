import FormField from './FormField';
import FormNode from './FormNode';
import * as utils from './utils';
import Events from './Events';
import * as validator from './validator';
import {
  Descriptor,
  DescriptorCompiled,
} from './validator';

export class Form {
  container: HTMLElement;

  createView: (node: FormNode) => void;

  mountView: (form: Form) => void;

  events: Events | null = null;

  utils: { [k: string]: Function } = {};

  rootFormFiled: FormField | null = null;

  formFields: Map<string, FormField> = new Map();

  dirtyFields: Set<string> = new Set();

  errorFields: Map<string, FormField> = new Map();

  constructor(
    container: HTMLElement,
    descriptor: Descriptor,
    customize?: {
      createView?: (node: FormNode) => void,
      mountView?: (form: Form) => void,
    }
  ) {
    if (!container) {
      throw Error('missing container');
    }
    if (!descriptor) {
      throw Error('missing descriptor');
    }

    this.container = container;

    const {
      createView, mountView,
    } = customize || {};
    // TODO:
    // this.createView = createView || createViewNative;
    // this.mountView = mountView || mountViewNative;
    this.createView = createView || (() => {});
    this.mountView = mountView || (() => {});

    this.events = new Events();

    this.utils = utils;

    this._create(descriptor);
    this.mountView(this);
  }

  private _create(descriptor: Descriptor) {
    const descriptorCompiled = validator.compileDescriptor(
      descriptor,
      'settings'
    );

    // console.log('descriptorCompiled', descriptorCompiled);

    if (!descriptorCompiled) {
      return;
    }

    const form = this;

    const traverse = (_descriptorCompiled: DescriptorCompiled) => {
      const { type = '', fields } = _descriptorCompiled;
      const formField = new FormField(_descriptorCompiled, form);
      if (['object', 'array'].includes(type) && fields) {
        Object.keys(fields).forEach((f: string) => {
          const formFieldChild = traverse(fields[f]);
          formField.addChild(formFieldChild);
        });
      }
      return formField;
    }

    const rootFormField = traverse(descriptorCompiled);

    // console.log('rootFormField', rootFormField);

    this.rootFormFiled = rootFormField;
  }

  async onFieldChange(valueNew: any, valueOld: any, field: FormField) {
    const { id, isDirty, error } = field;

    if (isDirty) {
      this.dirtyFields.add(id);
    } else {
      this.dirtyFields.delete(id);
    }

    if (error) {
      this.errorFields.set(id, field);
    } else {
      this.errorFields.delete(id);
    }

    await this.events?.emit('valuechange', valueNew, valueOld, field);
  }

  setValue(value: any) {
    this.rootFormFiled?.setValue(value);
  }

  getValue() {
    return this.rootFormFiled?.getValue();
  }

  async validate() {
    if (!this.rootFormFiled) {
      return;
    }

    const error = await this.rootFormFiled.validate();

    return error;
  }

  isDirty() {
    return this.dirtyFields.size > 0;
  }

  isValid() {
    return this.errorFields.size === 0;
  }

  on(name: string, cb: Function) {
    this.events?.on(name, cb);
  }
}