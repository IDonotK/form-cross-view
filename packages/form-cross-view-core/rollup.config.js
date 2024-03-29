import typescript from 'rollup-plugin-typescript2';

export default {
	input: 'index.ts',
	output: {
		file: 'dist/index.js',
    name: 'form-cross-view',
		format: 'es'
	},
  plugins: [
    typescript()
  ]
};