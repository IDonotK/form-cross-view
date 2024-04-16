import { useState, useEffect } from 'react';

import { Form, FormField } from '@form-cross-view/core';
import { genCreateViewReact, genMountViewReact } from '@form-cross-view/react-view';

import './App.css';

function App() {
  const [formRender, setFormRender] = useState((<></>));

  useEffect(() => {
    const descriptor = {
      type: 'object',
      required: true,
      editable: true,
      name: 'test',
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
  //       b: {
  //         type: 'number',
  //         required: true,
  //         min: 1,
  //         max: 18,
  //         defaultValue: 1,
  //         editable: true,
  //       },
  //       c: {
  //         type: 'integer',
  //         required: true,
  //         min: -1,
  //         max: 16,
  //         defaultValue: 2,
  //         editable: true,
  //       },
  //       d: {
  //         type: 'float',
  //         required: true,
  //         defaultValue: 3.1,
  //         editable: true,
  //       },
  //       e: {
  //         type: 'boolean',
  //         required: true,
  //         defaultValue: false,
  //         editable: true,
  //       },
  //       f: {
  //         type: 'enum',
  //         required: true,
  //         enum: ['admin', 'user', 'guest'],
  //         defaultValue: 'admin',
  //         editable: true,
  //       },
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
  }, []);

  const updateForm = async (descriptor: any, value?: any) => {
    const formDiv = document.getElementById('form');
    if (!formDiv) {
      throw Error('missing formDiv');
    }

    const formInstance = new Form(
      formDiv,
      descriptor,
      {
        createView: genCreateViewReact(),
        mountView: genMountViewReact(setFormRender),
      }
    );

    if (value) {
      formInstance.setValue(value);
    }

    formInstance.on(
      'valuechange',
      async (valueNew: any, valueOld: any, field: FormField) => {
        console.log('valueNew', valueNew);
        console.log('valueOld', valueOld);
        console.log('changed field', field);

        if (formInstance.isDirty()) {
          console.log('The form is dirty.');
        } else {
          console.log('The form is clean.');
        }

        if (formInstance.isValid()) {
          console.log('The form is valid.');
        } else {
          console.log('The form is unvalid.');
        }
        
        const error = await formInstance.validate();
        console.log('form error', error);

        const value = formInstance.getValue();
        console.log('form value', value);
      }
    );

    console.log(formInstance);
  }


  return (
    <>
      <div id='form'>{formRender}</div>
    </>
  )
}

export default App
