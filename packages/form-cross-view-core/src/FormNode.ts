import { FormField } from './FormField';

export type ViewCtx = {
  syncChildren?: () => void;
  setValue?: (value: any) => void;
  setName?: (name: string) => void;
  setValueVisible?: (visible: boolean) => void;
  setError?: (message?: string) => void;
  [k: string]: any;
}

export class FormNode {
  controller: FormField;

  private _isValueVisible: boolean = true;

  viewCtx: ViewCtx = {};

  children: FormNode[] = [];

  constructor(controller: FormField) {
    this.controller = controller;

    this.controller.form.createView(this);
  }

  get valueVisible() {
    return this._isValueVisible;
  }

  set valueVisible(state: boolean) {
    this._isValueVisible = state;
    if (typeof this.viewCtx?.setValueVisible === 'function') {
      this.viewCtx?.setValueVisible(state);
    }
  }

  addChild(node: FormNode, syncView: boolean = false) {
    this.controller.utils.addArrayItem(this.children, node);
    if (syncView && typeof this.viewCtx?.syncChildren === 'function') {
      this.viewCtx?.syncChildren();
    }
  }

  moveChild(node: FormNode, gap: number) {
    this.controller.utils.moveArrayItem(this.children, node, gap);
    if (typeof this.viewCtx?.syncChildren === 'function') {
      this.viewCtx?.syncChildren();
    }
  }

  removeChild(node: FormNode) {
    this.controller.utils.removeArrayItem(this.children, node);
    if (typeof this.viewCtx?.syncChildren === 'function') {
      this.viewCtx?.syncChildren();
    }
  }

  // V => VM
  async onViewChange(data: { source: 'input' | 'operation', value: any }) {
    await this.controller.onValueChange(data);
  }

  // VM => V
  setValue(value: any) {
    if (typeof this.viewCtx?.setValue === 'function') {
      this.viewCtx?.setValue(value);
    }
  }

  setName(name: string) {
    if (typeof this.viewCtx?.setName === 'function') {
      this.viewCtx?.setName(name);
    }
  }

  setError(message?: string) {
    if (typeof this.viewCtx?.setError === 'function') {
      this.viewCtx?.setError(message);
    }
  }
}