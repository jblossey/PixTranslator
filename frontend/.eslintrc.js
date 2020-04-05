module.exports = {
    env: {
        "commonjs": true,
        "es6": true,
        "node": true,
        "jquery": true
    },
    extends: [
      "airbnb-base"
    ],
    plugins: [
      "@babel/plugin-proposal-private-methods"
    ]
};