# storyflow
极客的笔记本

# 技术方案

inline实现

symbol+tab symbol颜色变浅
输入文字 连带文字颜色也变浅
match-symbol+tba symbol消失，文字颜色变正常, 光标移出

```js
`
![]  ->  ![$]($)
[]   ->  [$]($)
**   ->  **$**
***  ->  ***$***
~~   ->  ~~$~~
\`   ->  \`$\`
#    ->  # $
>    ->  > $


`
```


