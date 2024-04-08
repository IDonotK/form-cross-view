import { ref, shallowRef, provide, inject } from 'vue';
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
      props: ['comment'],
      setup() {
        return {
          styles,
          getClass,
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
          <span :class="{[getClass(styles, 'item')]: true}" @click="onMoveUp">上移</span>
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
          controller,
        }
      },
      template: (function() {
        switch(controller.type) {
          case 'array':
          case 'object': {
            return `
              <div :class="{[getClass(styles, 'fieldName')]: true}">
                <span
                  :class="{
                    [getClass(styles, 'valueVisibleCtrl')]: true,
                    [getClass(styles, 'fold')]: !valueVisible,
                  }"
                  @click="() => node.valueVisible = !node.valueVisible"
                >
                  {{'>'}}
                </span>
                <span>{{name}}</span>
                <FieldOperations v-if="controller.isArrayItem" />
              </div>
            `
          }
          default:
        }
        return `
          <div :class="{[getClass(styles, 'fieldName')]: true}">
            {{name}}
            <FieldOperations v-if="controller.isArrayItem" />
          </div>
        `
      })(),
    }

    const Value = (function() {
      switch(controller.type) {
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
                  <button @click="onAddItem">+ add item</button>
                </div>
              </div>
            `
          }
        }
        case 'string': {
          return {
            setup() {
              const value = controller.getValue();
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
              const value = controller.getValue();
              const valueDisplay = ref(value);
              node.viewCtx.setValue = (value: number) => valueDisplay.value = value;
              const onInput = async (e) => {
                let valueCur = e.target?.value;
                valueDisplay.value = valueCur;
                if (valueCur.trim() !== '') {
                  valueCur = Number(valueCur);
                }
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
                :value="valueDisplay"
                @input="onInput"
              />
            `,
          }
        }
        default:
      }
      return {
        setup() {
          const value = controller.getValue();
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
        const comment = ref(controller.comment);

        const formatName = (name: string) => {
          if (controller.isArrayItem) {
            return `item-${name}`;
          }
          return name;
        }
        const name = ref(formatName(controller.name));
        node.viewCtx.setName = (_name: string) => name.value = formatName(_name);

        const valueVisible = ref(node.valueVisible);
        node.viewCtx.setValueVisible = (visible: boolean) => valueVisible.value = visible;

        const messageOrigin = controller.error?.map(e => e.message).join(';\n');
        const message = ref(messageOrigin);
        node.viewCtx.setError = (_message?: string) => message.value = (_message || '');

        const children = shallowRef(node.children.map((c: FormNode) => c.viewCtx.view));
        node.viewCtx.syncChildren = () => {
          console.log('syncChildren');
          children.value = node.children.map((c: FormNode) => c.viewCtx.view);
        };

        return {
          styles,
          getClass,
          comment,
          name,
          valueVisible,
          message,
          children,
        }
      },
      template: `
        <Container>
          <Comment :comment="comment" />
          <Label :valueVisible="valueVisible" :name="name" />
          <Value :valueVisible="valueVisible" >
            <template v-for="child in children" :key="child.__id__">
              <component :is="child" />
            </template>
          </Value>
          <ErrorView :message="message" />
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