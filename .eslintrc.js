module.exports = {
  extends: [
    // add more generic rulesets here, such as:
    // 'eslint:recommended',
    'plugin:vue/vue3-recommended'
  ],
  parserOptions: {
    "parser": "babel-eslint",
    "ecmaVersion": 2017,
    "sourceType": "module"
  },
  rules: {
    // override/add rules settings here, such as:
    'no-dupe-class-members': 'off',
    'vue/no-v-html': 'off',
    'vue/component-tags-order' : 'off'
  }
}