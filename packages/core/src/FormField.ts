import { cloneDeep } from 'lodash-es';

import { Form, Utils } from './Form';
import {
  validateField,
  DescriptorCompiled,
  FieldValidateError as FormFieldError,
} from './validator';

export interface ViewCtx {
  syncChildren?: () => void;
  setValue?: (value: any) => void;
  setName?: (name: string) => void;
  setValueVisible?: (visible: boolean) => void;
  setError?: (message?: string) => void;
  [k: string]: any;
}

function callViewCtxApi(field: FormField, api: string, ...args: any[]) {
  if (typeof field.viewCtx?.[api] === 'function') {
    try {
      field.viewCtx[api].call(field, ...args);
    } catch (e) {
      console.log(e);
    }
  }
}

export class FormField {
  id: string;

  type: string;

  name: string;

  comment: string;

  private _valueInit: any;

  private _value: any;

  private _orderInit: number = 0;

  path: string;

  isArrayItem: boolean;

  descriptor: any;

  descriptorCompiled: DescriptorCompiled;

  form: Form;

  isDirty: boolean = false;

  error: FormFieldError[] | null = null;

  parent: FormField | null = null;

  children: FormField[] = [];

  utils: Utils;

  private _isValueVisible: boolean = true;

  viewCtx: ViewCtx = {};

  constructor(descriptorCompiled: DescriptorCompiled, form: Form) {
    this.form = form;
    this.utils = form.utils;
    this.id = form.utils.genId();
    form.formFields.set(this.id, this);

    const {
      type, fieldName, comment, defaultValue, order, path, isArrayItem, descriptor,
    } = descriptorCompiled;

    this.descriptorCompiled = descriptorCompiled;
    this.type = type ?? '';
    this.name = fieldName ?? '';
    this.comment = comment ?? '';
    this._valueInit = defaultValue;
    this._value = defaultValue;
    this._orderInit = order ?? 0;
    this.path = path ?? '';
    this.isArrayItem = isArrayItem ?? false;
    this.descriptor = descriptor;

    this.form.createView(this);
  }

  get valueVisible() {
    return this._isValueVisible;
  }

  set valueVisible(visible: boolean) {
    this._isValueVisible = visible;
    callViewCtxApi(this, 'setValueVisible', visible);
  }

  newChild(descriptorCompiled: DescriptorCompiled) {
    const { form } = this;
    const numChild = this.children.length;
    descriptorCompiled.fieldName = String(numChild);
    const { path: pathRootOrigin = '' } = descriptorCompiled;
    const pathRootNew = pathRootOrigin.replace(/([^.]+)$/, String(numChild));

    const traverse = (_descriptorCompiled: DescriptorCompiled) => {
      const { type = '', fields, path = '' } = _descriptorCompiled;
      _descriptorCompiled.path = path.replace(pathRootOrigin, pathRootNew);
      const formField = new FormField(_descriptorCompiled, form);
      if (['object', 'array'].includes(type) && fields) {
        Object.keys(fields).forEach((f: string) => {
          const formFieldChild = traverse(fields[f]);
          formField.addChild(formFieldChild, true);
        });
      }
      return formField;
    }
    const formFieldChild = traverse(descriptorCompiled);
    return formFieldChild;
  }

  createChild() {
    const { descriptorCompiled } = this;
    const { fields = {} } = descriptorCompiled;
    let descriptorCompiledChild = fields[Object.keys(fields).length - 1];
    if (!descriptorCompiledChild) {
      console.log(descriptorCompiled);
      throw Error('missing descriptorCompiledChild');
    }

    descriptorCompiledChild = cloneDeep(descriptorCompiledChild);
    const formFieldChild = this.newChild(descriptorCompiledChild);
    return formFieldChild;
  }

  copyChild(field: FormField) {
    const { descriptorCompiled } = field;

    const descriptorCompiledChild = cloneDeep(descriptorCompiled);

    const formFieldChild = this.newChild(descriptorCompiledChild);
    
    // TODO: delay to setValue after mount?
    formFieldChild.setValue(field.getValue());

    return formFieldChild;
  }

  addChild(field: FormField, syncView: boolean = false) {
    this.utils.addArrayItem(this.children, field);
    field.parent = this;
    if (syncView) {
      callViewCtxApi(this, 'syncChildren');
    }
  }

  moveChild(field: FormField, gap: number) {
    const range = this.utils.moveArrayItem(this.children, field, gap);
    if (range) {
      const [indexStart, indexEnd] = range;
      this.syncChildrenInfo(indexStart, indexEnd);
    }
    callViewCtxApi(this, 'syncChildren');
  }

  removeChild(field: FormField) {
    const range = this.utils.removeArrayItem(this.children, field);
    field.parent = null;
    if (range) {
      const [indexStart, indexEnd] = range;
      this.syncChildrenInfo(indexStart, indexEnd);
    }
    callViewCtxApi(this, 'syncChildren');
  }

  syncChildrenInfo(indexStart: number, indexEnd: number) {
    const { type, children } = this;
    if (type !== 'array') {
      return;
    }
    const updatePath = (f: FormField, p: string, base: string) => {
      f.path = f.path.replace(base, p);
      f.children.forEach(_f => updatePath(_f, p, base));
    }
    for (let i = indexStart; i <= indexEnd; i++) {
      const child = children[i];
      const { name, path } = child;
      const nameTarget = String(i);
      if (name === nameTarget) {
        continue;
      } else {
        child.name = nameTarget;
        const pathTarget = path.replace(/([^.]+)$/, '') + nameTarget;
        updatePath(child, pathTarget, path);
        callViewCtxApi(child, 'setName', nameTarget);
      }
    }
  }

  async validate(): Promise<FormFieldError[] | null> {
    const { name, descriptor, path } = this;

    const valueNew = this.getValue();
    const errorOrigin = await validateField(name, valueNew, descriptor);
    let error = errorOrigin?.data || null;

    if (error) {
      // console.log('validate', valueNew, descriptor);
      const pathBase = path.replace(/([^.]+)$/, '');
      error = error.map((e: FormFieldError) => {
        const { field = '', message = '' } = e;
        const names = field.split('.');
        const name = names[names.length - 1];
        return {
          ...e,
          field: `${pathBase ? `${pathBase}${field}` : field}`,
          message: message.replace(field, name),
        }
      });
      const distributeError = (formField: FormField, error: FormFieldError[]) => {
        const { path, children } = formField;
        const errorCur = error.filter(e => e.field === path);
        formField.setError(errorCur);
        children.forEach(c => distributeError(c, error));
      }
      distributeError(this, error);
    } else {
      const { errorFields } = this.form;
      const clearError = (formField: FormField) => {
        const { id, children } = formField;
        if (errorFields.has(id)) {
          formField.setError(null);
        }
        children.forEach(c => clearError(c));
      }
      clearError(this);
    }

    return error;
  }

  setError(error: FormFieldError[] | null) {
    const {
      id, form
    } = this;

    if (error?.length) {
      this.error = error;
      const message = error.map(e => e.message).join(';\n');
      callViewCtxApi(this, 'setError', message);
      form.errorFields.set(id, this);
    } else {
      this.error = null;
      callViewCtxApi(this, 'setError');
      form.errorFields.delete(id);
    }
  }

  isValueDirty(valueNew: any, valueOld: any): boolean {
    let isDirty = false;
    switch(this.type) {
      case 'object': break;
      case 'array': {
        if (valueNew.length === valueOld.length) {
          const { children } = this;
          for (let i = 0, len = children.length; i < len; i++) {
            if (children[i]._orderInit !== i) {
              isDirty = true;
              break;
            }
          }
        } else {
          isDirty = true;
        }
        break;
      }
      default: {
        if (valueNew !== valueOld) {
          isDirty = true;
        }
      }
    }
    return isDirty;
  }

  // V => VM => M
  async onValueChange(
    data: { source: 'input', value: any } |
    { source: 'operation', value: 'addItem' | 'moveUp' | 'moveDown' | 'delete' | 'copy' }
  ) {
    const { source, value } = data;

    let fieldChanged: FormField | null = null;

    let valueNew: any;

    switch(source) {
      case 'input': {
        fieldChanged = this;
        valueNew = value;
        break;
      }
      case 'operation': {
        switch(value) {
          case 'addItem': {
            fieldChanged = this;
            const formFieldChild = fieldChanged.createChild();
            fieldChanged.addChild(formFieldChild, true);
            valueNew = fieldChanged.getValue();
            break;
          }
          case 'moveUp': {
            fieldChanged = this.parent;
            fieldChanged?.moveChild(this, -1);
            valueNew = fieldChanged?.getValue();
            break;
          }
          case 'moveDown': {
            fieldChanged = this.parent;
            fieldChanged?.moveChild(this, 1);
            valueNew = fieldChanged?.getValue();
            break;
          }
          case 'delete': {
            fieldChanged = this.parent;
            fieldChanged?.removeChild(this);
            valueNew = fieldChanged?.getValue();
            break;
          }
          case 'copy': {
            fieldChanged = this.parent;
            if (fieldChanged) {
              const formFieldChild = fieldChanged.copyChild(this);
              fieldChanged.addChild(formFieldChild, true);
            }
            valueNew = fieldChanged?.getValue();
            break;
          }
          default:
        }
        break;
      }
      default:
    }

    if (!fieldChanged) {
      return;
    }

    const {
      _valueInit: valueOld, form
    } = fieldChanged;

    fieldChanged.isDirty = fieldChanged.isValueDirty(valueNew, valueOld);

    fieldChanged._value = valueNew;

    await fieldChanged?.validate();

    await form?.onFieldChange(valueNew, valueOld, fieldChanged);
  }

  // M => VM => V
  setValue(valueNew: any) {
    if (valueNew === undefined) {
      return;
    }

    this._valueInit = valueNew;
    this._value = valueNew;
    this.isDirty = false;

    const { type } = this;

    if (type === 'object') {
      this.children.forEach(f => f.setValue(valueNew?.[f.name]));
    } else if (type === 'array') {
      const valueCur = this.getValue();
      const lenNew = valueNew.length;
      const lenCur = valueCur.length;
      let i;
      for (i = 0; i <= lenNew - 1; i++) {
        if (i <= lenCur - 1) {
          this.children[i].setValue(valueNew[i]);
          this.children[i]._orderInit = i;
        } else {
          const formFieldChild = this.createChild();

          // TODO: delay to setValue after mount?
          formFieldChild.setValue(valueNew[i]);
          
          formFieldChild._orderInit = i;
          this.addChild(formFieldChild, true);
        }
      }
      if (i < lenCur) {
        for (let j = lenCur - 1; j >= i; j--) {
          this.removeChild(this.children[j]);
        }
      }
    } else {
      callViewCtxApi(this, 'setValue', valueNew);
    }
  }

  getValue() {
    const { type } = this;
    let target: any;
    if (type === 'object') {
      target = {};
      this.children.forEach((field: FormField) => {
        target[field.name] = field.getValue();
      });
    } else if (type === 'array') {
      target = [];
      this.children.forEach((field: FormField) => {
        target.push(field.getValue());
      });
    } else {
      target = this._value;
    }
    return target;
  }
}