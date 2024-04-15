import { Form, FormField } from '@form-cross-view/core';

import stylesDefault from './index.module.scss';

interface Styles { [k: string]: any }

export function genCreateViewNative(styles?: Styles) {
  if (!styles) {
    styles = stylesDefault;
  }

  const getClass = (styles: Styles | undefined, name: string) => {
    return styles?.[name] || name;
  }

  return function createViewNative(controller: FormField) {  
    const refs: { [k: string]: HTMLElement } = {};
  
    refs.containerRef = createContainer();

    refs.commentRef = createCommentDom();
    refs.containerRef.appendChild(refs.commentRef);

    refs.labelRef = createLabelDom();
    refs.containerRef.appendChild(refs.labelRef);

    const valueDom = createValueDom();
    refs.valueRef = valueDom.innerValueRef || valueDom;
    refs.containerRef.appendChild(valueDom);

    refs.errorRef = createErrorDom();
    refs.containerRef.appendChild(refs.errorRef);
  
    controller.viewCtx.refs = refs;

    controller.viewCtx.syncChildren = () => {
      console.log('syncChildren');
      const { children } = controller;
      const { valueRef } = controller.viewCtx.refs;
      valueRef.innerHTML = '';
      children.forEach((childNode: FormField) => {
        valueRef.appendChild(childNode.viewCtx.refs.containerRef);
      });
    };
  
    function createContainer(): HTMLElement {
      const dom = document.createElement('div');
      dom.className = getClass(styles, 'formField');
      return dom;
    }
  
    function createCommentDom(): HTMLElement {
      const dom = document.createElement('div');
      dom.className = getClass(styles, 'comment');
      dom.innerText = `${controller.comment}`;
      return dom;
    }
  
    function createLabelDom(): HTMLElement {
      const formatName = (name: string) => {
        if (controller.isArrayItem) {
          return `item-${name}`;
        }
        return name;
      }
      const label = formatName(controller.name);
  
      let dom: HTMLElement;
      switch(controller.type) {
        case 'array':
        case 'object': {
          dom = document.createElement('div');
  
          const valueVisibleCtrlDom = createValueVisibleCtrlDom();
  
          const nameDom = document.createElement('span');
          nameDom.innerText = `${label}`;
          controller.viewCtx.setName = (name: string) => {
            nameDom.innerText = `${formatName(name)}`;
          }
  
          refs.valueVisibleCtrlRef = valueVisibleCtrlDom;
  
          dom.appendChild(valueVisibleCtrlDom);
          dom.appendChild(nameDom);
          break;
        }
        default: {
          dom = document.createElement('div');
          const nameDom = document.createElement('span');
          nameDom.innerText = `${label}`;
          controller.viewCtx.setName = (name: string) => {
            nameDom.innerText = `${formatName(name)}`;
          }
          dom.appendChild(nameDom);
        }
      }

      if (controller.isArrayItem) {
        const onMoveUp = async () => {
          await controller.onValueChange({
            source: 'operation',
            value: 'moveUp',
          });
        }
        const onMoveDown = async () => {
          await controller.onValueChange({
            source: 'operation',
            value: 'moveDown',
          });
        }
        const onDelete = async () => {
          await controller.onValueChange({
            source: 'operation',
            value: 'delete',
          });
        }
        const onCopy = async () => {
          await controller.onValueChange({
            source: 'operation',
            value: 'copy',
          });
        }

        const operationsDom = document.createElement('div');
        operationsDom.classList.add(getClass(styles, 'operations'));

        const moveUpBtn = document.createElement('span');
        moveUpBtn.classList.add(getClass(styles, 'item'));
        moveUpBtn.innerText = '上移';
        moveUpBtn.onclick = onMoveUp;
        operationsDom.appendChild(moveUpBtn);

        const moveDownBtn = document.createElement('span');
        moveDownBtn.classList.add(getClass(styles, 'item'));
        moveDownBtn.innerText = '下移';
        moveDownBtn.onclick = onMoveDown;
        operationsDom.appendChild(moveDownBtn);

        const deleteBtn = document.createElement('span');
        deleteBtn.classList.add(getClass(styles, 'item'));
        deleteBtn.innerText = '删除';
        deleteBtn.onclick = onDelete;
        operationsDom.appendChild(deleteBtn);

        const copyBtn = document.createElement('span');
        copyBtn.classList.add(getClass(styles, 'item'));
        copyBtn.innerText = '复制';
        operationsDom.appendChild(copyBtn);
        copyBtn.onclick = onCopy;

        dom.appendChild(operationsDom);
      }

      dom.classList.add(getClass(styles, 'fieldName'));
      
      return dom;
    }
  
    function createValueVisibleCtrlDom(): HTMLElement {
      const dom = document.createElement('span');
      dom.innerText = '>';
      dom.classList.add(getClass(styles, 'valueVisibleCtrl'));
      dom.onclick = () => {
        controller.valueVisible = !controller.valueVisible;
      }
      controller.viewCtx.setValueVisible = (visible: boolean) => {
        const { valueVisibleCtrlRef, valueRef } = controller.viewCtx.refs;
        if (visible) {
          valueVisibleCtrlRef?.classList.remove(getClass(styles, 'fold'));
          (valueRef?.outerValueRef || valueRef)?.classList.remove(getClass(styles, 'fold'));
        } else {
          valueVisibleCtrlRef?.classList.add(getClass(styles, 'fold'));
          (valueRef?.outerValueRef || valueRef)?.classList.add(getClass(styles, 'fold'));
        }
      }
      return dom;
    }
  
    function createValueDom(): HTMLElement {
      const value = controller.getValue();
  
      let dom: HTMLElement;
      switch(controller.type) {
        case 'object': {
          dom = document.createElement('div');
          break;
        }
        case 'array': {
          dom = document.createElement('div');

          const innerValueDom = document.createElement('div');
          innerValueDom.classList.add(getClass(styles, 'innerFieldValue'));
          dom.appendChild(innerValueDom);
          dom.innerValueRef = innerValueDom;
          innerValueDom.outerValueRef = dom;

          const onAddItem = async () => {
            await controller.onValueChange({
              source: 'operation',
              value: 'addItem',
            });
          }
          const operationsDom = document.createElement('div');
          operationsDom.classList.add(getClass(styles, 'operations'));
          const addBtn = document.createElement('button');
          addBtn.innerText = '+ add item';
          addBtn.onclick = onAddItem;
          operationsDom.appendChild(addBtn);

          dom.appendChild(operationsDom);
          break;
        }
        case 'string': {
          dom = document.createElement('input');
          (dom as HTMLInputElement).type = 'text';
          (dom as HTMLInputElement).value = value;
          dom.oninput = async (e) => {
            await controller.onValueChange({
              source: 'input',
              value: String(e.target?.value),
            });
          }
          controller.viewCtx.setValue = (value: string) => {
            (dom as HTMLInputElement).value = value;
          }
          break;
        }
        case 'float':
        case 'integer':
        case 'number': {
          dom = document.createElement('input');
          (dom as HTMLInputElement).type = 'text';
          (dom as HTMLInputElement).value = value;
          dom.oninput = async (e) => {
            let valueCur = e.target?.value;
            if (valueCur.trim() !== '') {
              valueCur = Number(valueCur);
            }
            await controller.onValueChange({
              source: 'input',
              value: valueCur,
            });
          }
          controller.viewCtx.setValue = (value: number) => {
            (dom as HTMLInputElement).value = String(value);
          }
          break;
        }
        case 'boolean': {
          dom = document.createElement('div');
          const name = controller.utils.genId();

          [true, false].forEach((v: boolean) => {
            const radioDom = document.createElement('input');
            (radioDom as HTMLInputElement).type = 'radio';
            (radioDom as HTMLInputElement).name = name;
            (radioDom as HTMLInputElement).value = String(v);
            radioDom.onclick = async (e) => {
              if (e.target?.checked) {
                await controller.onValueChange({
                  source: 'input',
                  value: v,
                });
              }
            }
            radioDom.checked = value === v;

            const labelDom = document.createElement('span');
            labelDom.innerText = String(v);
            labelDom.style.color = '#fff';
            labelDom.style.marginRight = '10px';

            dom.appendChild(radioDom);
            dom.appendChild(labelDom);
          });

          controller.viewCtx.setValue = (value: boolean) => {
            Array.from(dom.children).forEach(c => {
              if ((c as HTMLInputElement).type === 'radio') {
                (c as HTMLInputElement).checked = (c as HTMLInputElement).value === String(value); 
              }
            });
          }
  
          break;
        }
        case 'enum': {
          dom = document.createElement('div');
          const name = controller.utils.genId();
  
          const values = controller.descriptor?.enum || [];
  
          values.forEach((v: string) => {
            const radioDom = document.createElement('input');
            (radioDom as HTMLInputElement).type = 'radio';
            (radioDom as HTMLInputElement).name = name;
            (radioDom as HTMLInputElement).value = v;
            radioDom.onclick = async (e) => {
              if (e.target?.checked) {
                await controller.onValueChange({
                  source: 'input',
                  value: e.target?.value,
                });
              }
            }
            radioDom.checked = v === value;
  
            const labelDom = document.createElement('span');
            labelDom.innerText = v;
            labelDom.style.color = '#fff';
            labelDom.style.marginRight = '10px';
  
            dom.appendChild(radioDom);
            dom.appendChild(labelDom);
          });

          controller.viewCtx.setValue = (value: string) => {
            Array.from(dom.children).forEach(c => {
              if ((c as HTMLInputElement).type === 'radio') {
                (c as HTMLInputElement).checked = (c as HTMLInputElement).value === value; 
              }
            });
          }
  
          break;
        }
        default: {
          dom = document.createElement('div');
          dom.innerText = `${value}`;
          controller.viewCtx.setValue = (value: any) => {
            dom.innerText = `${value}`;
          }
        }
      }
      dom.classList.add(getClass(styles, 'fieldValue'));
  
      return dom;
    }
  
    function createErrorDom() {
      const dom = document.createElement('div') as HTMLElement;
      dom.classList.add(getClass(styles, 'error'), getClass(styles, 'hidden'));
      controller.viewCtx.setError = (message?: string) => {
        const { errorRef } = controller.viewCtx.refs;
        if (message) {
          errorRef.innerText = `${message}`;
          errorRef.classList.remove(getClass(styles, 'hidden'));
        } else {
          errorRef.innerText = '';
          errorRef.classList.add(getClass(styles, 'hidden'));
        }
      }
      return dom;
    }
  }
}

export function genMountViewNative() {
  return function mountViewNative(form: Form) {
    const { rootFormFiled } = form;
    if (!rootFormFiled) {
      return;
    }

    const traverse = (field: FormField) => {
      const { viewCtx, children } = field;
      const { containerRef, valueRef } = viewCtx.refs;
      children.forEach((childNode: FormField) => {
        valueRef.appendChild(traverse(childNode));
      });
      return containerRef;
    }

    form.container.appendChild(traverse(rootFormFiled));
  }
}