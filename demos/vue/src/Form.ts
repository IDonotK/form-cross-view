import { ref } from 'vue';

import styles from './Form.module.scss';

export default {
  setup() {
    const count = ref(0);

    const s = ref(styles);

    function increment() {
      count.value++;
    }

    return {
      count,
      increment,
      s,
    }
  },
  template: `
<button :class="{[s.menu]: true}" @click="increment">
  {{ count }}
</button>
`,
}