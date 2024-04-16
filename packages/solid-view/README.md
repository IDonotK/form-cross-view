
form-cross-view 是一个跨视图动态表单生成框架，它是基于并扩展了 [async-validator](https://github.com/yiminghe/async-validator) 数据描述规范， 分离了表单逻辑与视图，支持自定义基于不同业务框架、UI 组件库的视图。

你可能出于以下原因选择 form-cross-view，当然前提是你需要一个表单生成组件：
1. 你需要自定义表单视图，但又不想写表单逻辑（动态渲染、数据收集、数据验证等），一种场景是社区当前没有较好的表单生成方案适合你项目所使用的业务框架（如 Solid）、UI 组件库（如 Hope UI）；
2. 你不想写繁琐的 JSON Schema，并且在某些情况下，你需要自定义单个字段的同步或异步校验逻辑。

另外，form-cross-view 内置了一些视图组件，可开箱即用，同时作为自定义视图的参考范例，包括原生 DOM、React、Solid、Vue。

<a href="https://github.com/IDonotK/form-cross-view" target="_blank">点击打开详细说明</a>

<img style="max-width: 500px" src="./demo.gif">