import { useState } from 'react';
import classnames from 'classnames';
import { Form, FormField } from '@form-cross-view/core';

import stylesDefault from './index.module.scss';

interface Styles { [k: string]: any }

interface Props { [ k: string]: any }

export function genCreateViewReact(styles?: Styles) {
  if (!styles) {
    styles = stylesDefault;
  }

  const getClass = (styles: Styles | undefined, name: string) => {
    return styles?.[name] || name;
  }

  return function createViewReact(controller: FormField) {
    const Container = (props: Props) => {
      return (
        <div className={getClass(styles, 'formField')}>{props.children}</div>
      )
    }

    const Comment = (props: Props) => {
      return (
        <div className={getClass(styles, 'comment')}>{props.comment}</div>
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
          <div className={getClass(styles, 'operations')}>
            <span className={getClass(styles, 'item')} onClick={onMoveUp}>上移</span>
            <span className={getClass(styles, 'item')} onClick={onMoveDown}>下移</span>
            <span className={getClass(styles, 'item')} onClick={onDelete}>删除</span>
            <span className={getClass(styles, 'item')} onClick={onCopy}>复制</span>
          </div>
        )
      }
      switch(controller.type) {
        case 'array':
        case 'object': {
          return (
            <div className={getClass(styles, 'fieldName')}>
              <span
                className={classnames({
                  [getClass(styles, 'valueVisibleCtrl')]: true,
                  [getClass(styles, 'fold')]: !props.valueVisible,
                })}
                onClick={() => controller.valueVisible = !controller.valueVisible }
              >
                {'>'}
              </span>
              <span>{props.name}</span>
              <FieldOperations />
            </div>
          )
        }
        default:
      }
      return (
        <div className={getClass(styles, 'fieldName')}>
          {props.name}
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
            await controller.onValueChange({
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
          controller.viewCtx.setValue = (value: string) => setValueDisplay(value);
          const onInput = async (e) => {
            const valueCur = String(e.target?.value);
            setValueDisplay(valueCur);
            await controller.onValueChange({
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
          controller.viewCtx.setValue = (value: number) => setValueDisplay(value);
          const onInput = async (e) => {
            let valueCur = e.target?.value;
            setValueDisplay(valueCur);
            if (valueCur.trim() !== '') {
              valueCur = Number(valueCur);
            }
            await controller.onValueChange({
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
      controller.viewCtx.setValue = (value: string) => setValueDisplay(value);
      return (
        <div className={getClass(styles, 'fieldValue')}>{valueDisplay}</div>
      )
    }

    const ErrorView = (props: Props) => {
      return (
        <div
          className={classnames({
            [getClass(styles, 'error')]: true,
            [getClass(styles, 'hidden')]: !props.message,
          })}
        >
          {props.message}
        </div>
      )
    }

    const NodeView = () => {      
      const [comment, setComment] = useState(controller.comment);

      const formatName = (name: string) => {
        if (controller.isArrayItem) {
          return `item-${name}`;
        }
        return name;
      }
      const [name, setName] = useState(formatName(controller.name));
      controller.viewCtx.setName = (name: string) => setName(formatName(name));

      const [valueVisible, setValueVisible] = useState(controller.valueVisible);
      controller.viewCtx.setValueVisible = (visible: boolean) => setValueVisible(visible);

      const messageOrigin = controller.error?.map(e => e.message).join(';\n');
      const [message, setMessage] = useState(messageOrigin);
      controller.viewCtx.setError = (message?: string) => setMessage(message || '');

      const [children, setChildren] = useState(controller.children.map((c: FormField) => c.viewCtx.view));
      controller.viewCtx.syncChildren = () => {
        console.log('syncChildren');
        setChildren(controller.children.map((c: FormField) => c.viewCtx.view));
      };
  
      return (
        <Container>
          <Comment comment={comment} />
          <Label valueVisible={valueVisible} name={name} />
          <Value valueVisible={valueVisible}>
            {
              children.map((ChildNodeView) => <ChildNodeView key={ChildNodeView.__id__} />)
            }
          </Value>
          <ErrorView message={message} />
        </Container>
      )
    }
    NodeView.__id__ = controller.id;

    controller.viewCtx.view = NodeView;
  }
}

export function genMountViewReact(setFormRender?: Function) {
  return function mountViewReact(form: Form) {
    const { rootFormFiled } = form;
    if (!rootFormFiled) {
      return;
    }

    const { viewCtx: { view: NodeView } } = rootFormFiled;

    setFormRender && setFormRender(<NodeView />);
  }
}