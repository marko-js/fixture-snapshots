module.exports = {
  renderBody: out => out.w("<p>Hello</p>"),
  model: Promise.resolve("Async content")
};
