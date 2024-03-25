import { Styles, DescriptorCompiled } from "../Form";
import FormNode from '../FormNode';

const getClass = (styles: Styles, name: string) => {
  return styles?.[name] || name;
}

export function createViewSolid(node: FormNode, styles: Styles) {
  const {
    fieldName, type, comment,
  } = node;

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
    let label = fieldName;
    if (node.controller.isArrayItem) {
      label = `item-${label}`;
    }
    const FieldOperations = () => {
      if (!node.controller.isArrayItem) {
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
            <span>{label}</span>
            <FieldOperations />
          </div>
        )
      }
      case 'method': {
        return (
          <div class={getClass(styles, 'fieldName')}>
            <span>{label}</span>
            <button
              onClick={() => node.controller?.form?.blockly?.open(node.controller) }
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
        {label}
        <FieldOperations />
      </div>
    )
  }

  const Value = (props: any) => {
    const value = node.controller.getValue();

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
        const name = genId();
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
            const func = node.controller!.form!.blockly!.cullCodeBlockly(value);
            valueFormated = func.toString();
          } catch (e) {
            console.log(e);
          }
          return valueFormated;
        }
        const [valueDisplay, setValueDisplay] = createSignal({ value: formatValue(value) });
        node.viewCtx.setValue = (value: Function) => setValueDisplay({ value: formatValue(value) });
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
        const values = (node.controller?.descriptor?.enum || []).map((v: any) => String(v));
        const name = genId();
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

  const Error = (props: any) => {
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
    const [valueVisible, setValueVisible] = createSignal(node.valueVisible);
    node.viewCtx.displayValue = () => setValueVisible(true);
    node.viewCtx.hideValue = () => setValueVisible(false);

    const messageOrigin = node.controller.error?.map(e => e.message).join(';\n');
    const [message, setMessage] = createSignal(messageOrigin);
    node.viewCtx.displayError = (message: string) => setMessage(message);
    node.viewCtx.hideError = () => setMessage('');

    return (
      <Container>
        <Comment />
        <Label valueVisible={valueVisible} />
        <Value valueVisible={valueVisible} >{props.children}</Value>
        <Error message={message}/>
      </Container>
    )
  }

  node.viewCtx.view = NodeView;

  const [children, setChildren] = createSignal([] as ViewCtx[]);
  node.viewCtx.children = children;
  node.viewCtx.childrenUntrack = [];
  node.viewCtx.addChild = (_node: FormNode) => {
    const { childrenUntrack } = node.viewCtx;
    node.controller.utils.addArrayItem(childrenUntrack, _node.viewCtx);
    setChildren([...(childrenUntrack)]);
  };
  node.viewCtx.moveChild = (_node: FormNode, gap: number = 1) => {
    const { childrenUntrack } = node.viewCtx;
    const moveSuccess = node.controller.utils.moveArrayItem(childrenUntrack, _node.viewCtx, gap);
    if (moveSuccess) {
      setChildren([...(childrenUntrack)]);
    }
  };
  node.viewCtx.removeChild = (_node: FormNode) => {
    const { childrenUntrack } = node.viewCtx;
    node.controller.utils.removeArrayItem(childrenUntrack, _node.viewCtx);
    setChildren([...childrenUntrack]);
  };
}

export function mountViewSolid(form: Form, setFormRender) {
  const FieldRender = (props: any) => {
    const { view: NodeView, children } = props.node;
    return (
      <NodeView>
        <For each={children()}>
          {
            (sr, i) => (
              <FieldRender node={sr} />
            )
          }
        </For>
      </NodeView>
    )
  }

  const FormRender = (props: any) => {
    const rootNode = form?.rootFormFiled?.node?.viewCtx;
    return (
      <FieldRender node={rootNode} />
    )
  }

  setFormRender(FormRender);
}