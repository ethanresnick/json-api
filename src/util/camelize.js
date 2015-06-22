export default function(str) {
  return str.replace(/[_.-](\w|$)/g, (_, x) => x.toUpperCase());
}
