import FormField from './FormField';
import { Styles, DescriptorCompiled } from './Form';

export type ViewCtx = {
  [k: string]: any;
  addChild?: (node: FormNode) => void;
  moveChild?: (node: FormNode, gap: number) => void;
  removeChild?: (node: FormNode) => void;
  setValue?: (value: any) => void;
  displayValue?: () => void;
  hideValue?: () => void;
  displayError?: (message: string) => void;
  hideError?: () => void;
}

export default class FormNode {
  type: string;

  name: string;

  controller: FormField;

  private _isValueVisible: boolean = true;

  isViewLazy: boolean;

  viewCtx: ViewCtx = {};

  constructor(descriptorCompiled: DescriptorCompiled, controller: FormField) {
    const {
      fieldName, type,
    } = descriptorCompiled;

    this.type = type;
    this.name = fieldName;

    this.controller = controller;

    this.isViewLazy = ['method'].includes(type);

    this.controller.form.createView(this, styles);
  }

  get valueVisible() {
    return this._isValueVisible;
  }

  set valueVisible(state: boolean) {
    this._isValueVisible = state;

    if (state) {
      if (typeof this.viewCtx?.displayValue === 'function') {
        this.viewCtx?.displayValue();
      }
    } else {
      if (typeof this.viewCtx?.hideValue === 'function') {
        this.viewCtx?.hideValue();
      }
    }
  }

  addChild(node: FormNode) {
    if (typeof this.viewCtx?.addChild === 'function') {
      this.viewCtx?.addChild(node);
    }
  }

  moveChild(node: FormNode, gap: number = 1) {
    if (typeof this.viewCtx?.moveChild === 'function') {
      this.viewCtx?.moveChild(node, gap);
    }
  }

  removeChild(node: FormNode) {
    if (typeof this.viewCtx?.removeChild === 'function') {
      this.viewCtx?.removeChild(node);
    }
  }

  // V => VM
  async onViewChange(data: { source: 'input' | 'operation', value: any }) {
    await this.controller.onValueChange(data);
  }

  // VM => V
  setView(value: any) {
    if (typeof this.viewCtx?.setValue === 'function') {
      this.viewCtx?.setValue(value);
    }
  }

  displayError(message: string) {
    if (typeof this.viewCtx?.displayError === 'function') {
      this.viewCtx?.displayError(message);
    }
  }

  hideError() {
    if (typeof this.viewCtx?.hideError === 'function') {
      this.viewCtx?.hideError();
    }
  }
}