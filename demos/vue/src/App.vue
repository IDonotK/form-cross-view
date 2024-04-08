<script setup lang="ts">
  import { onMounted, defineAsyncComponent } from 'vue';
  // import FormTest from './Form';

  import { Form } from 'form-cross-view-core';
  import { genCreateViewVue, genMountViewVue } from 'form-cross-view-vue';
  import 'form-cross-view-vue/dist/style.css';

  let setFormRender: (form: any) => void;
  const FormRender = defineAsyncComponent(() => {
    return new Promise((resolve) => {
      setFormRender = resolve;
    });
  });

  onMounted(() => {
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
          createView: genCreateViewVue(),
          mountView: genMountViewVue(setFormRender),
        }
      );

      console.log(formInstance);
    }

    updateForm(descriptor);

    // setFormRender(FormTest);
  });
</script>

<template>
    <div className='formContainer'>
      <div id='form'><FormRender /></div>
    </div>
</template>

<style scoped>

</style>
