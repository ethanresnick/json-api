export default function(str) {
  return str.replace(/(?!^)[-](\w|$)/g, (_, x) => x.toUpperCase());
}
