import { createSignal, onMount } from 'solid-js';

import { Form } from 'form-cross-view-core';
import { genCreateViewSolid, genMountViewSolid } from 'form-cross-view-solid';
import 'form-cross-view-solid/dist/style.css';

import './App.css';

function App() {
  const [formRender, setFormRender] = createSignal(() => (<></>));

  onMount(() => {
    const descriptor = {
      type: 'object',
      required: true,
      editable: true,
      comment: `
  1.小车装有超声波传感器，可检测到前方的石头；
  2.请补充小车的控制逻辑，将石头移出圆形区域。
      `,
      fields: {
        a: {
          type: 'string',
          required: true,
          defaultValue: 'hello',
          comment: 'a 的注释',
          editable: true,
        },
        b: {
          type: 'number',
          required: true,
          min: 1,
          max: 18,
          defaultValue: 1,
          editable: true,
        },
        c: {
          type: 'integer',
          required: true,
          min: -1,
          max: 16,
          defaultValue: 2,
          editable: true,
        },
        d: {
          type: 'float',
          required: true,
          defaultValue: 3.1,
          editable: true,
        },
        e: {
          type: 'boolean',
          required: true,
          defaultValue: false,
          editable: true,
        },
        f: {
          type: 'enum',
          required: true,
          enum: ['admin', 'user', 'guest'],
          defaultValue: 'admin',
          editable: true,
        },
        vertices: {
          type: 'array',
          editable: true,
          comment: `
  数组多行注释
  数组多行注释
          `,
          defaultField: {
            type: 'array',
            len: 2,
            editable: true,
            defaultField: {
              type: 'number',
              required: true,
              editable: true,
              defaultValue: 0,
            }
          },
          defaultValue: [[-0.5, -0.5]],
        },
      },
    }

    updateForm(descriptor);
  });

  const updateForm = async (descriptor: any, value?: any) => {
    const formDiv = document.getElementById('form');
    if (!formDiv) {
      throw Error('missing formDiv');
    }
    formDiv.innerHTML = '';

    const formInstance = new Form(
      formDiv,
      descriptor,
      {
        createView: genCreateViewSolid(),
        mountView: genMountViewSolid(setFormRender),
      }
    );

    console.log(formInstance);
  }

  return (
    <>
      <div class='formContainer'>
        <div id='form'>{formRender()}</div>
      </div>
    </>
  )
}

export default App
