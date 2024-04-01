import { createSignal, For } from 'solid-js';
import { Form, FormNode } from 'form-cross-view-core';

import stylesDefault from './index.module.scss';

export type Styles = { [k: string]: any }

export function genCreateViewSolid(styles?: Styles) {
  if (!styles) {
    styles = stylesDefault;
  }

  const getClass = (styles: Styles, name: string) => {
    return styles?.[name] || name;
  }

  return function createViewSolid(node: FormNode) {
    const { controller } = node;
    if (!controller) {
      throw Error('missing controller');
    }

    const {
      name: fieldName, type, comment,
    } = controller;

    const Container = (props: any) => {
      return (
        <div class={getClass(styles, 'formField')}>{props.children}</div>
      )
    }

    const Comment = (props: any) => {
      return (
        <div class={getClass(styles, 'comment')}>{comment}</div>
      )
    }

    const Label = (props: any) => {
      const FieldOperations = () => {
        if (!controller.isArrayItem) {
          return (<></>);
        }

        const onMoveUp = async () => {
          await node.onViewChange({
            source: 'operation',
            value: 'moveUp',
          });
        }

        const onMoveDown = async () => {
          await node.onViewChange({
            source: 'operation',
            value: 'moveDown',
          });
        }

        const onDelete = async () => {
          await node.onViewChange({
            source: 'operation',
            value: 'delete',
          });
        }

        const onCopy = async () => {
          await node.onViewChange({
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
      switch(type) {
        case 'array':
        case 'object': {
          return (
            <div class={getClass(styles, 'fieldName')}>
              <span
                classList={{
                  [getClass(styles, 'valueVisibleCtrl')]: true,
                  [getClass(styles, 'fold')]: !props.valueVisible(),
                }}
                onClick={() => node.valueVisible = !node.valueVisible }
              >
                {'>'}
              </span>
              <span>{props.name()}</span>
              <FieldOperations />
            </div>
          )
        }
        case 'method': {
          return (
            <div class={getClass(styles, 'fieldName')}>
              <span>{props.name()}</span>
              <button
                onClick={() => controller?.form?.blockly?.open(controller) }
              >
                {'open blockly'}
              </button>
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

    const Value = (props: any) => {
      const value = controller.getValue();

      switch(type) {
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
            await node.onViewChange({
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
          node.viewCtx.setValue = (value: string) => setValueDisplay({ value });
          const onInput = async (e) => {
            await node.onViewChange({
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
          node.viewCtx.setValue = (value: number) => setValueDisplay({ value });
          const onInput = async (e) => {
            let valueCur = e.target?.value;
            if (valueCur.trim() !== '') {
              valueCur = Number(valueCur);
            }
            await node.onViewChange({
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
          node.viewCtx.setValue = (value: boolean) => setValueDisplay({ value });
          const values = [true, false];
          const name = controller.utils.genId();
          const onClick = async (e) => {
            if (e.target?.checked) {
              await node.onViewChange({
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
        case 'method': {
          const formatValue = (value: Function) => {
            let valueFormated = '';
            try {
              const func = controller!.form!.blockly!.cullCodeBlockly(value);
              valueFormated = func.toString();
            } catch (e) {
              console.log(e);
            }
            return valueFormated;
          }
          const [valueDisplay, setValueDisplay] = createSignal({ value: formatValue(value) });
          node.viewCtx.setValue = (value: Function) => setValueDisplay({
            value: formatValue(value)
          });
          return (
            <div
              classList={{
                [getClass(styles, 'fieldValue')]: true,
                [getClass(styles, 'simpleValue')]: true,
              }}
            >
              {valueDisplay()?.value}
            </div>
          )
        }
        case 'enum': {
          const [valueDisplay, setValueDisplay] = createSignal({ value });
          node.viewCtx.setValue = (value: string) => setValueDisplay({ value });
          const values = (controller?.descriptor?.enum || []).map((v: any) => String(v));
          const name = controller.utils.genId();
          const onClick = async (e) => {
            if (e.target?.checked) {
              await node.onViewChange({
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
      node.viewCtx.setValue = (value: string) => setValueDisplay({ value });
      return (
        <div classList={getClass(styles, 'fieldValue')}>{valueDisplay()?.value}</div>
      )
    }

    const ErrorView = (props: any) => {
      return (
        <div
          classList={{
            [styles.error || 'error']: true,
            [styles.hidden || 'hidden']: !props.message(),
          }}
        >
          {props.message()}
        </div>
      )
    }

    const NodeView = (props: any) => {
      const formatName = (name: string) => {
        if (controller.isArrayItem) {
          return `item-${name}`;
        }
        return name;
      }
      const [name, setName] = createSignal(formatName(fieldName));
      node.viewCtx.setName = (name: string) => setName(formatName(name));

      const [valueVisible, setValueVisible] = createSignal(node.valueVisible);
      node.viewCtx.setValueVisible = (visible: boolean) => setValueVisible(visible);

      const messageOrigin = controller.error?.map(e => e.message).join(';\n');
      const [message, setMessage] = createSignal(messageOrigin);
      node.viewCtx.setError = (message?: string) => setMessage(message || '');

      return (
        <Container>
          <Comment />
          <Label valueVisible={valueVisible} name={name} />
          <Value valueVisible={valueVisible} >{props.children}</Value>
          <ErrorView message={message}/>
        </Container>
      )
    }

    node.viewCtx.view = NodeView;

    const [children, setChildren] = createSignal([] as ViewCtx[]);
    node.viewCtx.children = children;
    node.viewCtx.syncChildren = () => {
      const { children } = node;
      setChildren([...children]);
    };
  }
}

export function genMountViewSolid(setFormRender?: Function) {
  return function mountViewSolid(form: Form) {
    const FieldRender = (props: any) => {
      // eslint-disable-next-line solid/reactivity
      const { node } = props;
      if (!node) {
        return null;
      }
      const { viewCtx: { view: NodeView, children } } = node;
      return (
        <NodeView>
          <For each={children()}>
            {
              (n, i) => (
                <FieldRender node={n} />
              )
            }
          </For>
        </NodeView>
      )
    }

    const FormRender = () => {
      const rootNode = form?.rootFormFiled?.node;
      return (
        <FieldRender node={rootNode} />
      )
    }

    setFormRender && setFormRender(FormRender);
  }
}