import { ref, provide, inject } from 'vue';
import { Form, FormNode } from 'form-cross-view-core';

import stylesDefault from './index.module.scss';

export type Styles = { [k: string]: any }

export function genCreateViewVue(styles?: Styles) {
  if (!styles) {
    styles = stylesDefault;
  }

  const getClass = (styles: Styles | undefined, name: string) => {
    return styles?.[name] || name;
  }

  return function createViewReact(node: FormNode) {
    const { controller } = node;
    if (!controller) {
      throw Error('missing controller');
    }

    const {
      name: fieldName, type, comment,
    } = controller;

    const Container = {
      setup() {
        return {
          styles,
          getClass,
        }
      },
      template: `
        <div :class="{[getClass(styles, 'formField')]: true}">
          <slot />
        </div>
      `,
    }

    const Comment = {
      setup() {
        return {
          styles,
          getClass,
          comment,
        }
      },
      template: `
        <div :class="{[getClass(styles, 'comment')]: true}">
          {{comment}}
        </div>
      `,
    }

    const FieldOperations = {
      setup() {
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

        return {
          styles,
          getClass,
          onMoveUp,
          onMoveDown,
          onDelete,
          onCopy,
        }
      },
      template: `
        <div :class="{[getClass(styles, 'operations')]: true}">
          <span :class="{[getClass(styles, 'item')]: true}" @click=""onMoveUp">上移</span>
          <span :class="{[getClass(styles, 'item')]: true}" @click="onMoveDown">下移</span>
          <span :class="{[getClass(styles, 'item')]: true}" @click="onDelete">删除</span>
          <span :class="{[getClass(styles, 'item')]: true}" @click="onCopy">复制</span>
        </div>
      `,
    }

    const Label = {
      components: {
        FieldOperations,
      },
      props: ['valueVisible', 'name'],
      setup() {
        return {
          styles,
          getClass,
          node,
        }
      },
      template: (function() {
        switch(type) {
          case 'array':
          case 'object': {
            return `
              <div :class="{[getClass(styles, 'fieldName')]: true}">
                <span
                  :class="{
                    [getClass(styles, 'valueVisibleCtrl')]: true,
                    [getClass(styles, 'fold')]: !props.valueVisible,
                  }"}
                  @click="() => node.valueVisible = !node.valueVisible"
                >
                  {{'>'}}
                </span>
                <span>{{props.name}}</span>
                <FieldOperations v-if="node.isArrayItem" />
              </div>
            )`
          }
          default:
        }
        return `
          <div :class="{[getClass(styles, 'fieldName')]: true}">
            {{props.name}}
            <FieldOperations v-if="node.isArrayItem" />
          </div>
        `
      })(),
    }

    const Value = (function() {
      const value = controller.getValue();
      switch(type) {
        case 'object': {
          return {
            props: ['valueVisible'],
            setup() {
              return {
                styles,
                getClass,
              }
            },
            template: `
              <div
                :class="{
                  [getClass(styles, 'fieldValue')]: true,
                  [getClass(styles, 'fold')]: !props.valueVisible,
                }"
              >
                <slot />
              </div>
            `
          }
        }
        case 'array': {
          return {
            props: ['valueVisible'],
            setup() {
              const onAddItem = async () => {
                await node.onViewChange({
                  source: 'operation',
                  value: 'addItem',
                });
              }

              return {
                styles,
                getClass,
                onAddItem,
              }
            },
            template: `
              <div
                :class="{
                  [getClass(styles, 'fieldValue')]: true,
                  [getClass(styles, 'fold')]: !props.valueVisible,
                }"
              >
                <slot />
                <div :class="{[getClass(styles, 'operations')]: true}">
                  <button @lick="onAddItem">+ add item</button>
                </div>
              </div>
            `
          }
        }
        case 'string': {
          const [valueDisplay, setValueDisplay] = useState(value);
          node.viewCtx.setValue = (value: string) => setValueDisplay(value);
          const onInput = async (e) => {
            const valueCur = String(e.target?.value);
            setValueDisplay(valueCur);
            await node.onViewChange({
              source: 'input',
              value: valueCur,
            });
          }
          return (
            <input className={getClass(styles, 'fieldValue')} type={'text'} value={valueDisplay} onInput={onInput} />
          )
        }
        case 'float':
        case 'integer':
        case 'number': {
          const [valueDisplay, setValueDisplay] = useState(value);
          node.viewCtx.setValue = (value: number) => setValueDisplay(value);
          const onInput = async (e) => {
            let valueCur = e.target?.value;
            setValueDisplay(valueCur);
            if (valueCur.trim() !== '') {
              valueCur = Number(valueCur);
            }
            await node.onViewChange({
              source: 'input',
              value: valueCur,
            });
          }
          return (
            <input className={getClass(styles, 'fieldValue')} type={'text'} value={valueDisplay} onInput={onInput} />
          )
        }
        default:
      }
      const [valueDisplay, setValueDisplay] = useState(value);
      node.viewCtx.setValue = (value: string) => setValueDisplay(value);
      return (
        <div className={getClass(styles, 'fieldValue')}>{valueDisplay}</div>
      )
    })()

    const ErrorView = {
      props: ['message'],
      setup() {
        return {
          styles,
          getClass,
          node,
        }
      },
      template: `
        <div
          :class="{
            [getClass(styles, 'error')]: true,
            [getClass(styles, 'hidden')]: !props.message,
          }"
        >
          {props.message}
        </div>
      `
    }

    const Value = (props: any) => {
      const value = controller.getValue();

      switch(type) {
        case 'object': {
          return (
            <div
              className={classnames({
                [getClass(styles, 'fieldValue')]: true,
                [getClass(styles, 'fold')]: !props.valueVisible,
              })}
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
              className={classnames({
                [getClass(styles, 'fieldValue')]: true,
                [getClass(styles, 'fold')]: !props.valueVisible,
              })}
            >
              {props.children}
              <div className={getClass(styles, 'operations')}>
                <button onClick={onAddItem}>+ add item</button>
              </div>
            </div>
          )
        }
        case 'string': {
          const [valueDisplay, setValueDisplay] = useState(value);
          node.viewCtx.setValue = (value: string) => setValueDisplay(value);
          const onInput = async (e) => {
            const valueCur = String(e.target?.value);
            setValueDisplay(valueCur);
            await node.onViewChange({
              source: 'input',
              value: valueCur,
            });
          }
          return (
            <input className={getClass(styles, 'fieldValue')} type={'text'} value={valueDisplay} onInput={onInput} />
          )
        }
        case 'float':
        case 'integer':
        case 'number': {
          const [valueDisplay, setValueDisplay] = useState(value);
          node.viewCtx.setValue = (value: number) => setValueDisplay(value);
          const onInput = async (e) => {
            let valueCur = e.target?.value;
            setValueDisplay(valueCur);
            if (valueCur.trim() !== '') {
              valueCur = Number(valueCur);
            }
            await node.onViewChange({
              source: 'input',
              value: valueCur,
            });
          }
          return (
            <input className={getClass(styles, 'fieldValue')} type={'text'} value={valueDisplay} onInput={onInput} />
          )
        }
        default:
      }
      const [valueDisplay, setValueDisplay] = useState(value);
      node.viewCtx.setValue = (value: string) => setValueDisplay(value);
      return (
        <div className={getClass(styles, 'fieldValue')}>{valueDisplay}</div>
      )
    }

    const NodeView = (props: any) => {
      const { node } = props;
      
      const formatName = (name: string) => {
        if (controller.isArrayItem) {
          return `item-${name}`;
        }
        return name;
      }
      const [name, setName] = useState(formatName(fieldName));
      node.viewCtx.setName = (name: string) => setName(formatName(name));

      const [valueVisible, setValueVisible] = useState(node.valueVisible);
      node.viewCtx.setValueVisible = (visible: boolean) => setValueVisible(visible);

      const messageOrigin = controller.error?.map(e => e.message).join(';\n');
      const [message, setMessage] = useState(messageOrigin);
      node.viewCtx.setError = (message?: string) => setMessage(message || '');

      const [children, setChildren] = useState(node.children);
      node.viewCtx.syncChildren = () => {
        console.log('syncChildren');
        const { children } = node;
        setChildren([...children]);
      };
  
      return (
        <Container>
          <Comment />
          <Label valueVisible={valueVisible} name={name} />
          <Value valueVisible={valueVisible} >
            {
              children.map((n: FormNode) => {
                const {
                  viewCtx: { view: NodeView }, controller: { id }
                } = n;
                return <NodeView key={id} node={n} />
              })
            }
          </Value>
          <ErrorView message={message}/>
        </Container>
      )
    }

    node.viewCtx.view = NodeView;
  }
}

export function genMountViewVue(setFormRender?: Function) {
  return function mountViewReact(form: Form) {
    const rootNode = form?.rootFormFiled?.node;
    if (!rootNode) {
      return;
    }

    const { viewCtx: { view: NodeView } } = rootNode;

    setFormRender && setFormRender(() => (<NodeView node={rootNode} />));
  }
}