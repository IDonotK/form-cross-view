import { createSignal, For } from 'solid-js';
import { Form, FormField } from '@form-cross-view/core';

import stylesDefault from './index.module.scss';

interface Styles { [k: string]: any }

interface Props { [ k: string]: any }

export function genCreateViewSolid(styles?: Styles) {
  if (!styles) {
    styles = stylesDefault;
  }

  const getClass = (styles: Styles | undefined, name: string) => {
    return styles?.[name] || name;
  }

  return function createViewSolid(controller: FormField) {
    const Container = (props: Props) => {
      return (
        <div class={getClass(styles, 'formField')}>{props.children}</div>
      )
    }

    const Comment = (props: Props) => {
      return (
        <div class={getClass(styles, 'comment')}>{props.comment()}</div>
      )
    }

    const Label = (props: Props) => {
      const FieldOperations = () => {
        if (!controller.isArrayItem) {
          return (<></>);
        }

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

        return (
          <div class={getClass(styles, 'operations')}>
            <span class={getClass(styles, 'item')} onClick={onMoveUp}>上移</span>
            <span class={getClass(styles, 'item')} onClick={onMoveDown}>下移</span>
            <span class={getClass(styles, 'item')} onClick={onDelete}>删除</span>
            <span class={getClass(styles, 'item')} onClick={onCopy}>复制</span>
          </div>
        )
      }
      switch(controller.type) {
        case 'array':
        case 'object': {
          return (
            <div class={getClass(styles, 'fieldName')}>
              <span
                classList={{
                  [getClass(styles, 'valueVisibleCtrl')]: true,
                  [getClass(styles, 'fold')]: !props.valueVisible(),
                }}
                onClick={() => controller.valueVisible = !controller.valueVisible }
              >
                {'>'}
              </span>
              <span>{props.name()}</span>
              <FieldOperations />
            </div>
          )
        }
        default:
      }
      return (
        <div class={getClass(styles, 'fieldName')}>
          {props.name()}
          <FieldOperations />
        </div>
      )
    }

    const Value = (props: Props) => {
      const value = controller.getValue();

      switch(controller.type) {
        case 'object': {
          return (
            <div
              classList={{
                [getClass(styles, 'fieldValue')]: true,
                [getClass(styles, 'fold')]: !props.valueVisible(),
              }}
            >
              {props.children}
            </div>
          )
        }
        case 'array': {
          const onAddItem = async () => {
            await controller.onValueChange({
              source: 'operation',
              value: 'addItem',
            });
          }
          return (
            <div
              classList={{
                [getClass(styles, 'fieldValue')]: true,
                [getClass(styles, 'fold')]: !props.valueVisible(),
              }}
            >
              {props.children}
              <div class={getClass(styles, 'operations')}>
                <button onClick={onAddItem}>+ add item</button>
              </div>
            </div>
          )
        }
        case 'string': {
          const [valueDisplay, setValueDisplay] = createSignal({ value });
          controller.viewCtx.setValue = (value: string) => setValueDisplay({ value });
          const onInput = async (e) => {
            await controller.onValueChange({
              source: 'input',
              value: String(e.target?.value),
            });
          }
          return (
            <input class={getClass(styles, 'fieldValue')} type={'text'} value={valueDisplay()?.value} onInput={onInput} />
          )
        }
        case 'float':
        case 'integer':
        case 'number': {
          const [valueDisplay, setValueDisplay] = createSignal({ value });
          controller.viewCtx.setValue = (value: number) => setValueDisplay({ value });
          const onInput = async (e) => {
            let valueCur = e.target?.value;
            if (valueCur.trim() !== '') {
              valueCur = Number(valueCur);
            }
            await controller.onValueChange({
              source: 'input',
              value: valueCur,
            });
          }
          return (
            <input class={getClass(styles, 'fieldValue')} type={'text'} value={valueDisplay()?.value} onInput={onInput} />
          )
        }
        case 'boolean': {
          const [valueDisplay, setValueDisplay] = createSignal({ value });
          controller.viewCtx.setValue = (value: boolean) => setValueDisplay({ value });
          const values = [true, false];
          const name = controller.utils.genId();
          const onClick = async (e) => {
            if (e.target?.checked) {
              await controller.onValueChange({
                source: 'input',
                value: e.target?.value === 'true',
              });
            }
          }
          return (
            <div class={getClass(styles, 'fieldValue')}>
              <For each={values}>
                  {
                    (v, i) => (
                      <>
                        <input type='radio' name={name} value={String(v)} checked={valueDisplay()?.value === v} onClick={onClick} />
                        <span style={{ 'color': '#fff', 'margin-right': '10px' }}>{String(v)}</span>
                      </>
                    )
                  }
              </For>
            </div>
          )
        }
        case 'enum': {
          const [valueDisplay, setValueDisplay] = createSignal({ value });
          controller.viewCtx.setValue = (value: string) => setValueDisplay({ value });
          const values = (controller?.descriptor?.enum || []).map((v: any) => String(v));
          const name = controller.utils.genId();
          const onClick = async (e) => {
            if (e.target?.checked) {
              await controller.onValueChange({
                source: 'input',
                value: e.target?.value,
              });
            }
          }
          return (
            <div class={getClass(styles, 'fieldValue')}>
              <For each={values}>
                  {
                    (v, i) => (
                      <>
                        <input type='radio' name={name} value={v} checked={valueDisplay()?.value === v} onClick={onClick} />
                        <span style={{ 'color': '#fff', 'margin-right': '10px' }}>{v}</span>
                      </>
                    )
                  }
              </For>
            </div>
          )
        }
        default:
      }
      const [valueDisplay, setValueDisplay] = createSignal({ value });
      controller.viewCtx.setValue = (value: string) => setValueDisplay({ value });
      return (
        <div classList={getClass(styles, 'fieldValue')}>{valueDisplay()?.value}</div>
      )
    }

    const ErrorView = (props: Props) => {
      return (
        <div
          classList={{
            [getClass(styles, 'error')]: true,
            [getClass(styles, 'hidden')]: !props.message(),
          }}
        >
          {props.message()}
        </div>
      )
    }

    const NodeView = () => {
      const [comment, setComment] = createSignal(controller.comment);

      const formatName = (name: string) => {
        if (controller.isArrayItem) {
          return `item-${name}`;
        }
        return name;
      }
      const [name, setName] = createSignal(formatName(controller.name));
      controller.viewCtx.setName = (name: string) => setName(formatName(name));

      const [valueVisible, setValueVisible] = createSignal(controller.valueVisible);
      controller.viewCtx.setValueVisible = (visible: boolean) => setValueVisible(visible);

      const messageOrigin = controller.error?.map(e => e.message).join(';\n');
      const [message, setMessage] = createSignal(messageOrigin);
      controller.viewCtx.setError = (message?: string) => setMessage(message || '');

      const [children, setChildren] = createSignal(controller.children.map((c: FormField) => c.viewCtx.view));
      controller.viewCtx.syncChildren = () => {
        console.log('syncChildren');
        setChildren(controller.children.map((c: FormField) => c.viewCtx.view));
      };

      return (
        <Container>
          <Comment comment={comment} />
          <Label valueVisible={valueVisible} name={name} />
          <Value valueVisible={valueVisible}>
            <For each={children()}>
              {
                (ChildNodeView) => <ChildNodeView key={ChildNodeView.__id__} />
              }
            </For>
          </Value>
          <ErrorView message={message} />
        </Container>
      )
    }
    NodeView.__id__ = controller.id;

    controller.viewCtx.view = NodeView;
  }
}

export function genMountViewSolid(setFormRender?: Function) {
  return function mountViewSolid(form: Form) {
    const { rootFormFiled } = form;
    if (!rootFormFiled) {
      return;
    }

    const { viewCtx: { view: NodeView } } = rootFormFiled;

    setFormRender && setFormRender(<NodeView />);
  }
}