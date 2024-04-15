import typescript from 'rollup-plugin-typescript2';
import resolve from "@rollup/plugin-node-resolve";

export default {
	input: 'index.ts',
	output: {
		file: 'dist/index.js',
    name: 'form-cross-view',
		format: 'es'
	},
  plugins: [
    typescript(),
		resolve()
  ]
};