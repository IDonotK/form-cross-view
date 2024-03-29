// import { Form } from "../form-cross-view/src/Form";
// import FormNode from "../form-cross-view/src/FormNode";

// export function createViewNative(node: FormNode) {
//   const {
//     __fieldName__: fieldName, __type__: type, __comment__: comment,
//   } = node;

//   const refs: { [k: string]: HTMLElement } = {};

//   refs.containerRef = createContainer();
//   refs.commentRef = createCommentDom(comment);
//   refs.labelRef = createLabelDom(type, fieldName);
//   refs.valueRef = createValueDom(descriptorCompiled);
//   refs.errorRef = createErrorDom();

//   node.viewCtx.addChild = (_node: FormNode) => {
//     const { valueRef } = node.viewCtx.refs;
//     const { containerRef } = _node.viewCtx.refs;
//     valueRef.appendChild(containerRef);
//   }
//   node.viewCtx.setValue = genSetValue(type);
//   node.viewCtx.displayValue = () => {
//     const { valueVisibleCtrlRef, valueRef } = node.viewCtx.refs;
//     valueVisibleCtrlRef?.classList.remove(styles.unfold || 'fold');
//     valueRef?.classList.remove(styles.fold || 'fold');
//   }
//   node.viewCtx.hideValue = () => {
//     const { valueVisibleCtrlRef, valueRef } = node.viewCtx.refs;
//     valueVisibleCtrlRef?.classList.add(styles.fold || 'fold');
//     valueRef?.classList.add(styles.fold || 'fold');
//   }
//   node.viewCtx.displayError = (message: string) => {
//     const { errorRef } = node.viewCtx.refs;
//     errorRef.innerText = `${message}`;
//     errorRef.classList.remove(styles.hidden || 'hidden');
//   }
//   node.viewCtx.hideError = () => {
//     const { errorRef } = node.viewCtx.refs;
//     errorRef.innerText = '';
//     errorRef.classList.add(styles.hidden || 'hidden');
//   }

//   refs.containerRef.appendChild(refs.commentRef);
//   refs.containerRef.appendChild(refs.labelRef);
//   refs.containerRef.appendChild(refs.valueRef);
//   refs.containerRef.appendChild(refs.errorRef);

//   node.viewCtx.refs = refs;

//   function createContainer(): HTMLElement {
//     const dom = document.createElement('div');
//     dom.className = styles.formField || 'formField';
//     return dom;
//   }

//   function createCommentDom(comment: string): HTMLElement {
//     const dom = document.createElement('div');
//     dom.className = styles.comment || 'comment';
//     dom.innerText = `${comment}`;
//     return dom;
//   }

//   function createLabelDom(type: string, fieldName: string): HTMLElement {
//     fieldName = fieldName === 'root' ? 'settings' : fieldName;
//     if (node.isArrayItem) {
//       fieldName = `item${fieldName}`;
//     }

//     let dom: HTMLElement;
//     switch(type) {
//       case 'array':
//       case 'object': {
//         dom = document.createElement('div');

//         const valueVisibleCtrlDom = createValueVisibleCtrlDom();

//         const name = document.createElement('span');
//         name.innerText = `${fieldName}`;

//         refs.valueVisibleCtrlRef = valueVisibleCtrlDom;

//         dom.appendChild(valueVisibleCtrlDom);
//         dom.appendChild(name);
//         break;
//       }
//       case 'method': {
//         dom = document.createElement('div');

//         const name = document.createElement('span');
//         name.innerText = `${fieldName}`;

//         const blocklyVisibleCtrlDom = document.createElement('button');
//         blocklyVisibleCtrlDom.innerText = 'open blockly';
//         blocklyVisibleCtrlDom.onclick = () => {
//           node.controller?.form?.blockly?.open(node.controller);
//         }

//         dom.appendChild(name);
//         dom.appendChild(blocklyVisibleCtrlDom);
//         break;
//       }
//       default: {
//         dom = document.createElement('div');
//         dom.innerText = `${fieldName}`;
//       }
//     }
//     dom.classList.add(styles.fieldName || 'fieldName');
//     return dom;
//   }

//   function createValueVisibleCtrlDom(): HTMLElement {
//     const dom = document.createElement('span');
//     dom.innerText = '>';
//     dom.classList.add(styles.valueVisibleCtrl || 'valueVisibleCtrl');
//     dom.onclick = () => {
//       node.valueVisible = !node.valueVisible;
//     }
//     return dom;
//   }

//   function createValueDom(descriptorCompiled: DescriptorCompiled): HTMLElement {
//     const { __type__: type, __descriptor__: descriptor, __value__: value } = descriptorCompiled;

//     let dom: HTMLElement;
//     switch(type) {
//       case 'array':
//       case 'object': {
//         dom = document.createElement('div');
//         break;
//       }
//       case 'string': {
//         dom = document.createElement('input');
//         (dom as HTMLInputElement).type = 'text';
//         (dom as HTMLInputElement).value = value;
//         dom.oninput = async (e) => {
//           await node.onViewChange(String(e.target?.value));
//         }
//         break;
//       }
//       case 'number': {
//         dom = document.createElement('input');
//         (dom as HTMLInputElement).type = 'text';
//         (dom as HTMLInputElement).value = value;
//         dom.oninput = async (e) => {
//           await node.onViewChange(Number(e.target?.value));
//         }
//         break;
//       }
//       case 'integer': {
//         const { min = -Infinity, max = Infinity } = descriptor;
//         dom = document.createElement('input');
//         (dom as HTMLInputElement).type = 'number';
//         (dom as HTMLInputElement).min = min;
//         (dom as HTMLInputElement).max = max;
//         (dom as HTMLInputElement).value = value;
//         dom.oninput = async (e) => {
//           await node.onViewChange(Number(e.target?.value));
//         }
//         break;
//       }
//       case 'float': {
//         dom = document.createElement('input');
//         (dom as HTMLInputElement).type = 'text';
//         (dom as HTMLInputElement).value = value;
//         dom.oninput = async (e) => {
//           await node.onViewChange(Number(e.target?.value));
//         }
//         break;
//       }
//       case 'boolean': {
//         dom = document.createElement('div');
//         const name = genId();

//         const trueRadio = document.createElement('input');
//         (trueRadio as HTMLInputElement).type = 'radio';
//         (trueRadio as HTMLInputElement).name = name;
//         (trueRadio as HTMLInputElement).value = 'true';
//         trueRadio.onclick = async (e) => {
//           if (e.target?.checked) {
//             await node.onViewChange(true);
//           }
//         }
//         const trueLabel = document.createElement('span');
//         trueLabel.innerText = 'true';
//         trueLabel.style.color = '#fff';
//         trueLabel.style.marginRight = '10px';

//         const falseRadio = document.createElement('input');
//         (falseRadio as HTMLInputElement).type = 'radio';
//         (falseRadio as HTMLInputElement).name = name;
//         (falseRadio as HTMLInputElement).value = 'false';
//         falseRadio.onclick = async (e) => {
//           if (e.target?.checked) {
//             await node.onViewChange(false);
//           }
//         }
//         const falseLabel = document.createElement('span');
//         falseLabel.innerText = 'false';
//         falseLabel.style.color = '#fff';

//         if (node.controller?.getValue() === true) {
//           trueRadio.checked = true;
//         } else {
//           falseRadio.checked = true;
//         }

//         dom.appendChild(trueRadio);
//         dom.appendChild(trueLabel);
//         dom.appendChild(falseRadio);
//         dom.appendChild(falseLabel);

//         break;
//       }
//       case 'method': {
//         dom = document.createElement('div');
//         dom.classList.add(styles.simpleValue || 'simpleValue');
//         const valueClean = node.controller!.form!.blockly!.cullCodeBlockly(value);
//         dom.innerText = valueClean?.toString() || '';
//         break;
//       }
//       case 'enum': {
//         dom = document.createElement('div');
//         const name = genId();

//         const values = (node.controller?.descriptor?.enum || []).map((v: any) => String(v));
//         const value = String(node.controller?.getValue());

//         values.forEach((v: string) => {
//           const radio = document.createElement('input');
//           (radio as HTMLInputElement).type = 'radio';
//           (radio as HTMLInputElement).name = name;
//           (radio as HTMLInputElement).value = v;
//           radio.onclick = async (e) => {
//             if (e.target?.checked) {
//               await node.onViewChange(v);
//             }
//           }
//           radio.checked = v === value;

//           const label = document.createElement('span');
//           label.innerText = v;
//           label.style.color = '#fff';
//           label.style.marginRight = '10px';

//           dom.appendChild(radio);
//           dom.appendChild(label);
//         });

//         break;
//       }
//       case 'regexp': {
//         dom = document.createElement('input');
//         (dom as HTMLInputElement).type = 'text';
//         (dom as HTMLInputElement).value = value;
//         dom.oninput = async (e) => {
//           await node.onViewChange(String(e.target?.value));
//         }
//         break;
//       }
//       case 'date': {
//         dom = document.createElement('input');
//         (dom as HTMLInputElement).type = 'date';
//         (dom as HTMLInputElement).value = value;
//         dom.oninput = async (e) => {
//           await node.onViewChange(e.target?.value);
//         }
//         break;
//       }
//       case 'url': {
//         dom = document.createElement('input');
//         (dom as HTMLInputElement).type = 'text';
//         (dom as HTMLInputElement).value = value;
//         dom.oninput = async (e) => {
//           await node.onViewChange(String(e.target?.value));
//         }
//         break;
//       }
//       case 'hex': {
//         dom = document.createElement('input');
//         (dom as HTMLInputElement).type = 'text';
//         (dom as HTMLInputElement).value = value;
//         dom.oninput = async (e) => {
//           await node.onViewChange(String(e.target?.value));
//         }
//         break;
//       }
//       case 'email': {
//         dom = document.createElement('input');
//         (dom as HTMLInputElement).type = 'text';
//         (dom as HTMLInputElement).value = value;
//         dom.oninput = async (e) => {
//           await node.onViewChange(String(e.target?.value));
//         }
//         break;
//       }
//       default: {
//         dom = document.createElement('div');
//         dom.innerText = `${value}`;
//       }
//     }
//     dom.classList.add(styles.fieldValue || 'fieldValue');

//     return dom;
//   }

//   function genSetValue(type: string) {
//     let setValue = (value: any) => {};

//     switch (type) {
//       case 'object': break;
//       case 'array': break;
//       case 'method': {
//         setValue = (value: any) => {
//           const { valueRef } = node.viewCtx.refs;
//           const valueClean = node.controller!.form!.blockly!.cullCodeBlockly(value);
//           valueRef!.innerText = valueClean?.toString() || '';
//         }
//         break;
//       }
//       case 'boolean':
//       case 'enum': {
//         setValue = (value: any) => {
//           const { valueRef } = node.viewCtx.refs;
//           Array.from(valueRef?.children || []).forEach(c => {
//             c.checked = c.value === String(value);
//           });
//         }
//         break;
//       }
//       case 'string':
//       case 'number':
//       case 'integer':
//       case 'float':
//       case 'regexp':
//       case 'date':
//       case 'url':
//       case 'hex':
//       case 'email': {
//         setValue = (value: any) => {
//           const { valueRef } = node.viewCtx.refs;
//           valueRef!.value = value;
//         }
//         break;
//       }
//       default: {
//         setValue = (value: any) => {
//           const { valueRef } = node.viewCtx.refs;
//           valueRef!.innerText = value;
//         }
//       }
//     }

//     return setValue;
//   }

//   function createErrorDom() {
//     const dom = document.createElement('div') as HTMLElement;
//     dom.classList.add(styles.error || 'error', styles.hidden || 'hidden');
//     return dom;
//   }
// }

// export function mountViewNative(form: Form) {
//   form.container.appendChild(form.rootFormFiled?.node?.viewCtx?.refs?.containerRef);
// }