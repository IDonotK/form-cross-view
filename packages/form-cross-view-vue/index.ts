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

  return function createViewVue(node: FormNode) {
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
                    [getClass(styles, 'fold')]: !valueVisible,
                  }"}
                  @click="() => node.valueVisible = !node.valueVisible"
                >
                  {{'>'}}
                </span>
                <span>{{name}}</span>
                <FieldOperations v-if="node.isArrayItem" />
              </div>
            )`
          }
          default:
        }
        return `
          <div :class="{[getClass(styles, 'fieldName')]: true}">
            {{name}}
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
                  [getClass(styles, 'fold')]: !valueVisible,
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
                  [getClass(styles, 'fold')]: !valueVisible,
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
          return {
            setup() {
              const valueDisplay = ref(value);
              node.viewCtx.setValue = (value: string) => valueDisplay.value = value;
              const onInput = async (e) => {
                const valueCur = String(e.target?.value);
                await node.onViewChange({
                  source: 'input',
                  value: valueCur,
                });
              }
              return {
                styles,
                getClass,
                valueDisplay,
                onInput,
              }
            },
            template: `
              <input
                :class="{[getClass(styles, 'fieldValue')]: true}"
                type="'text'"
                v-model="valueDisplay"
                @input="onInput"
              />
            `,
          }
        }
        case 'float':
        case 'integer':
        case 'number': {
          return {
            setup() {
              const valueDisplay = ref(value);
              node.viewCtx.setValue = (value: number) => valueDisplay.value = value;
              const onInput = async (e) => {
                const valueCur = e.target?.value;
                await node.onViewChange({
                  source: 'input',
                  value: valueCur,
                });
              }
              return {
                styles,
                getClass,
                valueDisplay,
                onInput,
              }
            },
            template: `
              <input
                :class="{[getClass(styles, 'fieldValue')]: true}"
                type="'text'"
                v-model="valueDisplay"
                @input="onInput"
              />
            `,
          }
        }
        default:
      }
      return {
        setup() {
          const valueDisplay = ref(value);
          node.viewCtx.setValue = (value: any) => valueDisplay.value = value;
          return {
            styles,
            getClass,
            valueDisplay,
          }
        },
        template: `
          <div :class="{[getClass(styles, 'fieldValue')]: true}">{{valueDisplay}}</div>
        `,
      }
    })();

    const ErrorView = {
      props: ['message'],
      setup() {
        return {
          styles,
          getClass,
        }
      },
      template: `
        <div
          :class="{
            [getClass(styles, 'error')]: true,
            [getClass(styles, 'hidden')]: !message,
          }"
        >
          {{message}}
        </div>
      `
    }

    const NodeView = {
      __id__: controller.id,
      components: {
        Container,
        Comment,
        Label,
        Value,
        ErrorView,
      },
      setup() {
        const formatName = (name: string) => {
          if (controller.isArrayItem) {
            return `item-${name}`;
          }
          return name;
        }
        const name = ref(formatName(fieldName));
        node.viewCtx.setName = (_name: string) => name.value = formatName(_name);

        const valueVisible = ref(node.valueVisible);
        node.viewCtx.setValueVisible = (visible: boolean) => valueVisible.value = visible;

        const messageOrigin = controller.error?.map(e => e.message).join(';\n');
        const message = ref(messageOrigin);
        node.viewCtx.setError = (_message?: string) => message.value = (_message || '');

        const children = ref(node.children.map((c: FormNode) => c.viewCtx.view));
        node.viewCtx.syncChildren = () => {
          console.log('syncChildren');
          const { children } = node;
          children.value = children.map((c: FormNode) => c.viewCtx.view);
        };

        return {
          styles,
          getClass,
          name,
          valueVisible,
          messageOrigin,
          children,
        }
      },
      template: `
        <Container>
          <Comment />
          <Label :valueVisible="valueVisible" :name="name" />
          <Value :valueVisible="valueVisible" >
            <template v-for="child in children" :key="child.__id__">
              <child />
            </template>
          </Value>
          <ErrorView :message="message"/>
        </Container>
      `
    }

    node.viewCtx.view = NodeView;
  }
}

export function genMountViewVue(setFormRender?: Function) {
  return function mountViewVue(form: Form) {
    const rootNode = form?.rootFormFiled?.node;
    if (!rootNode) {
      return;
    }

    const { viewCtx: { view: NodeView } } = rootNode;

    setFormRender && setFormRender(NodeView);
  }
}